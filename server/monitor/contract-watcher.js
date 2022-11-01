let WaitQueue = require('wait-queue');
let queue = new WaitQueue();

/**
 * Listens to all blockchain events on a particular smart contract
 */
let listen = (address) => {
  
  // following lines are just dummy to keep the queue busy
  queue.push('one');
  queue.push('two');
  queue.push('three');
  queue.push('four');
  setInterval(() => {
    console.log('just another item pushed...')
    queue.push('new item');
  }, 1500);

  return queue;
}


module.exports = listen;

