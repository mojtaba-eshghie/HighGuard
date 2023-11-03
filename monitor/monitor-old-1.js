require('module-alias/register');
const { makeSimulation } = require('@lib/dcr/exec');
const { getLastSimulationId } = require('@lib/dcr/info');
const setupEnv = require('@envs/anvil');
const { watchTransactions } = require('@lib/monitor/watchpost')

/**
 * Monitor does three things:
 * 1. Makes the simulation;
 * 2. Execute both the generic and plugin conventions
 * 3. Watches over the contract transactions
 * 4. Translates the transaction to DCR activities and executes DCR activities at each transaction
 */

// Three parameters: 1. Model id, 2. Smart contract address, 3. Smart contract file name
let monitor = async (modelId = undefined, SCAddress = undefined, SCName = undefined, SCFileName = undefined, web3 = undefined) => {
    await makeSimulation(modelId);
    let simId = await getLastSimulationId(modelId);

    // TODO 1
    // execute general conventions on DCR engine for the model

    // TODO 2
    // execute model-based conventions on DCR engine for the model


    // TODO 3
    // start the monitor (thread that watches over the EVM, talks to DCR Engine, and logs the violations or activity executions)
    
    if (web3 == undefined) {
        // If web3 is undefined means monitor is used standalone and we should create one web3 before using it
        let env = await setupEnv();
        envInfo = env['envInfo'];
        web3 = env['web3']

        // When web3 is not defined it 
    }

    // TODO 3.1 use watchTransactions function to watch the transactions of a contract

}


monitor(modelId="1700559")

module.exports = {
    monitor,
}