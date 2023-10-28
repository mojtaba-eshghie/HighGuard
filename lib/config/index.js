const path = require('path');
const fs = require('fs');
let yaml = require('js-yaml'); 


/**
 * Reads the CI configuration from ci-config.yml.
 * 
 * @returns {Object} The CI configuration.
 */
function readCIConfig() {
    let ciConfigPath = path.join(__dirname, '..', '..', 'config.yml');
    let ciConfigContent = fs.readFileSync(ciConfigPath, 'utf8');
    return yaml.load(ciConfigContent);
}

module.exports = {
    readCIConfig
}