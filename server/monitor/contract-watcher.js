let WaitQueue = require('wait-queue');
let queue = new WaitQueue();

let listen = (address) => {

  setInterval(() => {
    console.log('just another item pushed...')
    queue.push('new item');
  }, 1000);
  /*
  setTimeout(function() {
    queue.push('first item ');
  }, 5000);

  setTimeout(function() {
    queue.push('second item');
  }, 2000);

  setTimeout(function() {
    queue.push('third item');
  }, 3000);

  setTimeout(function() {
    queue.push('fourth item');
  }, 4000);
  */

  //return queue;
}


setInterval(() => {
  console.log('just another item pushed...')
  queue.push('new item');
}, 1000);

queue.push('one');
queue.push('two');
queue.push('three');
queue.push('four');

//module.exports = listen;

module.exports = queue;