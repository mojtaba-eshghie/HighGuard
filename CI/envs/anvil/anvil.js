let { spawn } = require('child_process');
let Web3 = require("web3");

/**
 * Extracts information from the Anvil command.
 * 
 * @returns {Promise<Object>} A promise that resolves with an object containing the accounts, private keys, and RPC address.
 * @throws {Error} If there's an error while executing the Anvil command or processing its output.
 */
let extractAnvilInfo = () => {
    return new Promise((resolve, reject) => {
        // Spawn the anvil command as a child process
        let anvilProcess = spawn('anvil');

        let output = '';

        // Capture the output
        anvilProcess.stdout.on('data', (data) => {
            output += data.toString();

            // Check if we've captured the expected output (e.g., "Listening on 127.0.0.1:8545")
            if (output.includes('Listening on')) {
                anvilProcess.stdout.removeAllListeners('data'); // Stop listening to further output

                let accounts = [...output.matchAll(/"0x[a-fA-F0-9]{40}"/g)].map(match => match[0].replace(/"/g, ''));
                let privateKeys = [...output.matchAll(/0x[a-fA-F0-9]{64}/g)].map(match => match[0]);

                let rpcAddressMatch = output.match(/Listening on (\d+\.\d+\.\d+\.\d+:\d+)/);
                let rpcAddress = rpcAddressMatch ? rpcAddressMatch[1] : null;

                resolve({
                    accounts,
                    privateKeys,
                    rpcAddress
                });
            }
        });

        // Handle any errors
        anvilProcess.stderr.on('data', (data) => {
            reject(`Error: ${data}`);
        });
    });
}

let setupEnv = async () => {
    let envInfo = await extractAnvilInfo();

    let web3 = new Web3('http://'+envInfo.rpcAddress);

    // Assuming the first account and private key are the signer's
    let signer = web3.eth.accounts.privateKeyToAccount(envInfo.privateKeys[0]);
    web3.eth.accounts.wallet.add(signer);

    return {
        web3,
        envInfo
    };
}

module.exports = setupEnv;
