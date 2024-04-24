require('module-alias/register');

const { terminateProcessByPid } = require('@lib/os/process');
const { hideBin } = require('yargs/helpers');
const { readCIConfig } = require('@lib/config');
const { getLastSimulationId } = require('@lib/dcr/info');
const { readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info')

const logger = require('@lib/logging/logger');
const yargs = require('yargs/yargs');
const path = require('path');
const setupAnvilEnv = require('@envs/anvil');
const chalk = require('chalk');
const Monitor = require('@monitor/monitor');

const fs = require('fs');


const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract,
    getContractABI 
} = require('@lib/web3/deploy');

let argv = yargs(hideBin(process.argv))
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        description: 'Run with verbose logging'
    })
    .argv;

if (argv.verbose) {
    logger.level = 'debug';
} else {
    logger.level = 'info';
}

async function setupAndRunTests() {
    let ciConfig = readCIConfig();

    let successfulExploits = 0;
    let failedExploits = 0;

    for (let contract of ciConfig.contracts) {
        for (let testName of contract.tests || []) {
            // Fetch the full test details from the tests array
            let test = ciConfig.tests.find(t => t.name === testName);
            if (!test) {
                logger.error(`Test ${testName} not found in the configuration.`);
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

                logger.info(chalk.blue(`Setting up environment: [${environment}]`));
                let envInfo = null;
                let web3 = null; 
                if (environment === 'anvil') {
                    let env = await setupAnvilEnv();
                    envInfo = env['envInfo'];
                    web3 = env['web3']
                }

                // Associated with each test/exploit, the environment differs, so, if envorinment setup
                // was unsuccessful for the test, we throw an error.
                if (!web3 || !envInfo) {
                    throw new Error('Web3 testing environment should be correctly set up.');
                }


                // Contract preparation and deployment
                const projectRoot = path.resolve(__dirname, '..'); 
                const contractsDir = path.join(projectRoot, './contracts');
                const contractName = contract.name;
                let contractSource = fs.readFileSync(path.join(contractsDir, 'src', contractName+'.sol'), 'utf8');
                let solcVersion = extractSolcVersion(contractSource);
                let parameters = [];
                let { abi, bytecode } = await compileWithVersion(contractSource, contractName, solcVersion);
                let contractInstance = await deployContract(web3, abi, bytecode, envInfo, parameters);
                
                
                
                logger.debug(chalk.white(`Model id: ${model.id}`))
                logger.debug(chalk.white(`The contract: ${contractName}`))

                // Retrieving the model-function parameter configuration information
                let modelFunctionParams = readModelFunctionsParams(contractName, model.id)
                logger.debug('modelFunctionParams from configurations: ', modelFunctionParams)

                configs = {
                    web3: web3,
                    contractAddress: contractInstance._address,
                    contractFileName: contractName,
                    contractName: contractName,
                    contractABI: await getContractABI(contractName),
                    modelFunctionParams: modelFunctionParams,
                    activities: await getActivities(model.id),
                    modelId: model.id
                }
                let monitor = new Monitor(configs);
                //console.log(envInfo);
                logger.info(chalk.green(`Monitoring the contract: ${contractInstance._address}`))
                monitor.start();
                

                // Setting up the monitor itself: (get it from monitor.test.js) 
                // await makeSimulation(model.id);
                // let simId = await getLastSimulationId(model.id);

                // 1.2
                // execute general conventions



                

                // 1.3
                // execute model-based conventions



                // 1.4
                // execute exploits
                logger.info(chalk.green(`Running exploits for environment: [${environment}] \n`));
                for (let testFile of testFiles) {
                    let testFilePath = path.join(__dirname, test.directory, testFile);

                    logger.info(chalk.cyan(`${'- '.repeat(40)+'\n'}`));
                    logger.info(chalk.cyan(`Executing exploits from: [${testFile}]`));

                    let testModule = require(testFilePath);
                    if (typeof testModule === 'function') {
                        let result = await testModule(web3, envInfo);
                        if (result) {
                            successfulExploits++;
                        } else {
                            failedExploits++;
                        }
                    } else {
                        logger.error(chalk.red(`Failed to fetch the correct function to run.`))
                    }
                }

            }
            

            



            






            

            // 3. Store the results from the monitor to generate the report later
            // TODO: Implement result storage for report generation


            
        }
    }

    // Display the results  
    logger.info(chalk.cyan('= '.repeat(40)+'\n'));
    logger.info(chalk.cyan('Finished executing all exploits.\n'));
    logger.info(chalk.green(`Total successful exploits: ${successfulExploits}`));
    logger.info(chalk.red(`Total failed exploits: ${failedExploits}\n`));
    logger.info(chalk.cyan('= '.repeat(40)));
    process.exit(0);
}

setupAndRunTests().catch(error => {
    console.error(chalk.red(`Error during setup or test execution: ${error}`));
});
