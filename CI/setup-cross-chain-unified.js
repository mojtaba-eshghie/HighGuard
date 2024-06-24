require('module-alias/register');
const { terminateProcessByPid } = require('@lib/os/process');
const fs = require('fs');
const { getActivities } = require('@lib/dcr/info');
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
const { sleep } = require('@lib/os/process');
const setupAvalancheEnv = require('@envs/avalanche-subnet');
const deployBridge = require('@envs/bridge');
const bridgeTestLogger = getLogger('bridgetest');

// Manually configured two cross-chain exploits for the tool paper; 
const exploitsList = [
    'tests/Bridge.exploit1.js',
    'tests/Bridge.exploit2.js',
];

async function setupAndRunTests() {
    for (const exploitPath of exploitsList) {
        try {
            const exploitModule = require(path.resolve(__dirname, exploitPath));
            if (typeof exploitModule.startUp === 'function') {
                await exploitModule.startUp();
                console.log(`Successfully ran startUp for ${exploitPath}`);
            } else {
                console.error(`No startUp function found in ${exploitPath}`);
            }
        } catch (error) {
            console.error(`Failed to run startUp for ${exploitPath}:`, error);
        }
    }
}

setupAndRunTests()
    .then(() => console.log('All tests have been set up and run.'))
    .catch(err => console.error('Error setting up and running tests:', err));

// proper command to run this would be:
// pkill anvil; clear; node CI/run.js -t cross-chain -e unified
module.exports = setupAndRunTests;