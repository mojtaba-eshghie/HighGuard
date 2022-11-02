let contract_watcher = require('./contract-watcher');
let dcr_caller = require('./dcr-caller');


let monitor = (address) => {
  let queue = contract_watcher(address);
  dcr_caller(queue, 1327657, 1472452);
}



module.exports = monitor;