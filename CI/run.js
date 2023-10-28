require('module-alias/register');
const path = require('path');
const setupEnv = require('@envs/anvil');
const chalk = require('chalk');
const { terminateProcessByPid } = require('@lib/os/process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const logger = require('@lib/logging/logger');
const { readCIConfig } = require('@lib/config');
const { makeSimulation } = require('@lib/dcr/exec');
const { getLastSimulationId } = require('@lib/dcr/info');

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

            // 1. For each model
            for (let model of contract.models) {
                await makeSimulation(model.id);
                let simId = await getLastSimulationId(model.id);
                
            }


            // 2. Execute the whole test using runner
            let environment = test.environment;
            let testFiles = test.files;

            logger.info(chalk.blue(`Setting up environment: [${environment}]`));
            let envInfo = null;
            let web3 = null; 

            if (environment === 'anvil') {
                let env = await setupEnv();
                envInfo = env['envInfo'];
                web3 = env['web3']
            }

            logger.info(chalk.green(`Running exploits for environment: [${environment}] \n`));
            for (let testFile of testFiles) {
                let testFilePath = path.join(__dirname, test.directory, testFile);

                logger.info(chalk.cyan(`${'- '.repeat(40)+'\n'}`));
                logger.info(chalk.cyan(`Executing tests from: [${testFile}]`));

                let testModule = require(testFilePath);
                if (typeof testModule === 'function') {
                    let result = await testModule(web3, envInfo);
                    if (result) {
                        successfulExploits++;
                    } else {
                        failedExploits++;
                    }
                } else {
                    logger.debug(chalk.blue(`Failed to fetch the correct function to run.`))
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
