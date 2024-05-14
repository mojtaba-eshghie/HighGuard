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
const getLogger = require('@lib/logging/logger').getLogger;
const setupRegLogger = getLogger('setup-regular');

const path = require('path');
const setupAnvilEnv = require('@envs/anvil');
const chalk = require('chalk');
const Monitor = require('@monitor/monitor');
const fs = require('fs');
const { sleep } = require('@lib/os/process');


async function setupAndRunTests() {
    let ciConfig = readCIConfig();
    let successfulExploitsCount = 0;
    let failedExploitsCount = 0;
    let failedExploits = [];
    let allMonitors = [];

    for (let contract of ciConfig.contracts) {
        setupRegLogger.debug(`Working on contract: ${contract}`);

        for (let testName of contract.tests || []) {
            setupRegLogger.debug(chalk.white(`Successfully read test: ${testName} for ${contract} from config.`));
            // Fetch the full test details from the tests array
            let test = ciConfig.tests.find(t => t.name === testName);
            if (!test) {
                setupRegLogger.error(`Test ${testName} not found in the configuration.`);
                continue;
            }

                        
            let environment = null;
            let testFiles = null;
            // 1. For each model, we will create a monitor. A monitor is simply a model running against an exploit
            for (let model of contract.models) {
                // 1.1
                // Set up required configuration to spawn a new monitor (thread that watches over the EVM, talks to DCR Engine, and logs the violations or activity executions)
                // Setting up the environment for the monitor
                environment = test.environment;
                testFiles = test.files;              

                setupRegLogger.info(chalk.blue(`Setting up environment: [${environment}]`));


                let env;
                let envInfo = null;
                let web3 = null; 
                if (environment === 'anvil') {
                    
                    const maxRetries = 10; 
                    let attempts = 0;

                    while (attempts < maxRetries) {
                        try {
                            await sleep(1000);
                            env = await setupAnvilEnv();
                            setupRegLogger.debug('Environment setup successful:', env);
                            break; 
                        } catch (error) {
                            setupRegLogger.debug(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`)
                            console.error(`Attempt ${attempts + 1}: Failed to set up environment - ${error}`);
                            attempts++;
                            if (attempts === maxRetries) {
                                console.error('Max retries reached, failing with error');
                                setupRegLogger.error('Max retries reached, failing with error')
                                throw error;
                            }
                        }
                    }

                }

                envInfo = env['envInfo'];
                web3 = env['web3']
                


                // Associated with each test/exploit, the environment differs, so, if envorinment setup
                // was unsuccessful for the test, we throw an error.
                if (!web3 || !envInfo) {
                    throw new Error('Web3 testing environment should be correctly set up.');
                }

                // Getting contract constructor parameters for deployment
                let constructorParams = await retrieveConstructorParameters(contract.constructorParamSpecs, web3, envInfo);
                setupRegLogger.debug(`The retrieved parameters are: ${JSON.stringify(constructorParams)}`);

                // Contract preparation and deployment
                const projectRoot = path.resolve(__dirname, '..'); 
                const contractsDir = path.join(projectRoot, './contracts');
                const contractName = contract.name;
                let contractSource = fs.readFileSync(path.join(contractsDir, 'src', 'regular', contractName+'.sol'), 'utf8');
                let solcVersion = extractSolcVersion(contractSource);
                let { abi, bytecode } = await compileWithVersion(contractSource, contractName, contractName, solcVersion);
                let contractInstance = await deployContract(web3, abi, bytecode, envInfo, constructorParams);
                
                setupRegLogger.debug(chalk.white(`Model id: ${model.id}`))
                setupRegLogger.debug(chalk.white(`The contract: ${contractName}`))

                // Retrieving the model-function parameter configuration information
                let modelFunctionParams = readModelFunctionsParams(contractName, model.id);
                setupRegLogger.debug('modelFunctionParams from configurations: ', modelFunctionParams)

                configs = {
                    web3: web3,
                    contractAddress: contractInstance._address,
                    contractFileName: contractName,
                    contractName: contractName,
                    contractABI: await getContractABI(contractSource, contractName, contractName),
                    modelFunctionParams: modelFunctionParams,
                    activities: await getActivities(model.id),
                    modelId: model.id,
                    hasResponseRelation: model.hasResponseRelation,
                }

                let monitor = new Monitor(configs);
                allMonitors.push(new Promise(resolve => {
                    monitor.on('statusChange', async (newStatus) => {
                        if (newStatus === 'INITIALIZED') {
                            setupRegLogger.debug(`Monitor is initialized...`);                          
                            monitor.start();
                        } else if (newStatus == 'RUNNING') {
                            setupRegLogger.info(`Monitor is now running for the contract ${contractInstance._address}.`);

                            // 1.2
                            // execute general conventions

                            

                            // 1.3
                            // execute model-based conventions



                            // 1.4
                            // execute exploits
                            setupRegLogger.info(chalk.green(`Running exploits for environment: [${environment}] \n`));
                            let testPromises = testFiles.map(testFile => {
                                let testFilePath = path.join(__dirname, test.directory, testFile);
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
                                        'contract': contractName,
                                        'exploit': testName
                                    });
                                };
                            });
                            
                            

                            resolve(); // Resolve once all tests are done
                            //terminateProcessByPid(envInfo.pid);

                            //setupRegLogger.info(`Freeing resources for this model<->monitor<->contract(contract)<->test`);
                            //web3.currentProvider.disconnect();
                            setTimeout(() => {
                                terminateProcessByPid(envInfo.pid);
                            }, 150000);
                            
                        }
                    });
                }));
                
                
                
            

            }
            


            // 3. Store the results from the monitor to generate the report later
            // TODO: Implement result storage for report generation


            
        }
    }

    
    
    // Wait for all monitors to complete their tasks
    await Promise.all(allMonitors);

    // Display the results  
    setupRegLogger.info(chalk.cyan('= '.repeat(40)+'\n'));
    setupRegLogger.info(chalk.cyan('Finished executing all exploits.\n'));
    setupRegLogger.info(chalk.green(`Total successful exploits: ${successfulExploitsCount}`));
    setupRegLogger.info(chalk.red(`Total failed exploits: ${failedExploitsCount}\n`));
    setupRegLogger.info(`Failed ones are: ${JSON.stringify(failedExploits)}`);
    setupRegLogger.info(chalk.cyan('= '.repeat(40)));

    setupRegLogger.info(`Finished all operations. Successful: ${successfulExploitsCount}, Failed: ${failedExploitsCount}`);
    
    //web3.currentProvider.disconnect();
    //terminateProcessByPid(envInfo.pid);

    //process.exit(0);
}

module.exports = setupAndRunTests;