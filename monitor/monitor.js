require('module-alias/register');
const { makeSimulation } = require('@lib/dcr/exec');
const { getLastSimulationId } = require('@lib/dcr/info');


/**
 * Monitor does three things:
 * 1. Makes the simulation;
 * 2. Execute both the generic and plugin conventions
 * 3. Watches over the contract transactions
 * 4. Translates the transaction to DCR activities and executes DCR activities at each transaction
 */

// Three parameters: 1. Model id, 2. Smart contract address, 3. Smart contract file name

await makeSimulation(model.id);
let simId = await getLastSimulationId(model.id);

// TODO
// execute general conventions

// TODO
// execute model-based conventions

// TODO
// start the monitor (thread that watches over the EVM, talks to DCR Engine, and logs the violations or activity executions)



