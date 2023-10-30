const fs = require('fs');
const path = require('path');
const solc = require('solc');
const axios = require('axios');

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
        const response = await axios.get('https://binaries.soliditylang.org/bin/list.json');
        return response.data;
    } catch (error) {
        console.error("Error fetching versions:", error);
        throw error;
    }
}

/**
 * Compiles the provided Solidity source code with the specified compiler version.
 * 
 * @param {string} source - The Solidity source code to compile.
 * @param {string} version - The Solidity compiler version to use for compilation.
 * @returns {Object} - An object containing the ABI and bytecode of the compiled contract.
 * @throws {Error} - Throws an error if the specified version is not found or if there's a compilation error.
 */
async function compileWithVersion(source, version) {
    const solcVersions = await getSolcVersions();
    const exactVersion = solcVersions.releases[version];

    if (!exactVersion) {
        throw new Error(`Exact version for ${version} not found in solc releases.`);
    }

    const solcUrl = `https://binaries.soliditylang.org/bin/${exactVersion}`;
    const response = await axios.get(solcUrl);
    const solcSource = response.data;

    const solcInstance = solc.setupMethods(requireFromString(solcSource));

    const input = {
        language: 'Solidity',
        sources: {
            'ProductOrder.sol': {
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

    const output = JSON.parse(solcInstance.compile(JSON.stringify(input)));
    const contract = output.contracts['ProductOrder.sol']['ProductOrder'];
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
let getContractABI = async (contractFileName) => {  
    try {
        // Read the contract source code
        const contractSource = fs.readFileSync(path.join(__dirname, '..', '..', 'contracts', 'src', contractFileName + '.sol'), 'utf8');

        // Extract the Solidity compiler version from the source code
        const solcVersion = extractSolcVersion(contractSource);

        // Compile the contract with the extracted version
        const compiledContract = await compileWithVersion(contractSource, solcVersion);

        return compiledContract.abi;
    } catch (error) {
        console.error(`Error generating ABI for ${contractFileName}:`, error);
        throw error;
    }
}


module.exports = {
    extractSolcVersion,
    getSolcVersions,
    compileWithVersion,
    requireFromString,
    deployContract, 
    getContractABI
};
