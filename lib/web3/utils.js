const fs = require('fs');
const path = require('path');
const solc = require('solc');
const axios = require('axios');

// Extract solc version from the source
function extractSolcVersion(source) {
    const match = source.match(/^pragma solidity (\^?\d+\.\d+\.\d+);/m);
    if (match) {
        return match[1].slice(1);  // remove the '^' character
    }
    throw new Error('No valid pragma directive found in the Solidity source.');
}

async function getSolcVersions() {
    try {
        const response = await axios.get('https://binaries.soliditylang.org/bin/list.json');
        return response.data;
    } catch (error) {
        console.error("Error fetching versions:", error);
        throw error;
    }
}

async function compileWithVersion(source, version) {
    const solcVersions = await getSolcVersions();
    const exactVersion = solcVersions.releases[version];

    if (!exactVersion) {
        throw new Error(`Exact version for ${version} not found in solc releases.`);
    }

    const solcUrl = `https://binaries.soliditylang.org/bin/${exactVersion}`;
    const response = await axios.get(solcUrl);
    const solcSource = response.data;

    const solcInstance = solc.setupMethods(requireFromString(solcSource));

    const input = {
        language: 'Solidity',
        sources: {
            'ProductOrder.sol': {
                content: source
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    const output = JSON.parse(solcInstance.compile(JSON.stringify(input)));
    const contract = output.contracts['ProductOrder.sol']['ProductOrder'];
    return {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
    };
}

// Helper function to require from a string
function requireFromString(src, filename) {
    const m = new module.constructor();
    m.paths = module.paths;
    m._compile(src, filename || 'unknown');
    return m.exports;
}

module.exports = {
    extractSolcVersion,
    getSolcVersions,
    compileWithVersion,
    requireFromString
};
