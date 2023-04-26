"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createNode(item) {
    return {
        _next: null,
        _prev: null,
        item: item
    };
}
var LinkedList = /** @class */ (function () {
    function LinkedList() {
        this._length = 0;
        this._front = null;
        this._end = null;
    }
    Object.defineProperty(LinkedList.prototype, "length", {
        get: function () {
            return this._length;
        },
        enumerable: true,
        configurable: true
    });
    LinkedList.prototype.empty = function () {
        this._length = 0;
        this._front = null;
        this._end = null;
    };
    LinkedList.prototype.push = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        items.forEach(function (item) {
            var node = createNode(item);
            if (_this._front && _this._end) {
                _this._end._next = node;
                node._prev = _this._end;
                _this._end = node;
            }
            else {
                _this._front = node;
                _this._end = node;
            }
            _this._length++;
        });
        return this._length;
    };
    LinkedList.prototype.shift = function () {
        var item = this._front;
        if (item === null) {
            return null;
        }
        if (item._next != null) {
            this._front = item._next;
            this._front._prev = null;
        }
        else {
            this._front = null;
            this._end = null;
        }
        item._next = null;
        this._length--;
        return item.item;
    };
    LinkedList.prototype.unshift = function () {
        var _this = this;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        items.forEach(function (item) {
            var node = createNode(item);
            if (_this._front === null) {
                _this._front = node;
                _this._end = node;
            }
            else {
                node._next = _this._front;
                _this._front._prev = node;
                _this._front = node;
            }
            _this._length++;
        });
        return this._length;
    };
    LinkedList.prototype.pop = function () {
        var item = this._end;
        if (item === null) {
            return null;
        }
        if (item._prev != null) {
            this._end = item._prev;
            this._end._next = null;
        }
        else {
            this._front = null;
            this._end = null;
        }
        this._length--;
        item._prev = null;
        return item.item;
    };
    return LinkedList;
}());
/* istanbul ignore next */
if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    LinkedList.prototype[Symbol.iterator] = function () {
        var node = this._front;
        return {
            next: function () {
                if (node === null) {
                    return { value: null, done: true };
                }
                var r = { value: node.item, done: false };
                node = node._next;
                return r;
            }
        };
    };
}
exports.default = LinkedList;
