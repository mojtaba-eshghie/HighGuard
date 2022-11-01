let contract_watcher = require('contract-watcher');
let dcr_invoker = require('dcr-caller');

// this waitqueue should be gererated in producer
let queue = new WaitQueue();



queue.shift().then(function(item) {
  // will wait until got value
  console.log(item);
});


let monitor = () => {
  console.log('hello world from index.js')
}


module.exports = monitor;
  


