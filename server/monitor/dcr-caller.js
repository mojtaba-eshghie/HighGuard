const WaitQueue = require('wait-queue');
const wq = new WaitQueue();

wq.shift().then(function(item) {
  // will wait until got value
  console.log(item);
  // "foo"
});

