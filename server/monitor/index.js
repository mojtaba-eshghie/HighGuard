let contract_watcher = require('./contract-watcher');
let dcr_caller = require('./dcr-caller');






let monitor = (address) => {
  //contract_watcher(address);
  //let queue = contract_watcher(address);

  //dcr_caller(queue);

  dcr_caller(contract_watcher);
  
  /*
  let func = () => {
    contract_watcher.shift().then( (item) => {
      // will wait until got value
      console.log(item);
    });
  }

  func();
  */



  //console.log('hello world from monitor index file')


}


module.exports = monitor;
  


