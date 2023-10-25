let fs = require('fs');
let path = require('path');
let yaml = require('js-yaml'); 
let setupEnv = require('./envs/anvil/anvil.js');
let chalk = require('chalk');
let { terminateProcessesByName } = require('./../lib/os/process');
let yargs = require('yargs/yargs');
let { hideBin } = require('yargs/helpers');
let logger = require('./../lib/logging/logger');


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
 * Reads the CI configuration from ci-config.yml.
 * 
 * @returns {Object} The CI configuration.
 */
function readCIConfig() {
    let ciConfigPath = path.join(__dirname, 'ci-config.yml');
    let ciConfigContent = fs.readFileSync(ciConfigPath, 'utf8');
    return yaml.load(ciConfigContent);
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

        logger.info(chalk.blue(`> Setting up environment: [${environment}]`));
        let envInfo = null;
        let web3 = null; 

        if (environment === 'anvil') {
            let env = await setupEnv();
            envInfo = env['envInfo'];
            web3 = env['web3']
        }

        logger.info(chalk.green(`> Running exploits for environment: [${environment}]`));
        for (let testFile of testFiles) {
            let testFilePath = path.join(__dirname, test.directory, testFile);
            logger.info(chalk.cyan(`${'- '.repeat(50)+'\n\n'}Executing tests from: [${testFile}]`));
            let testModule = require(testFilePath);
            if (typeof testModule === 'function') {
                let result = await testModule(web3, envInfo);
                if (result) {
                    successfulExploits++;
                } else {
                    failedExploits++;
                }
            }
        }

        
        // Close environment
        web3.currentProvider.disconnect();
        terminateProcessesByName("anvil");
        logger.debug(chalk.blue("+ Terminated any running anvil instance."))
    }

    // Display the results  
    logger.info(chalk.cyan('\n'+'= '.repeat(50)+'\n'));
    logger.info(chalk.cyan('Finished executing all exploits.\n'));
    logger.info(chalk.green(`Total successful exploits: ${successfulExploits}`));
    logger.info(chalk.red(`Total failed exploits: ${failedExploits}\n`));
    logger.info(chalk.cyan('\n'+'= '.repeat(50)));
    process.exit(0);
}

setupAndRunTests().catch(error => {
    console.error(chalk.red(`Error during setup or test execution: ${error}`));
});
