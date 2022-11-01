let contract_watcher = require('./contract-watcher');
let dcr_caller = require('./dcr-caller');





let monitor = (address) => {

  let queue = contract_watcher(address);
  dcr_caller(queue);

}



module.exports = monitor;