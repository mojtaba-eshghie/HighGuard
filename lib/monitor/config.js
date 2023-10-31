/**
 * Monitor configuration reader and translator to JS objects
 */
require('module-alias/register');
const { readCIConfig } = require('@lib/config/'); 


/**
 * Reads the configuration for a given contract and model ID and returns 
 * parameter information of the function and their translation to DCR activities 
 * and identifier(s).
 * 
 * @param {string} contractName - The name of the contract.
 * @param {string} modelId - The ID of the model.
 * @returns {Object} - An object containing parameter information and their translation to DCR activities and identifier(s).
 */
let readModelFunctionsParams = (contractName, modelId) => {
    const config = readCIConfig();
    const contractConfig = config.contracts.find(contract => contract.name === contractName);

    if (!contractConfig) {
        throw new Error(`Contract with name ${contractName} not found in the configuration.`);
    }

    const modelConfig = contractConfig.models.find(model => model.id === modelId);

    if (!modelConfig) {
        throw new Error(`Model with ID ${modelId} not found for contract ${contractName}.`);
    }

    const functions = modelConfig.functions;
    const result = {};

    for (let functionName in functions) {
        result[functionName] = functions[functionName];
    }

    return result;
}


let read

module.exports = {
    readModelFunctionsParams
};