require('module-alias/register');
const { spawn, spawnSync, execSync } = require('child_process');
const Web3 = require("web3");
const { findFreePorts } = require('@lib/os/network');


const getLogger = require('@lib/logging/logger').getLogger;
const avalancheIndexLogger = getLogger('avalanche-index');

/**
 * Extracts information from the avalanche-network-runner command.
 * 
 * @returns {Promise<Object>} A promise that resolves with an object containing the accounts, private keys, and RPC address.
 * @throws {Error} If there's an error while executing the avalanche-network-runner command or processing its output.
 */
let extractAvalancheInfo = () => {
    return new Promise((resolve, reject) => {
        avalancheIndexLogger.debug(`Exectuing command: "avalanche network clean"`)
        try {
            execSync('avalanche network clean'); //Resets the blockchain to initial state, 
        } catch (error) {
            avalancheIndexLogger.error(error.stack);
            throw new Error(error.stack);
        }


        try {
            avalancheIndexLogger.debug(`Executing command: "avalanche subnet list"`);
            let subnetList = execSync('avalanche subnet list'); //check if highguardAvalanche is already imported , if subnet does not exist, load from file
            avalancheIndexLogger.debug(`subnetList: ${subnetList.toString()}`);         

            if (!subnetList.toString("utf8").includes('highguardAvalanche')){
                let loadKey = execSync('avalanche key create highguard-teleporter --force --file ' + __dirname + '/teleporter');
                avalancheIndexLogger.debug(`loadKey: ${loadKey}`);
                if (!loadKey.toString().includes('Key loaded')){
                    reject(`Error with loading Avalanche key: ${loadAvalanche.toString()}`);
                }
                let loadAvalanche = execSync('avalanche subnet import file ' + __dirname + '/highguardAvalanche.json');

                if (!loadAvalanche.toString().includes('Subnet imported successfully')){
                    reject(`Error with loading Avalanche subnet: ${loadAvalanche.toString()}`);
                }
            }
        } catch (error) {
            avalancheIndexLogger.error(error.stack);
            throw new Error(error.stack);
        }
        
        
        let AvalancheProcess = spawn('avalanche', ['subnet', 'deploy', 'highguardAvalanche', '-l', '--avalanchego-version', 'v1.11.7']);
        let output = '';

        AvalancheProcess.stdout.on('data', (data) => {
            avalancheIndexLogger.debug(`data: ${data.toString()}`);
            output += data.toString();
            if (output.includes('Currency Symbol:   AVAX')) {
                AvalancheProcess.stdout.removeAllListeners('data'); 

                let accounts = require('./accounts.json');
                let privateKeys = require('./privateKeys.json');
                let rpcAddressMatch = output.match(/RPC URL:\s*(\S+)/);
                let rpcAddress = rpcAddressMatch ? rpcAddressMatch[1] : null;
                let pidMatch = output.match(/pid:\s*(\d+)/);
                //let pid = pidMatch ? pidMatch[1] : null;
                
                resolve({
                    accounts,
                    privateKeys,
                    rpcAddress,
                    pid: AvalancheProcess.pid
                });
            }
        });
        // Handle any errors
        AvalancheProcess.stderr.on('data', (data) => {
            reject(`Avalance subnet setup error: ${data}`);
        });
    });
}


let setupEnv = async () => {
    avalancheIndexLogger.debug(`Starting to setup avalance index... (setupEnv)`)
    let envInfo = await extractAvalancheInfo();

    const wsPort = envInfo.rpcAddress.slice(0, -3) + "ws";
    const web3 = new Web3(new Web3.providers.WebsocketProvider(wsPort));

    //let web3 = new Web3('http://127.0.0.1:' + port);

    // Assuming the first account and private key are the signer's
    let signer = web3.eth.accounts.privateKeyToAccount(envInfo.privateKeys[0]);
    web3.eth.accounts.wallet.add(signer);

    return {
        web3,
        envInfo
    };
}

module.exports = setupEnv;