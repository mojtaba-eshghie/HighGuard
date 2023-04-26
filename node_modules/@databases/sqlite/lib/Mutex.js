"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Mutex {
    constructor(maxWaitTimeout = 100) {
        this.tasks = [];
        this.running = 0;
        this.runningWrite = false;
        this._taskStart = (runningWrite) => {
            this.running++;
            this.runningWrite = runningWrite;
        };
        this._taskEnd = () => {
            this.running--;
            this.runningWrite = false;
            while (this.tasks.length && !this.tasks[0].write) {
                this._taskStart(false);
                this.tasks.shift().fn().then(this._taskEnd, this._taskEnd);
            }
            if (!this.running && this.tasks.length) {
                this._taskStart(true);
                this.tasks.shift().fn().then(this._taskEnd, this._taskEnd);
            }
        };
        this.maxWaitTimeout = maxWaitTimeout;
    }
    async readLock(fn) {
        const now = Date.now();
        if (this.runningWrite ||
            this.tasks.some((t) => t.write && now - t.start > this.maxWaitTimeout)) {
            return new Promise((resolve, reject) => {
                this.tasks.push({
                    start: now,
                    write: false,
                    fn: async () => {
                        try {
                            resolve(await fn());
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    },
                });
            });
        }
        else {
            this._taskStart(false);
            try {
                return await fn();
            }
            finally {
                this._taskEnd();
            }
        }
    }
    async writeLock(fn) {
        if (this.running) {
            return new Promise((resolve, reject) => {
                this.tasks.push({
                    start: Date.now(),
                    write: true,
                    fn: async () => {
                        try {
                            resolve(await fn());
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    },
                });
            });
        }
        else {
            this._taskStart(true);
            try {
                return await fn();
            }
            finally {
                this._taskEnd();
            }
        }
    }
}
exports.default = Mutex;
//# sourceMappingURL=Mutex.js.map