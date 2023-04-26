"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSqlQuery = exports.SQLItemType = void 0;
var SQLItemType;
(function (SQLItemType) {
    SQLItemType[SQLItemType["RAW"] = 0] = "RAW";
    SQLItemType[SQLItemType["VALUE"] = 1] = "VALUE";
    SQLItemType[SQLItemType["IDENTIFIER"] = 2] = "IDENTIFIER";
})(SQLItemType = exports.SQLItemType || (exports.SQLItemType = {}));
const formatter = Symbol('SQL Query Formatter');
const literalSeparators = new Set([
    '',
    ',',
    ', ',
    ' AND ',
    ' OR ',
    ') AND (',
    ') OR (',
    ';',
]);
/**
 * The representation of a SQL query. Call `compile` to turn it into a SQL
 * string with value placeholders.
 *
 * This object is immutable. Instead of changing the object, new `SQLQuery`
 * values will be returned.
 *
 * The constructor for this class is private and may not be called.
 */
class SQLQuery {
    // The constructor is private. Users should use the static `create` method to
    // make a new `SQLQuery`.
    constructor(items) {
        this._cache = new Map();
        this._items = items;
    }
    static registerFormatter(constructor, format) {
        constructor.prototype[formatter] = format;
    }
    /**
     * A template string tag that interpolates literal SQL with placeholder SQL
     * values.
     */
    static query(strings, ...values) {
        const items = [];
        // Add all of the strings as raw items and values as placeholder values.
        for (let i = 0; i < strings.length; i++) {
            if (strings[i]) {
                items.push({ type: SQLItemType.RAW, text: strings[i] });
            }
            if (i < values.length) {
                const value = values[i];
                // If the value is a `SQLQuery`, add all of its items.
                if (value instanceof SQLQuery) {
                    for (const item of value._items)
                        items.push(item);
                }
                else {
                    if (value && typeof value === 'object' && formatter in value) {
                        const formatted = value[formatter](value);
                        if (!(formatted instanceof SQLQuery)) {
                            throw new Error('Formatters should always return SQLQuery objects');
                        }
                        for (const item of formatted._items)
                            items.push(item);
                    }
                    else {
                        const before = strings[i][strings[i].length - 1];
                        const after = strings.length > i + 1 ? strings[i + 1][0] : undefined;
                        if (after &&
                            ((before === `'` && after === `'`) ||
                                (before === `"` && after === `"`) ||
                                (before === '`' && after === '`'))) {
                            throw new Error(`You do not need to wrap values in 'quotes' when using @databases. Any JavaScript string passed via \${...} syntax is already treated as a string. Please remove the quotes around this value.`);
                        }
                        if (typeof value === 'bigint') {
                            items.push({ type: SQLItemType.VALUE, value: value.toString(10) });
                        }
                        else {
                            items.push({ type: SQLItemType.VALUE, value });
                        }
                    }
                }
            }
        }
        return new SQLQuery(items);
    }
    /**
     * Joins multiple queries together and puts a separator in between if a
     * separator was defined.
     */
    static join(queries, separator) {
        if (typeof separator === 'string' && !literalSeparators.has(separator)) {
            throw new Error(`Please tag your string as an SQL query via "sql.join(..., sql\`${separator.includes('`') ? 'your_separator' : separator}\`)" or use one of the standard speparators: ${[...literalSeparators]
                .map((s) => `"${s}"`)
                .join(', ')}`);
        }
        const items = [];
        const separatorItems = separator
            ? typeof separator === 'string'
                ? [{ type: SQLItemType.RAW, text: separator }]
                : separator._items
            : undefined;
        let addedFirst = false;
        // Add the items of all our queries into the `items` array, adding text
        // separator items as necessary.
        for (const query of queries) {
            if (!addedFirst) {
                addedFirst = true;
            }
            else if (separatorItems) {
                items.push(...separatorItems);
            }
            items.push(...query._items);
        }
        return new SQLQuery(items);
    }
    /**
     * Creates a new query with the raw text.
     */
    static __dangerous__rawValue(text) {
        return new SQLQuery([{ type: SQLItemType.RAW, text }]);
    }
    /**
     * Creates a new query from the array of `SQLItem` parts
     */
    static __dangerous__constructFromParts(items) {
        return new SQLQuery(items);
    }
    /**
     * Creates a new query with the value. This value will be turned into a
     * placeholder when the query gets compiled.
     */
    static value(value) {
        return new SQLQuery([{ type: SQLItemType.VALUE, value }]);
    }
    /**
     * Creates an identifier query. Each name will be escaped, and the
     * names will be concatenated with a period (`.`).
     */
    static ident(...names) {
        return new SQLQuery([{ type: SQLItemType.IDENTIFIER, names }]);
    }
    format(formatter) {
        const cached = this._cache.get(formatter);
        if (cached)
            return cached;
        const fresh = typeof formatter === 'function'
            ? formatter(this._items)
            : formatStandard(this._items, formatter);
        this._cache.set(formatter, fresh);
        return fresh;
    }
}
function formatStandard(items, { escapeIdentifier, formatValue }) {
    // Create an empty query object.
    let text = '';
    const values = [];
    const localIdentifiers = new Map();
    for (const item of items) {
        switch (item.type) {
            // If this is just raw text, we add it directly to the query text.
            case SQLItemType.RAW: {
                text += item.text;
                break;
            }
            // If we got a value SQL item, add a placeholder and add the value to our
            // placeholder values array.
            case SQLItemType.VALUE: {
                const { placeholder, value } = formatValue(item.value, values.length);
                text += placeholder;
                values.push(value);
                break;
            }
            // If we got an identifier type, escape the strings and get a local
            // identifier for non-string identifiers.
            case SQLItemType.IDENTIFIER: {
                text += item.names
                    .map((name) => {
                    if (typeof name === 'string')
                        return escapeIdentifier(name);
                    if (!localIdentifiers.has(name))
                        localIdentifiers.set(name, `__local_${localIdentifiers.size}__`);
                    return escapeIdentifier(localIdentifiers.get(name));
                })
                    .join('.');
                break;
            }
        }
    }
    if (text.trim()) {
        const lines = text.split('\n');
        const min = Math.min(...lines
            .filter((l) => l.trim() !== '')
            .map((l) => /^\s*/.exec(l)[0].length));
        if (min) {
            text = lines.map((line) => line.substr(min)).join('\n');
        }
    }
    return { text: text.trim(), values };
}
// tslint:disable:no-unbound-method
// Create the SQL interface we export.
const sql = Object.assign(SQLQuery.query, {
    join: SQLQuery.join,
    __dangerous__rawValue: SQLQuery.__dangerous__rawValue,
    __dangerous__constructFromParts: SQLQuery.__dangerous__constructFromParts,
    value: SQLQuery.value,
    ident: SQLQuery.ident,
    registerFormatter: SQLQuery.registerFormatter,
    isSqlQuery,
});
// tslint:enable:no-unbound-method
exports.default = sql;
function isSqlQuery(query) {
    return query instanceof SQLQuery;
}
exports.isSqlQuery = isSqlQuery;
module.exports = sql;
module.exports.default = sql;
module.exports.isSqlQuery = isSqlQuery;
module.exports.SQLItemType = SQLItemType;
//# sourceMappingURL=web.js.map