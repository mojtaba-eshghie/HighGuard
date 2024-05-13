const fs = require('fs');
const path = require('path');
const solc = require('solc');
const axios = require('axios');
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const deployLogger = getLogger('deploy');
const chalk = require('chalk');

/**
 * Extracts the Solidity compiler version from the provided source code.
 * 
 * @param {string} source - The Solidity source code.
 * @returns {string} - The extracted Solidity compiler version.
 * @throws {Error} - Throws an error if no valid pragma directive is found in the source.
 */
function extractSolcVersion(source) {
    const match = source.match(/^pragma solidity (\^?\d+\.\d+\.\d+);/m);
    if (match) {
        return match[1].slice(1);  // remove the '^' character
    }
    throw new Error('No valid pragma directive found in the Solidity source.');
}

/**
 * Fetches the available Solidity compiler versions from the official repository.
 * 
 * @returns {Object} - An object containing the available Solidity compiler versions.
 * @throws {Error} - Throws an error if there's an issue fetching the versions.
 */
async function getSolcVersions() {
    try {
        const response = await axios.get('https://binaries.soliditylang.org/bin/list.json', { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error("Error fetching versions:", error);
        throw error;
    }
}

/**
 * Callback function to resolve imports when compiling.
 * 
 * @param {string} importPath - The import path specified in the solidity smart contract.
 * @returns {string} - A string containing the source code of the imported solidity smart contract.
 * @throws {Error} - Throws an error if the specified contract is not found.
 */
function findImports(importPath) {
    let absolutePath;

    if (importPath.charAt(0) == '@') {
        absolutePath = path.resolve(__dirname, '..', '..',  'node_modules', importPath);
    }
    else {
        absolutePath = path.resolve(__dirname, '..', '..', 'contracts', 'src', importPath);
    }
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
  }

async function compileWithVersion(source, contractFileName, contractIdentifier, version) {
    const solcVersions = await getSolcVersions();
    const exactVersion = solcVersions.releases[`${version}`];

    //console.log(chalk.cyan(`We are compiling contract #${contractFileName}, #contractIdentifier: ${contractIdentifier}, #version: ${version}, #source: ${source}`));

    if (!exactVersion) {
        throw new Error(`Exact version for ${version} not found in solc releases.`);
    }

    const cacheDir = path.join(__dirname, '..', '..', 'cache', 'compilers');
    const cachedFile = path.join(cacheDir, exactVersion);

    let solcSource;

    // Check if the compiler is cached
    if (fs.existsSync(cachedFile)) {
        solcSource = fs.readFileSync(cachedFile, 'utf8');
    } else {

        // Download the compiler and cache it
        const solcUrl = `https://binaries.soliditylang.org/bin/${exactVersion}`;
        const response = await axios.get(solcUrl, { timeout: 10000 });
        solcSource = response.data;


        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Save the compiler to the cache
        fs.writeFileSync(cachedFile, solcSource, 'utf8');
    }

    const solcInstance = solc.setupMethods(requireFromString(solcSource));
    //let fileName = `${contractFileName}.sol`;

    const input = {
        language: 'Solidity',
        sources: {
            [contractFileName]: {
                content: source
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };
    
    const output = JSON.parse(solcInstance.compile(JSON.stringify(input), {import: findImports}));
    
    //console.log(chalk.cyan(JSON.stringify(output)))
    const contract = output.contracts[contractFileName][contractIdentifier];
    //console.cyan(`Compiling contract ${contractFileName}`);
    return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
    };
}



/**
 * Requires a module from a string source.
 * 
 * @param {string} src - The module source code as a string.
 * @param {string} [filename='unknown'] - The filename for the module.
 * @returns {Object} - The exported module object.
 */
function requireFromString(src, filename = 'unknown') {
    const m = new module.constructor();
    m.paths = module.paths;
    m._compile(src, filename);
    return m.exports;
}


/**
 * Deploys a contract to the Ethereum network.
 * 
 * @param {Object} web3 - The Web3 instance.
 * @param {Array} abi - The ABI of the contract.
 * @param {string} bytecode - The bytecode of the contract.
 * @param {Object} envInfo - Environment information including accounts.
 * @param {Array} constructorParameters - The parameters for the contract's constructor.
 * @returns {Object} - The deployed contract instance.
 * @throws {Error} - Throws an error if there's an issue deploying the contract.
 */
async function deployContract(web3, abi, bytecode, envInfo, constructorParameters) {
    const contract = new web3.eth.Contract(abi);

    // Estimate gas
    const gasEstimate = await contract.deploy({ data: bytecode, arguments: constructorParameters }).estimateGas({
        from: envInfo.accounts[0]
    });

    let deployedContract;
    try {
        deployedContract = await contract.deploy({ data: bytecode, arguments: constructorParameters }).send({
            from: envInfo.accounts[0],
            gas: gasEstimate,
            gasPrice: '30000000000000'
        });
    } catch (error) {
        console.error("Error deploying the contract:", error);
        throw error;
    }
    return deployedContract;
}


/**
 * Generates the ABI (Application Binary Interface) for a given smart contract.
 * 
 * @param {string} contractFileName - The name of the smart contract file (without the .sol extension).
 * @returns {Object} - The ABI of the specified smart contract.
 * @throws {Error} - Throws an error if there's an issue reading the file or compiling the contract.
 */
let getContractABI = async (contractSource, contractFileName, contractIdentifier) => {  
    try {
        console.log(chalk.blue(`\ncontractFileName: ${contractFileName}, \ncontractIdentifier: ${contractIdentifier}`))
        // Extract the Solidity compiler version from the source code
        const solcVersion = extractSolcVersion(contractSource);

        // Compile the contract with the extracted version
        const compiledContract = await compileWithVersion(contractSource, contractFileName, contractIdentifier, solcVersion);
        return compiledContract.abi;
    } catch (error) {
        console.error(`Error generating ABI for ${contractFileName}:`, error);
        throw error;
    }
}

let retrieveConstructorParameters = async (constructorParamSpecs, web3, envInfo) => {
    let parameters = [];

    accountsIndex = 0;
    constructorParamSpecs.forEach((item, index, array) => {
        if (item.sourceType == "dynamic") {
            if (item.source.type == "EOA") {
                parameters.push(envInfo.accounts[accountsIndex]);
                accountsIndex++;
            } else if (item.source.type == "contract") {
                deployLogger.error(`Contract constructor parameter source type type not yet implemented`);
                throw new Error(`Contract constructor parameter source type type not yet implemented`)
            } else {
                deployLogger.error(`Constructor parameter specs source type is neither "EOA" nor "contract`);
                throw new Error('Constructor parameter specs source type is neither "EOA" nor "contract');
            }
        } else if (item.sourceType == "static") {
            parameters.push(item.value);
        } else {
            deployLogger.error(`Constructor parameter specs is neither "dynamic" nor "static`);
            throw new Error('Constructor parameter specs is neither "dynamic" nor "static');
        }
    });

    return parameters;
}


module.exports = {
    extractSolcVersion,
    getSolcVersions,
    compileWithVersion,
    requireFromString,
    deployContract, 
    getContractABI,
    retrieveConstructorParameters
};
