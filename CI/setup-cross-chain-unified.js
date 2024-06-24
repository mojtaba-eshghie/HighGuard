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
//    'tests/Bridge.exploit2.js',
];

async function setupAndRunTests() {
    for (const exploitPath of exploitsList) {
        try {
            const exploitSetup = require(path.resolve(__dirname, exploitPath));
            await exploitSetup();
            bridgeTestLogger.info(`Successfully completed setup for ${exploitPath}`);
        } catch (error) {
            console.error(`Failed to run setup for ${exploitPath}:`, error);
        }
    }
}

// proper command to run this would be:
// pkill anvil; clear; node CI/run.js -t cross-chain -e unified
module.exports = setupAndRunTests;