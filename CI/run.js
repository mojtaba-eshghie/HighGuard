const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); 
const setupEnv = require('./envs/anvil/anvil.js');
const chalk = require('chalk');

/**
 * Reads the CI configuration from ci-config.yml.
 * 
 * @returns {Object} The CI configuration.
 */
function readCIConfig() {
    const ciConfigPath = path.join(__dirname, 'ci-config.yml');
    const ciConfigContent = fs.readFileSync(ciConfigPath, 'utf8');
    return yaml.load(ciConfigContent);  // Updated this line
}

/**
 * Sets up the environments and runs the tests based on the CI configuration.
 */
async function setupAndRunTests() {
    const ciConfig = readCIConfig();

    for (const test of ciConfig.tests) {
        const environment = test.environment;
        const testFiles = test.files;

        console.log(chalk.blue(`Setting up environment: [${environment}]`));
        if (environment === 'anvil') {
            await setupEnv();
        }
        // Add more environments as needed

        console.log(chalk.green(`Running tests for environment: [${environment}]`));
        for (const testFile of testFiles) {
            const testFilePath = path.join(__dirname, test.directory, testFile);
            console.log(chalk.cyan(`${'- '.repeat(50)+'\n'}Executing tests from: [${testFile}]`));
            require(testFilePath);  // Assuming that running the test file directly will execute the tests
        }
    }
}

setupAndRunTests().catch(error => {
    console.error(chalk.red(`Error during setup or test execution: ${error}`));
});