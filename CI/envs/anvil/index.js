require('module-alias/register');
const { spawn } = require('child_process');
const Web3 = require("web3");
const { findFreePorts } = require('@lib/os/network');

/**
 * Extracts information from the Anvil command.
 * 
 * @returns {Promise<Object>} A promise that resolves with an object containing the accounts, private keys, and RPC address.
 * @throws {Error} If there's an error while executing the Anvil command or processing its output.
 */
let extractAnvilInfo = (port) => {
    return new Promise((resolve, reject) => {
        let anvilProcess = spawn('anvil', ['--port', port]);

        let output = '';

        anvilProcess.stdout.on('data', (data) => {
            output += data.toString();

            if (output.includes('Listening on')) {
                anvilProcess.stdout.removeAllListeners('data'); 

                let accounts = [...output.matchAll(/0x[a-fA-F0-9]{40}/g)].map(match => match[0].replace(/"/g, ''));
                let privateKeys = [...output.matchAll(/0x[a-fA-F0-9]{64}/g)].map(match => match[0]);
                let rpcAddressMatch = output.match(/Listening on (\d+\.\d+\.\d+\.\d+:\d+)/);
                let rpcAddress = rpcAddressMatch ? rpcAddressMatch[1] : null;

                resolve({
                    accounts,
                    privateKeys,
                    rpcAddress,
                    pid: anvilProcess.pid
                });
            }
        });

        // Handle any errors
        anvilProcess.stderr.on('data', (data) => {
            reject(`Anvil process setup error: ${data}`);
        });
    });
}


let setupEnv = async () => {
    let freePorts = await new Promise(resolve => findFreePorts(3000, 100, resolve));
    if (!freePorts.length) {
        throw new Error("No free ports found!");
    }
    let port = freePorts[Math.floor(Math.random() * freePorts.length)];

    let envInfo = await extractAnvilInfo(port);

    const wsPort = `ws://127.0.0.1:${port}`;
    const web3 = new Web3(new Web3.providers.WebsocketProvider(wsPort));

    // Assuming the first account and private key are the signer's
    let signer = web3.eth.accounts.privateKeyToAccount(envInfo.privateKeys[0]);
    web3.eth.accounts.wallet.add(signer);

    return {
        web3,
        envInfo
    };
}

module.exports = setupEnv;