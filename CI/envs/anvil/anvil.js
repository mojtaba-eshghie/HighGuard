const { spawn } = require('child_process');

/**
 * Extracts information from the Anvil command.
 * 
 * This function spawns the Anvil command as a child process and captures its output.
 * It then extracts the Ethereum accounts, private keys, and the RPC address from the output.
 * 
 * @returns {Promise<Object>} A promise that resolves with an object containing the accounts, private keys, and RPC address.
 * @throws {Error} If there's an error while executing the Anvil command or processing its output.
 */
function extractAnvilInfo() {
    return new Promise((resolve, reject) => {
        // Spawn the anvil command as a child process
        const anvilProcess = spawn('anvil');

        let output = '';

        // Capture the output
        anvilProcess.stdout.on('data', (data) => {
            output += data.toString();

            // Check if we've captured the expected output (e.g., "Listening on 127.0.0.1:8545")
            if (output.includes('Listening on')) {
                anvilProcess.stdout.removeAllListeners('data'); // Stop listening to further output

                const accounts = [...output.matchAll(/"0x[a-fA-F0-9]{40}"/g)].map(match => match[0].replace(/"/g, ''));
                const privateKeys = [...output.matchAll(/0x[a-fA-F0-9]{64}/g)].map(match => match[0]);

                // Utility function to strip ANSI escape codes from a string
                let stripAnsiCodes = (str) => {
                    return str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, '');
                }
                const strippedOutput = stripAnsiCodes(output);

                const rpcAddressMatch = output.match(/Listening on (\d+\.\d+\.\d+\.\d+:\d+)/);
                const rpcAddress = rpcAddressMatch ? rpcAddressMatch[1] : null;

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

module.exports = {
    extractAnvilInfo
};
