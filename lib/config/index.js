const path = require('path');
const fs = require('fs');
let yaml = require('js-yaml'); 



/**
 * Reads the CI configuration from a specified config filename or from the default config.yml.
 * 
 * @param {string} [configFileName='config.yml'] - The filename of the configuration file.
 * @returns {Object} The CI configuration.
 */
let readCIConfig = (configFileName = 'config.yml') => {
    // Construct the full path by combining the directory path and the filename
    let ciConfigPath = path.join(__dirname, '..', '..', configFileName);
    let ciConfigContent = fs.readFileSync(ciConfigPath, 'utf8');
    return yaml.load(ciConfigContent);
}



let readCIConfigWithPath = (configFilePath) => {
    let ciConfigContent = fs.readFileSync(path.join(__dirname, configFilePath), 'utf8');
    return yaml.load(ciConfigContent);
}






/**
 * Reads the configuration for a given contract and model ID and returns 
 * parameter information of the function and their translation to DCR activities 
 * and identifier(s).
 * 
 * @param {string} contractName - The name of the contract.
 * @param {string} modelId - The ID of the model.
 * @returns {Object} - An object containing parameter information and their translation to DCR activities and identifier(s).
 */
let readModelFunctionsParams = (contractName, modelId, configFile) => {
    let config;
    if (configFile) {
        config = readCIConfig(configFile);
    } else {
        config = readCIConfig();
    }
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


module.exports = {
    readCIConfig,
    readCIConfigWithPath,
    readModelFunctionsParams
}