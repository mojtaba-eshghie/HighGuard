require('module-alias/register');
const { terminateProcessByPid } = require('@lib/os/process');
const { hideBin } = require('yargs/helpers');
const { readCIConfig } = require('@lib/config');
const { readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info')
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

//  Increase the Max Listeners Limit globally
require('events').EventEmitter.defaultMaxListeners = 100; 


async function setupAndRunTests() {
    let ciConfig = readCIConfig('config-synthesized.yml');
    let successfulExploitsCount = 0;
    let failedExploitsCount = 0;
    let failedExploits = [];
    let allMonitors = [];

    for (let contract of ciConfig.contracts) {
        setupSyncLoggerUnified.debug(`Working on contract: ${JSON.stringify(contract)}`);

                
        

        for (let variantIndex = 1; variantIndex <= contract.numOfVariants; variantIndex++) {
            let fullContractFileName = contract.name + '-' + variantIndex.toString();
            let fullTestName = contract.name + "Exploit" + '-' + variantIndex.toString() + '.js';
            let testDirectory = '/exploits/synthesized';
            console.log(`tests are: ${contract.tests}`)
            let testName = contract.tests[0];

            setupSyncLoggerUnified.debug(chalk.white(`Successfully read test info: ${testName} for ${contract} from config. Full name of test is: ${fullTestName}`));
            
            let test = ciConfig.tests.find(t => t.name === testName);
            if (!test) {
                setupSyncLoggerUnified.error(`Test ${testName} not found in the configuration.`);
                continue;
            }

                        
            let environment = null;
            let testFiles = null;
            // 1. For each model, we will create a monitor. A monitor is simply a model running against an exploit
            for (let model of contract.models) {
                
                environment = 'anvil';
                testFiles = [fullTestName,];              

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
                        setupSyncLoggerUnified.debug(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`)
                        console.error(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`);
                        attempts++;
                        if (attempts === maxRetries) {
                            console.error('Max retries reached, failing with error');
                            setupSyncLoggerUnified.error('Max retries reached, failing with error')
                            throw error; // Optionally re-throw the last error after max retries
                        }
                    }
                }




                let envInfo = env['envInfo'];
                let web3 = env['web3']
                
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
                let contractPath = path.join(contractsDir, 'src/synthesized', contractName+'-'+variantIndex+'.sol')
                
                let contractSource;
                try {
                    contractSource = await fs.readFile(contractPath, 'utf8');
                    


                    //console.log(chalk.green(`source is: ${contractSource}\naddress of the source: ${contractPath}`));
                    let solcVersion = extractSolcVersion(contractSource);
                    let { abi, bytecode } = await compileWithVersion(contractSource, fullContractFileName, contractName, solcVersion);
                    let contractInstance = await deployContract(web3, abi, bytecode, envInfo, constructorParams);
                    
                    setupSyncLoggerUnified.debug(chalk.white(`Model id: ${model.id}`))
                    setupSyncLoggerUnified.debug(chalk.white(`The contract file: ${fullContractFileName}`))

                    // Retrieving the model-function parameter configuration information
                    let modelFunctionParams = readModelFunctionsParams(contractName, model.id, 'config-synthesized.yml')
                    setupSyncLoggerUnified.debug('modelFunctionParams from configurations: ', modelFunctionParams)

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
                    }
                    let monitor = new Monitor(configs);
                    allMonitors.push(new Promise(resolve => {
                        monitor.on('statusChange', async (newStatus) => {
                            if (newStatus === 'INITIALIZED') {
                                setupSyncLoggerUnified.debug(`Monitor is initialized...`);                          
                                monitor.start();
                            } else if (newStatus == 'RUNNING') {
                                setupSyncLoggerUnified.info(`Monitor is now running for the contract ${contractInstance._address}.`);


                                // 1.4
                                // execute exploits
                                setupSyncLoggerUnified.info(chalk.green(`Running exploits for environment: [${environment}] \n`));
                                let testPromises = testFiles.map(testFile => {
                                    let testFilePath = path.join(__dirname, testDirectory, testFile);
                                    let testModule = require(testFilePath);
                                    return typeof testModule === 'function' ? testModule(web3, envInfo, contractInstance._address) : Promise.reject('Incorrect module type');
                                });
                                // Wait for all tests to complete
                                let results = await Promise.allSettled(testPromises);
                                results.forEach(result => {
                                    if (result.status === 'fulfilled' && result.value) successfulExploitsCount++;
                                    else {
                                        failedExploitsCount++;
                                        failedExploits.push({
                                            'contract': fullContractFileName,
                                            'exploit': testName, 
                                            'reason': null
                                        });
                                    };
                                });
                                

                                resolve(); // Resolve once all tests are done
                                //web3.currentProvider.disconnect();
                                setTimeout(() => {
                                    terminateProcessByPid(envInfo.pid);
                                }, 500000);
                                
                            }
                        });
                    }));

                } catch (error) {
                    setupSyncLoggerUnified.error(`Failed for: ${fullContractFileName}\n Error: ${error.stack}\nContract path: ${contractPath}`);
                    failedExploitsCount++;
                    failedExploits.push({
                        'contract': fullContractFileName,
                        'exploit': testName, 
                        'reason': error
                    });
                    setTimeout(() => {
                        terminateProcessByPid(envInfo.pid);
                    }, 500000);
                }
                
                
                
                
                
            

            }
            


            // 3. Store the results from the monitor to generate the report later
            // TODO: Implement result storage for report generation


            
        }
    }

    
    
    // Wait for all monitors to complete their tasks
    await Promise.allSettled(allMonitors);

    // Display the results  
    setupSyncLoggerUnified.info(chalk.cyan('= '.repeat(40)+'\n'));
    setupSyncLoggerUnified.info(chalk.cyan('Finished executing all exploits.\n'));
    setupSyncLoggerUnified.info(chalk.green(`Total successful exploits: ${successfulExploitsCount}`));
    setupSyncLoggerUnified.info(chalk.red(`Total failed exploits: ${failedExploitsCount}\n`));
    setupSyncLoggerUnified.info(`Failed ones are: ${JSON.stringify(failedExploits)}`);
    setupSyncLoggerUnified.info(chalk.cyan('= '.repeat(40)));

    setupSyncLoggerUnified.info(`Finished all operations. Successful: ${successfulExploitsCount}, Failed: ${failedExploitsCount}`);
    
    //web3.currentProvider.disconnect();
    //terminateProcessByPid(envInfo.pid);

}

module.exports = setupAndRunTests;