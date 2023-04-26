'use strict';

var assert = require('assert')
var test = require('testit')
var Queue = require('../')

test('queue', function () {
  var q = new Queue();
  var length = 0;
  var results = [];
  q.on('length-changed', function (l) {
    assert(q.length === l)
    assert(length !== l)
    length = l
  })
  assert(q.length === 0);
  q.push(1);
  assert(q.length === 1);
  assert(length === 1);
  q.push(2);
  assert(q.length === 2);
  assert(length === 2);
  q.push(3);
  assert(q.length === 3);
  assert(length === 3);
  return q.pop().then(function (n) {
    assert(n === 1);
    assert(q.length === 2);
    assert(length === 2);
    return q.pop();
  }).then(function (n) {
    assert(n === 2);
    assert(q.length === 1);
    assert(length === 1);
    return q.pop();
  }).then(function (n) {
    assert(n === 3);
    assert(q.length === 0);
    assert(length === 0);
    results.push(q.pop());
    assert(q.length === -1);
    assert(length === -1);
    results.push(q.pop());
    assert(q.length === -2);
    assert(length === -2);
    results.push(q.pop());
    assert(q.length === -3);
    assert(length === -3);
    q.push(1);
    assert(q.length === -2);
    return results.shift();
  }).then(function (n) {
    assert(n === 1);
    q.push(2);
    assert(q.length === -1);
    assert(length === -1);
    return results.shift();
  }).then(function (n) {
    assert(n === 2);
    q.push(3);
    assert(q.length === 0);
    assert(length === 0);
    return results.shift();
  }).then(function (n) {
    assert(n === 3);
  });
});