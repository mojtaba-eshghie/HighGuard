"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IN_MEMORY = exports.DatabaseConnectionMode = exports.isSqlQuery = exports.sql = void 0;
const sqlite = require("sqlite3");
const escape_identifier_1 = require("@databases/escape-identifier");
const sql_1 = require("@databases/sql");
exports.sql = sql_1.default;
Object.defineProperty(exports, "isSqlQuery", { enumerable: true, get: function () { return sql_1.isSqlQuery; } });
const Mutex_1 = require("./Mutex");
const Queue = require('then-queue');
const sqliteFormat = {
    escapeIdentifier: (str) => (0, escape_identifier_1.escapeSQLiteIdentifier)(str),
    formatValue: (value) => ({ placeholder: '?', value }),
};
var DatabaseConnectionMode;
(function (DatabaseConnectionMode) {
    DatabaseConnectionMode[DatabaseConnectionMode["ReadOnly"] = sqlite.OPEN_READONLY] = "ReadOnly";
    DatabaseConnectionMode[DatabaseConnectionMode["ReadWrite"] = sqlite.OPEN_READWRITE] = "ReadWrite";
    // tslint:disable-next-line:no-bitwise
    DatabaseConnectionMode[DatabaseConnectionMode["ReadWriteCreate"] = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE] = "ReadWriteCreate";
    // tslint:disable-next-line:no-bitwise
    DatabaseConnectionMode[DatabaseConnectionMode["ReadCreate"] = sqlite.OPEN_READONLY | sqlite.OPEN_CREATE] = "ReadCreate";
    DatabaseConnectionMode[DatabaseConnectionMode["Create"] = sqlite.OPEN_CREATE] = "Create";
})(DatabaseConnectionMode = exports.DatabaseConnectionMode || (exports.DatabaseConnectionMode = {}));
class DatabaseTransactionImplementation {
    constructor(database) {
        this._database = database;
    }
    async query(query) {
        if (!(0, sql_1.isSqlQuery)(query)) {
            throw new Error('Expected query to be an SQLQuery');
        }
        return runQuery(query, this._database, async (fn) => fn());
    }
    /**
     * @deprecated use queryStream
     */
    stream(query) {
        return this.queryStream(query);
    }
    queryStream(query) {
        if (!(0, sql_1.isSqlQuery)(query)) {
            throw new Error('Expected query to be an SQLQuery');
        }
        return runQueryStream(query, this._database, async (fn) => fn());
    }
}
exports.IN_MEMORY = ':memory:';
class DatabaseConnectionImplementation {
    constructor(filename, options = {}) {
        this._mutex = new Mutex_1.default();
        this._database = new sqlite.Database(filename, options.mode);
        if (options.verbose) {
            sqlite.verbose();
        }
        if (options.busyTimeout !== undefined) {
            this._database.configure('busyTimeout', options.busyTimeout);
        }
    }
    async query(query) {
        if (!(0, sql_1.isSqlQuery)(query)) {
            throw new Error('Expected query to be an SQLQuery');
        }
        return runQuery(query, this._database, async (fn) => this._mutex.readLock(fn));
    }
    /**
     * @deprecated use queryStream
     */
    stream(query) {
        return this.queryStream(query);
    }
    queryStream(query) {
        if (!(0, sql_1.isSqlQuery)(query)) {
            throw new Error('Expected query to be an SQLQuery');
        }
        return runQueryStream(query, this._database, async (fn) => this._mutex.readLock(fn));
    }
    async tx(fn) {
        return this._mutex.writeLock(async () => {
            await new Promise((resolve, reject) => {
                this._database.run('BEGIN', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            try {
                const result = await fn(new DatabaseTransactionImplementation(this._database));
                await new Promise((resolve, reject) => {
                    this._database.run('COMMIT', (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
                return result;
            }
            catch (ex) {
                await new Promise((resolve, reject) => {
                    this._database.run('ROLLBACK', (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
                throw ex;
            }
        });
    }
    async dispose() {
        await new Promise((resolve, reject) => {
            this._database.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
function connect(filename = exports.IN_MEMORY, options = {}) {
    return new DatabaseConnectionImplementation(filename, options);
}
exports.default = connect;
module.exports = Object.assign(connect, {
    default: connect,
    DatabaseConnectionMode,
    IN_MEMORY: exports.IN_MEMORY,
    sql: sql_1.default,
    isSqlQuery: sql_1.isSqlQuery,
});
async function runQuery(query, database, lock) {
    const { text, values } = query.format(sqliteFormat);
    return lock(async () => {
        return await new Promise((resolve, reject) => {
            database.all(text, values, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    });
}
async function* runQueryStream(query, database, lock) {
    const queue = new Queue();
    const { text, values } = query.format(sqliteFormat);
    lock(async () => {
        await new Promise((releaseMutex) => {
            database.each(text, values, (err, row) => {
                if (err)
                    queue.push({ done: true, err });
                else
                    queue.push({ done: false, value: row });
            }, (err) => {
                releaseMutex();
                queue.push({ done: true, err });
            });
        });
    }).catch((ex) => {
        setImmediate(() => {
            throw ex;
        });
    });
    let value = await queue.pop();
    while (!value.done) {
        yield value.value;
        value = await queue.pop();
    }
}
//# sourceMappingURL=index.js.map