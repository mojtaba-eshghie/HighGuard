require('module-alias/register');
const { terminateProcessByPid } = require('@lib/os/process');
const { hideBin } = require('yargs/helpers');
const { readCIConfig } = require('@lib/config');
const { readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info');
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract,
    getContractABI,
    retrieveConstructorParameters 
} = require('@lib/web3/deploy');
const { sleep } = require('@lib/os/process');

const getLogger = require('@lib/logging/logger').getLogger;
const setupSyncLoggerUnified = getLogger('setup-synthesized-unified');

const yargs = require('yargs/yargs');
const path = require('path');
const setupAnvilEnv = require('@envs/anvil');
const chalk = require('chalk');
const Monitor = require('@monitor/monitor');
const fs = require('fs').promises;

// Increase the Max Listeners Limit globally
require('events').EventEmitter.defaultMaxListeners = 100;

const TEST_TIMEOUT_DURATION = 120000; // 120 seconds for each test
const OVERALL_TIMEOUT_DURATION = 300000; // 5 minutes for the entire set of tests

function withTimeout(promise, timeout) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ]);
}


async function appendToJsonFile(filePath, data) {
    try {
        // Read existing file
        const existingData = await fs.readFile(filePath, 'utf8');
        const json = JSON.parse(existingData);
        // Append new data
        json.push(...data);
        // Write back to the file
        await fs.writeFile(filePath, JSON.stringify(json, null, 2));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, create new file
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } else {
            throw error;
        }
    }
}

async function setupAndRunTests() {
    let ciConfig = readCIConfig('config-synthesized.yml');
    let successfulExploitsCount = 0;
    let failedExploitsCount = 0;
    let unresolvedExploitsCount = 0;
    let successfulExploits = [];
    let failedExploits = [];
    let unresolvedExploits = [];
    let allMonitors = [];

    for (let contract of ciConfig.contracts) {
        setupSyncLoggerUnified.debug(`Working on contract: ${JSON.stringify(contract)}`);

        for (let variantIndex = 1; variantIndex <= contract.numOfVariants; variantIndex++) {
            let fullContractFileName = contract.name + '-' + variantIndex.toString();
            let fullTestName = contract.name + "Exploit" + '-' + variantIndex.toString() + '.js';
            let testDirectory = '/exploits/synthesized';
            console.log(`tests are: ${contract.tests}`);
            let testName = contract.tests[0];

            setupSyncLoggerUnified.debug(chalk.white(`Successfully read test info: ${testName} for ${contract} from config. Full name of test is: ${fullTestName}`));
            
            let test = ciConfig.tests.find(t => t.name === testName);
            if (!test) {
                setupSyncLoggerUnified.error(`Test ${testName} not found in the configuration.`);
                continue;
            }

            let environment = null;
            let testFiles = null;
            for (let model of contract.models) {
                
                environment = 'anvil';
                testFiles = [fullTestName];

                const maxRetries = 10;
                let attempts = 0;
                let env;

                while (attempts < maxRetries) {
                    try {
                        await sleep(1000);
                        env = await setupAnvilEnv();
                        setupSyncLoggerUnified.debug('Environment setup successful:', env);
                        break;
                    } catch (error) {
                        setupSyncLoggerUnified.debug(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`);
                        console.error(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`);
                        attempts++;
                        if (attempts === maxRetries) {
                            console.error('Max retries reached, failing with error');
                            setupSyncLoggerUnified.error('Max retries reached, failing with error');
                            throw error; // Optionally re-throw the last error after max retries
                        }
                    }
                }

                let envInfo = env['envInfo'];
                let web3 = env['web3'];
                
                if (!web3 || !envInfo) {
                    throw new Error('Web3 testing environment should be correctly set up.');
                }

                // Getting contract constructor parameters for deployment
                let constructorParams = await retrieveConstructorParameters(contract.constructorParamSpecs, web3, envInfo);
                setupSyncLoggerUnified.debug(`The retrieved parameters are: ${JSON.stringify(constructorParams)}`);

                // Contract preparation and deployment
                const projectRoot = path.resolve(__dirname, '..');
                const contractsDir = path.join(projectRoot, './contracts');
                const contractName = contract.name;
                let contractPath = path.join(contractsDir, 'src/synthesized', contractName + '-' + variantIndex + '.sol');
                
                let contractSource;
                try {
                    contractSource = await fs.readFile(contractPath, 'utf8');

                    let solcVersion = extractSolcVersion(contractSource);
                    let { abi, bytecode } = await compileWithVersion(contractSource, fullContractFileName, contractName, solcVersion);
                    let contractInstance = await deployContract(web3, abi, bytecode, envInfo, constructorParams);
                    
                    setupSyncLoggerUnified.debug(chalk.white(`Model id: ${model.id}`));
                    setupSyncLoggerUnified.debug(chalk.white(`The contract file: ${fullContractFileName}`));

                    // Retrieving the model-function parameter configuration information
                    let modelFunctionParams = readModelFunctionsParams(contractName, model.id, 'config-synthesized.yml');
                    setupSyncLoggerUnified.debug('modelFunctionParams from configurations: ', modelFunctionParams);

                    configs = {
                        web3: web3,
                        contractAddress: contractInstance._address,
                        contractFileName: fullContractFileName,
                        contractName: contractName,
                        contractABI: await getContractABI(contractSource, fullContractFileName, contractName),
                        modelFunctionParams: modelFunctionParams,
                        activities: await getActivities(model.id),
                        modelId: model.id,
                        hasResponseRelation: model.hasResponseRelation,
                    };

                    let monitor = new Monitor(configs);
                    allMonitors.push(new Promise(resolve => {
                        monitor.on('statusChange', async (newStatus) => {
                            if (newStatus === 'INITIALIZED') {
                                setupSyncLoggerUnified.debug(`Monitor is initialized...`);                          
                                monitor.start();
                            } else if (newStatus == 'RUNNING') {
                                setupSyncLoggerUnified.info(`Monitor is now running for the contract ${contractInstance._address}.`);

                                setupSyncLoggerUnified.info(chalk.green(`Running exploits for environment: [${environment}] \n`));
                                let testPromises = testFiles.map(testFile => {
                                    let testFilePath = path.join(__dirname, testDirectory, testFile);
                                    let testModule = require(testFilePath);
                                    return typeof testModule === 'function' ? testModule(web3, envInfo, contractInstance._address) : Promise.reject('Incorrect module type');
                                });

                                let results = await Promise.allSettled(testPromises.map(p => withTimeout(p, TEST_TIMEOUT_DURATION)));
                                results.forEach(result => {
                                    if (result.status === 'fulfilled' && result.value) {
                                        successfulExploitsCount++;
                                        successfulExploits.push({
                                            'contract': fullContractFileName,
                                            'exploit': testName,
                                            'result': result.value
                                        });
                                    } else if (result.status === 'rejected' && result.reason && result.reason.message === 'Timeout') {
                                        unresolvedExploitsCount++;
                                        unresolvedExploits.push({
                                            'contract': fullContractFileName,
                                            'exploit': testName,
                                            'reason': 'Timeout'
                                        });
                                    } else {
                                        failedExploitsCount++;
                                        failedExploits.push({
                                            'contract': fullContractFileName,
                                            'exploit': testName, 
                                            'reason': result.reason ? result.reason.message : 'Unknown error'
                                        });
                                    }
                                });

                                resolve(); // Resolve once all tests are done
                                setTimeout(() => {
                                    terminateProcessByPid(envInfo.pid);
                                }, TEST_TIMEOUT_DURATION);
                            }
                        });
                    }));

                } catch (error) {
                    setupSyncLoggerUnified.error(`Failed for: ${fullContractFileName}\n Error: ${error.stack}\nContract path: ${contractPath}`);
                    failedExploitsCount++;
                    failedExploits.push({
                        'contract': fullContractFileName,
                        'exploit': testName, 
                        'reason': error.message
                    });
                    setTimeout(() => {
                        terminateProcessByPid(envInfo.pid);
                    }, TEST_TIMEOUT_DURATION);
                }
            }
        }
    }

    try {
        await withTimeout(Promise.allSettled(allMonitors), OVERALL_TIMEOUT_DURATION);
    } catch (e) {
        setupSyncLoggerUnified.error(`Overall timeout reached: ${e.message}`);
    }

    // // Create results directory if it doesn't exist
    // const resultsDir = path.join('results/jsons');
    // setupSyncLoggerUnified.info(`Storing stuff in ${resultsDir}`);
    // await fs.mkdir(resultsDir, { recursive: true });

    // // Write results to JSON files
    // await fs.writeFile(path.join(resultsDir, 'successful_exploits.json'), JSON.stringify(successfulExploits, null, 2));
    // await fs.writeFile(path.join(resultsDir, 'failed_exploits.json'), JSON.stringify(failedExploits, null, 2));
    // await fs.writeFile(path.join(resultsDir, 'unresolved_exploits.json'), JSON.stringify(unresolvedExploits, null, 2));




    // Create results directory if it doesn't exist
    const resultsDir = path.join('results/json');
    setupSyncLoggerUnified.info(`Storing results in ${resultsDir}`);
    await fs.mkdir(resultsDir, { recursive: true });

    // Write results to JSON files
    const successfulExploitsPath = path.join(resultsDir, 'successful_exploits.json');
    const failedExploitsPath = path.join(resultsDir, 'failed_exploits.json');
    const unresolvedExploitsPath = path.join(resultsDir, 'unresolved_exploits.json');

    await appendToJsonFile(successfulExploitsPath, successfulExploits);
    await appendToJsonFile(failedExploitsPath, failedExploits);
    await appendToJsonFile(unresolvedExploitsPath, unresolvedExploits);



    // Display the results  
    setupSyncLoggerUnified.info(chalk.cyan('= '.repeat(40) + '\n'));
    setupSyncLoggerUnified.info(chalk.cyan('Finished executing all exploits.\n'));
    setupSyncLoggerUnified.info(chalk.green(`Total successful exploits: ${successfulExploitsCount}`));
    setupSyncLoggerUnified.info(chalk.red(`Total failed exploits: ${failedExploitsCount}\n`));
    setupSyncLoggerUnified.info(chalk.yellow(`Total unresolved exploits: ${unresolvedExploitsCount}\n`));
    setupSyncLoggerUnified.info(`Failed ones are: ${JSON.stringify(failedExploits)}`);
    setupSyncLoggerUnified.info(`Unresolved ones are: ${JSON.stringify(unresolvedExploits)}`);
    setupSyncLoggerUnified.info(chalk.cyan('= '.repeat(40)));

    setupSyncLoggerUnified.info(`Finished all operations. Successful: ${successfulExploitsCount}, Failed: ${failedExploitsCount}, Unresolved: ${unresolvedExploitsCount}`);
}

module.exports = setupAndRunTests;
