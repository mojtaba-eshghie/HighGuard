let WaitQueue = require('wait-queue');


const wq = new WaitQueue();

wq.shift().then(function(item) {
  // will wait until got value
  console.log(item);
  // "foo"
});



setTimeout(function() {
    wq.push('foo: ');
}, 1000);

/*
const queue = [];

queue.push( 'item 1' );
queue.push( 'item 2' );
queue.push( 'item 3' );


console.log(queue)

console.log( queue.shift() ); // item 1
console.log( queue.shift() ); // item 2
console.log( queue.shift() ); // undefined
*/