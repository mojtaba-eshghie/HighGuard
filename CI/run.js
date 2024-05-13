require('module-alias/register');
const { terminateProcessByPid } = require('@lib/os/process');
const { hideBin } = require('yargs/helpers');
const { readCIConfig, readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info');
const {
    extractSolcVersion, 
    compileWithVersion, 
    deployContract,
    getContractABI,
    retrieveConstructorParameters 
} = require('@lib/web3/deploy');
//const logger = require('@lib/logging/logger');
const getLogger = require('@lib/logging/logger').getLogger;
const runLogger = getLogger('run');
const yargs = require('yargs/yargs');
const path = require('path');
const setupAnvilEnv = require('@envs/anvil');
const chalk = require('chalk');
const Monitor = require('@monitor/monitor');
const fs = require('fs');


let argv = yargs(hideBin(process.argv))
    .option('type', {
        alias: 't',
        type: 'string',
        description: 'Type of exploit to run (synthesized or regular)',
        choices: ['synthesized', 'regular'],
        demandOption: true, 
    })
    .option('env', {
        alias: 'e',
        type: 'string',
        description: 'Whether the execution environment of all of exploits is the same process or for each exploit spawn a new environment.',
        choices: ['unified', 'separate'],
        demandOption: true, 
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        description: 'Run with verbose logging'
    })
    .argv;

if (argv.verbose) {
    runLogger.level = 'debug';
} else {
    runLogger.level = 'info';
}

const setupAndRunTests = require(`@CI/setup-${argv.type}-${argv.env}`);

setupAndRunTests().catch(error => {
    runLogger.error(chalk.red(`Error during setup or test execution:\n${error.stack ? error.stack : error}`));
})