const { exec } = require('child_process');

/**
 * Terminates all running instances of a process by its name.
 * 
 * @param {string} processName - The name of the process to terminate.
 * @returns {Promise} - Resolves when the processes are terminated.
 * 
 * @warning DANGEROUS OPERATION:
 * As this function will kill all processes on the platform with the same name,
 * if you use it to kill a running test environment (such as anvil), it will kill
 * all your running exploits/tests.
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


/**
 * Terminates a process by its PID.
 * 
 * @param {number} pid - The PID of the process to terminate.
 * @returns {Promise} - Resolves when the process is terminated.
 */
function terminateProcessByPid(pid) {
    return new Promise((resolve, reject) => {
        // Platform-specific command
        const isWindows = process.platform === 'win32';
        const cmd = isWindows 
            ? `taskkill /PID ${pid} /F` 
            : `kill -9 ${pid}`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error terminating process with PID ${pid}:`, stderr);
                reject(error);
            } else {
                console.log(`Terminated process with PID ${pid}`);
                resolve(stdout);
            }
        });
    });
}


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



module.exports = {
    terminateProcessesByName,
    terminateProcessByPid,
    sleep,
};
