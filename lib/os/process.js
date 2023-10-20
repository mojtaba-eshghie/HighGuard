const { exec } = require('child_process');

/**
 * Terminates all running instances of a process by its name.
 * 
 * @param {string} processName - The name of the process to terminate.
 * @returns {Promise} - Resolves when the processes are terminated.
 */
function terminateProcessesByName(processName) {
    return new Promise((resolve, reject) => {
        // Platform-specific command
        const isWindows = process.platform === 'win32';
        const cmd = isWindows 
            ? `taskkill /IM ${processName} /F` 
            : `pkill -f ${processName}`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error terminating process ${processName}:`, stderr);
                reject(error);
            } else {
                console.log(`Terminated all instances of ${processName}`);
                resolve(stdout);
            }
        });
    });
}

module.exports = {
    terminateProcessesByName
};
