# then-queue

  a simple asynchronous queue

[![Build Status](https://img.shields.io/travis/then/queue/master.svg)](https://travis-ci.org/then/queue)
[![Dependency Status](https://img.shields.io/gemnasium/then/queue.svg)](https://gemnasium.com/then/queue)
[![NPM version](https://img.shields.io/npm/v/then-queue.svg)](http://badge.fury.io/js/then-queue)

## Installation

    npm install then-queue

## API

### new Queue()

```js
var Queue = require('then-queue');
var q = new Queue();
```

  A fresh queue!

### queue.push(item)

  Push an item onto the queue

### queue.pop() -> Promise Item

  Pop an item from the queue

### queue.length

  Amount of items in the queue (note that this can be negative if `pop` has been called more times than `push`).

### Events

The `length-changed` event gets emitted whenever `pop` or `push` has been called. You could use it to spawn/kill workers when the length changes.