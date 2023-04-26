'use strict';

var EventEmitter = require('events').EventEmitter
var Promise = require('promise')

module.exports = Queue
function Queue() {
  if (!(this instanceof Queue)) return new Queue()
  EventEmitter.call(this)
  this._items = []
  this._waiting = []
  this.length = 0
}
Queue.prototype = Object.create(EventEmitter.prototype)
Queue.prototype.constructor = Queue

Queue.prototype.push = function(item) {
  this.length++
  this.emit('length-changed', this.length)
  if (this._waiting.length) {
    var waiting = this._waiting.shift()
    waiting(item)
  }
  else {
    this._items.push(item)
  }
}

Queue.prototype.pop = function(cb) { var self = this
  this.length--
  this.emit('length-changed', this.length)
  if (this._items.length) {
    var item = this._items.shift()
    return Promise.resolve(item).nodeify(cb)
  }
  else {
    return new Promise(function(resolve, reject) {
      self._waiting.push(resolve)
    }).nodeify(cb)
  }
}
