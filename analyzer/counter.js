require('module-alias/register');
const { terminateProcessByPid } = require('@lib/os/process');
const { hideBin } = require('yargs/helpers');
const { readCIConfig } = require('@lib/config');
const { readModelFunctionsParams } = require('@lib/config');
const { getActivities } = require('@lib/dcr/info');
const { 
    extractSolcVersion, 
    compileWithVersion, 
    deployContract,
    getContractABI,
    retrieveConstructorParameters 
} = require('@lib/web3/deploy');
const { sleep } = require('@lib/os/process');
const fs = require('fs').promises;  // Use the promise-based API of the fs module
const path = require('path');
const getLogger = require('@lib/logging/logger').getLogger;
const analyzerCounterLogger = getLogger('analyzer-counter');

// Increase the max listeners limit
process.setMaxListeners(20);  // or a higher value if needed

// Directory parameter is relative to the project root. 
let countCompilable = async (directory, contract) => {
    let count = 0;
    let files;
    let dirPath;
    let compilableContracts = [];

    // First count the total number of source files
    try {
        dirPath = path.resolve(directory);
        files = await fs.readdir(dirPath);  
        count = files.length;        
    } catch (error) {
        analyzerCounterLogger.debug(`Could not count the number of files properly; this is the stack trace:`);
        throw new Error(error.stack);
    }

    await Promise.all(files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        analyzerCounterLogger.info(`Processing file: ${filePath}`);
        try {
            const source = await fs.readFile(filePath, 'utf8');  // Use the promise-based API
            const version = extractSolcVersion(source);
            try {
                let { abi, bytecode } = await compileWithVersion(source, file, contract, version);
                if (bytecode && Object.keys(bytecode).length === 0) {  // Check if bytecode is empty
                    count--;  // Decrement the count if the bytecode is empty
                } else {
                    compilableContracts.push({ file: file, abi, bytecode });
                }
            } catch (compileError) {
                count--;
                analyzerCounterLogger.error(`Error compiling file ${filePath}: ${compileError.message}\n, trace: \n${compileError.stack}\n\n\n`);
            }
        } catch (readError) {
            analyzerCounterLogger.error(`Error reading file ${filePath}: ${readError.message}`);
        }
    }));

    analyzerCounterLogger.info(`Number of compilable files in directory ${directory}: ${count}`);

    const results = {
        count,
        compilableContracts
    };

    const jsonFileName = `compilable-${contract}.json`;
    const jsonFilePath = path.join('analyzer', 'results', jsonFileName);

    try {
        await fs.mkdir('results', { recursive: true });
        await fs.writeFile(jsonFilePath, JSON.stringify(results, null, 2), 'utf8');
        analyzerCounterLogger.info(`Results written to ${jsonFilePath}`);
    } catch (writeError) {
        analyzerCounterLogger.error(`Error writing results to file ${jsonFilePath}: ${writeError.message}`);
    }

    return count;
};

module.exports = {
    countCompilable,
};
