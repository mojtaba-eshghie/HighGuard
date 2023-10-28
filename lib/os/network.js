const net = require('net');

/**
 * Searches for a specified number of free ports starting from a given port.
 * 
 * @param {number} startPort - The port number to start the search from.
 * @param {number} count - The number of ports to check for availability.
 * @param {function} callback - Callback function to be invoked once all ports are checked. 
 *                              It receives an array of free ports as its argument.
 */
function findFreePorts(startPort, count, callback) {
    let freePorts = [];
    let checkedPorts = 0;

    for (let i = startPort; i < startPort + count; i++) {
        const server = net.createServer();

        server.listen(i, () => {
            freePorts.push(i);
            server.close();
        });

        server.on('listening', () => {
            checkedPorts++;
            if (checkedPorts === count) {
                callback(freePorts);
            }
        });

        server.on('error', () => {
            checkedPorts++;
            if (checkedPorts === count) {
                callback(freePorts);
            }
        });
    }
}


module.exports = {
    findFreePorts
};
