"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/*
 * Javascript WaitQueue Object
 * https://github.com/flarestart/wait-queue
 */
var LinkedList_1 = __importDefault(require("./libs/LinkedList"));
var nextLoop = (function () {
    if (typeof setImmediate === 'function') {
        return setImmediate;
    }
    /* istanbul ignore next */
    return function (fn) { return setTimeout(fn, 0); };
})();
var WaitQueue = /** @class */ (function () {
    function WaitQueue() {
        this.queue = new LinkedList_1.default();
        this.listeners = new LinkedList_1.default();
    }
    Object.defineProperty(WaitQueue.prototype, "length", {
        get: function () {
            return this.queue.length;
        },
        enumerable: true,
        configurable: true
    });
    WaitQueue.prototype.empty = function () {
        this.queue = new LinkedList_1.default();
    };
    WaitQueue.prototype.clear = function () {
        this.queue = new LinkedList_1.default();
    };
    WaitQueue.prototype.clearListeners = function () {
        var e_1, _a;
        try {
            for (var _b = __values(this.listeners), _c = _b.next(); !_c.done; _c = _b.next()) {
                var listener = _c.value;
                listener(new Error('Clear Listeners'));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.listeners = new LinkedList_1.default();
    };
    WaitQueue.prototype.unshift = function () {
        var _a;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        (_a = this.queue).unshift.apply(_a, __spread(items));
        this._flush();
        return this.length;
    };
    WaitQueue.prototype.push = function () {
        var _a;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        (_a = this.queue).push.apply(_a, __spread(items));
        this._flush();
        return this.length;
    };
    WaitQueue.prototype.shift = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.queue.length > 0) {
                return resolve(_this.queue.shift());
            }
            else {
                _this.listeners.push(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(_this.queue.shift());
                });
            }
        });
    };
    WaitQueue.prototype.pop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.queue.length > 0) {
                return resolve(_this.queue.pop());
            }
            else {
                _this.listeners.push(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(_this.queue.pop());
                });
            }
        });
    };
    WaitQueue.prototype._flush = function () {
        if (this.queue.length > 0 && this.listeners.length > 0) {
            var listener = this.listeners.shift();
            listener.call(this);
            // delay next loop
            nextLoop(this._flush.bind(this));
        }
    };
    return WaitQueue;
}());
if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    WaitQueue.prototype[Symbol.iterator] = function () {
        var node = this.queue._front;
        return {
            next: function () {
                if (node === null) {
                    return { value: null, done: true };
                }
                else {
                    var r = { value: node.item, done: false };
                    node = node._next;
                    return r;
                }
            },
        };
    };
}
module.exports = WaitQueue;
