"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLItemType = exports.isSqlQuery = void 0;
const fs_1 = require("fs");
const web_1 = require("./web");
Object.defineProperty(exports, "SQLItemType", { enumerable: true, get: function () { return web_1.SQLItemType; } });
Object.defineProperty(exports, "isSqlQuery", { enumerable: true, get: function () { return web_1.isSqlQuery; } });
// Create the SQL interface we export.
const sql = Object.assign(web_1.default, {
    file: (filename) => web_1.default.__dangerous__rawValue((0, fs_1.readFileSync)(filename, 'utf8')),
});
exports.default = sql;
module.exports = sql;
module.exports.default = sql;
module.exports.isSqlQuery = web_1.isSqlQuery;
module.exports.SQLItemType = web_1.SQLItemType;
//# sourceMappingURL=index.js.map