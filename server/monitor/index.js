let contract_watcher = require('./contract-watcher');
let dcr_caller = require('./dcr-caller');

let monitor = (address, dcr_id, sim_id) => {
  let queue = contract_watcher(address);
  dcr_caller(queue=queue, dcr_id=dcr_id, sim_id=sim_id);
}



module.exports = monitor;