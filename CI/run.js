require('module-alias/register');
let fs = require('fs');
let path = require('path');
let yaml = require('js-yaml'); 
let setupEnv = require('@envs/anvil');
let chalk = require('chalk');
let { terminateProcessByPid } = require('@lib/os/process');
let yargs = require('yargs/yargs');
let { hideBin } = require('yargs/helpers');
let logger = require('@lib/logging/logger');
let { readCIConfig } = require('@lib/config');



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



/**
 * Sets up the environments and runs the tests based on the CI configuration.
 */
async function setupAndRunTests() {
    let ciConfig = readCIConfig();

    let successfulExploits = 0;  // Counter for successful exploits
    let failedExploits = 0;      // Counter for failed exploits

    for (let test of ciConfig.tests) {
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

        logger.debug(chalk.blue("All reporting operations should finish before freeing environment resources."))


        // Close environment. Without closing the environment properly, resources will be wasted.
        web3.currentProvider.disconnect();
        terminateProcessByPid(envInfo.pid);
        logger.debug(chalk.blue(`Terminated running anvil instance with PID: ${envInfo.pid}`));
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