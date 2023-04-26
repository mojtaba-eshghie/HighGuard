# wait-queue

[![Travis CI][ci-image]][ci-url]
[![Coveralls][coverage-image]][coverage-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

A javascript wait queue object handle infinity loop tasks more efficiently

WaitQueue is an async implements of Array

## Table of Contents

- [How to use](#how-to-use)
- [Requirements](#requirements)
- [Change Log](./CHANGELOG.md)
- [Properties](#properties)
- [Methods](#methods)
- [Benchmark](#benchmark)

Examples

- [Iterator](#iterator)
- [Multi Worker](#example-multi-worker)
- [Push a function](#example-push-a-function)
- [Loop Tasks](#example-loop-tasks)
- [Using with co](#using-with-co)

## How to use

```shell
$ npm install wait-queue
```

### TypeScript

```typescript
import WaitQueue from 'wait-queue';
const wq = new WaitQueue<string>();

async function run() {
  const item = await wq.shift();
  console.log(item);
}

setTimeout(() => {
  wq.push('foo');
}, 1000);

run();
```

### JS

```js
const WaitQueue = require('wait-queue');
const wq = new WaitQueue();
wq.shift().then(function(item) {
  // will wait until got value
  console.log(item);
  // "foo"
});

setTimeout(function() {
  wq.push('foo');
}, 1000);
```

## Requirements

**Build**: Node.js >= 8.x

## Properties

### wq.length

Length of the WaitQueue(readonly)

### wq.queue

A LinkedList, used to store the queue items, Do not modify it directly

### wq.listeners

If no elements in queue yet, listener will add here, Don't modify it

## Methods

### wq.push(item1, [item2])

Add items to the end of the queue, will return length of the queue

### wq.shift().then( item => )

Got an item from front of the queue, this is a Promise method, if there's no item
in the queue, it will wait

### wq.unshift(item)

Put an item in front of the queue, will return length of the queue

### wq.pop().then( item => )

Got an item at the end of the queue, this is a Promise method, if there's no item
in the queue, it will wait

### wq.empty() alias of wq.clearQueue()

Clear the queue, Won't clear listeners

### wq.clearListeners()

Clear waited listeners of the queue

## Benchmark

```
$ git clone https://github.com/flarestart/wait-queue.git
$ cd wait-queue
$ npm install
$ npm run benchmark
```

Sample data in Macbook Pro MF839/8GB

### 1.1.0(Improve benchmark code)

    Array.push(1k data) speed test x 629,538 ops/sec ±22.90% (26 runs sampled)
    Array.push(1k data) 1000000 times then Array.shift() speed test x 492 ops/sec ±1.02% (89 runs sampled)
    WaitQueue.push(1k data) speed test x 501,581 ops/sec ±23.45% (14 runs sampled)
    WaitQueue.unshift(1k data) speed test x 447,272 ops/sec ±24.80% (14 runs sampled)
    WaitQueue.shift() speed test x 315,356 ops/sec ±14.30% (52 runs sampled)
    WaitQueue.pop() speed test x 240,568 ops/sec ±51.35% (39 runs sampled)
    WaitQueue.push(1k data) 1000000 times then WaitQueue.shift() speed test x 476,918 ops/sec ±26.68% (29 runs sampled)
    WaitQueue.push(1k data) 1000000 times then WaitQueue.pop() speed test x 471,668 ops/sec ±25.08% (31 runs sampled)
    Array.push(4k data) speed test x 119,981 ops/sec ±61.52% (14 runs sampled)
    Array.push(4k data) 1000000 times then Array.shift() speed test x 479 ops/sec ±1.41% (86 runs sampled)
    WaitQueue.push(4k data) speed test x 147,153 ops/sec ±46.03% (14 runs sampled)
    WaitQueue.unshift(4k data) speed test x 157,694 ops/sec ±37.29% (16 runs sampled)
    WaitQueue.push(4k data) 1000000 times then WaitQueue.shift() speed test x 447,783 ops/sec ±28.01% (31 runs sampled)
    WaitQueue.push(4k data) 1000000 times then WaitQueue.pop() speed test x 409,826 ops/sec ±30.73% (28 runs sampled)

### 1.0.3(Use LinkedList)

    .push() 1k data speed test x 511,367 ops/sec ±31.07% (27 runs sampled)
    .unshift() 1k data speed test x 269,995 ops/sec ±39.60% (14 runs sampled)
    .push() 4k data speed test x 41,531 ops/sec ±12.20% (7 runs sampled)
    .unshift() 4k data speed test x 35,928 ops/sec ±5.11% (8 runs sampled)
    .shift() 69614.33093950555 /s

### 1.0.2(Use Array)

    .push() 1k data speed test x 554,552 ops/sec ±26.09% (25 runs sampled)
    .unshift() 1k data speed test x 132 ops/sec ±2.96% (72 runs sampled)
    .push() 4k data speed test x 75,107 ops/sec ±22.32% (9 runs sampled)
    .unshift() 4k data speed test x 115 ops/sec ±2.15% (71 runs sampled)
    .shift() `wait too long, I didn't wait for the result, I guess is about 110/s`

## Example: Iterator

use for ... of to get all values

```js
'use strict';
const WaitQueue = require('wait-queue');
const wq = new WaitQueue();

wq.push(1, 2, 3, 4, 5);

console.log('length', wq.length);
for (var n of wq) {
  console.log(n);
}
```

## Example: Multi Worker

```js
'use strict';
const WaitQueue = require('wait-queue');
const wq = new WaitQueue();

// worker loop
function run_worker(id, time) {
  var loop = function() {
    // get item at the front of the queue
    wq.shift().then(item => {
      console.log('worker-' + id);
      console.log('  queue-len', wq.queue.length, 'item', item);
      setTimeout(loop, time);
    });
  };
  loop();
}

// worker-a use 1s every task
run_worker('a', 1000);
// worker-b use 2s every task
run_worker('b', 2000);
// worker-c use 5s every task
run_worker('c', 5000);

// add a task every 500ms
for (var n = 0; n < 20; n++) {
  wq.push(n);
}
```

## Example: Push a function

```js
'use strict';
const WaitQueue = require('wait-queue');
const wq = new WaitQueue();

// there's no task here
wq.shift().then(item => {
  item.call();
});

// add a function as item
wq.push(function() {
  console.log('a function');
});
```

## Example: Loop Tasks

```js
'use strict';
const WaitQueue = require('wait-queue');
const wq = new WaitQueue();

function loop() {
  // put first element out of queue
  wq.shift()
    .then(function(item) {
      // do some job on item
      console.log(item);
      // do next loop
      setImmediate(loop);
    })
    .catch(function(e) {
      console.error('error', e);
      setImmediate(loop);
    });
}
setImmediate(loop);

var taskID = 0;
var interval;
// add a task every 1s
interval = setInterval(function() {
  wq.push({
    taskid: taskID++,
  });
}, 1000);
```

## Using with co

```js
'use strict';
const WaitQueue = require('wait-queue');
const co = require('co');
const wq = new WaitQueue();

co(function*() {
  while (true) {
    let item = yield wq.shift();
    // catch errors from runTask, so that it won't stop the task loop
    try {
      yield runTask(item);
    } catch (e) {
      // output errors
      console.error('error', item);
      // you can re do task from here
      wq.push(item);
      console.log('add error item to end of queue');
    }
  }
});

function runTask(item) {
  return new Promise(function(resolve, reject) {
    // a task will run 2s
    setTimeout(function() {
      if (Math.random() > 0.8) {
        return reject(new Error('some unknown error'));
      }
      console.log('done', item);
      resolve();
    }, 1000);
  });
}

// add a task every 1s
var taskID = 0;
setInterval(function() {
  wq.push({
    taskid: taskID++,
  });
}, 1000);
```

## License

MIT

[coverage-image]: https://img.shields.io/coveralls/flarestart/wait-queue.svg
[coverage-url]: https://coveralls.io/github/flarestart/wait-queue
[ci-image]: https://img.shields.io/travis/flarestart/wait-queue.svg?branch=master
[ci-url]: https://travis-ci.org/flarestart/wait-queue
[npm-image]: https://img.shields.io/npm/v/wait-queue.svg
[npm-url]: https://npmjs.org/package/wait-queue
[downloads-image]: http://img.shields.io/npm/dm/wait-queue.svg
[downloads-url]: https://npmjs.org/package/wait-queue
