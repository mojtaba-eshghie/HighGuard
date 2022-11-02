let contract_watcher = require('./contract-watcher');
let dcr_caller = require('./dcr-caller');

let monitor = (address) => {
  let queue = contract_watcher(address);
  dcr_caller(queue=queue, dcr_id=1327657, sim_id=1472452);
}



module.exports = monitor;