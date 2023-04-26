"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSQLiteIdentifier = exports.escapeMySqlIdentifier = exports.escapePostgresIdentifier = void 0;
const validate_unicode_1 = require("@databases/validate-unicode");
/**
 * Escapes a Postgres identifier.
 *
 * https://www.postgresql.org/docs/9.1/sql-syntax-lexical.html
 */
function escapePostgresIdentifier(str, { extended = false } = {}) {
    (0, validate_unicode_1.default)(str);
    minLength(str, 'Postgres');
    maxLength(str, 60, 'Postgres', 'https://www.postgresql.org/docs/9.3/sql-syntax-lexical.html');
    if (extended) {
        assertUnicode(str, 'Postgres');
    }
    else {
        assertAscii(str, 'Postgres', true);
    }
    return quoteString(str, `"`);
}
exports.escapePostgresIdentifier = escapePostgresIdentifier;
/**
 * Escapes a MySQL identifier.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/identifiers.html
 */
function escapeMySqlIdentifier(str, { extended = false } = {}) {
    (0, validate_unicode_1.default)(str);
    minLength(str, 'MySQL');
    maxLength(str, 64, 'MySQL', 'http://dev.mysql.com/doc/refman/5.7/en/identifiers.html');
    if (str[str.length - 1] === ' ') {
        throw new Error('MySQL identifiers may not end in whitespace');
    }
    if (extended) {
        // U+0001 .. U+007F
        // U+0080 .. U+FFFF
        assertUnicode(str, 'MySQL');
    }
    else {
        // U+0001 .. U+007F
        assertAscii(str, 'MySQL', true);
    }
    return quoteString(str, '`');
}
exports.escapeMySqlIdentifier = escapeMySqlIdentifier;
/**
 * Escapes an SQLite identifier.
 *
 * https://sqlite.org/lang_keywords.html
 */
function escapeSQLiteIdentifier(str) {
    (0, validate_unicode_1.default)(str);
    minLength(str, 'SQLite');
    if (str.length > 63) {
        throw new Error('SQLite identifiers are limited to 63 characters in @databases.');
    }
    assertAscii(str, 'SQLite', false);
    return quoteString(str, `"`);
}
exports.escapeSQLiteIdentifier = escapeSQLiteIdentifier;
function quoteString(str, quoteChar) {
    if (!str.includes(quoteChar))
        return quoteChar + str + quoteChar;
    return (quoteChar + str.split(quoteChar).join(quoteChar + quoteChar) + quoteChar);
}
const NON_ASCII = /[^\u0001-\u007f]/;
function assertAscii(str, db, unicodeAvailable) {
    if (NON_ASCII.test(str)) {
        throw new Error(`${db} identifiers must only contain ASCII characters${unicodeAvailable
            ? ` (to use unicode, pass {extended: true} when escaping the identifier)`
            : ``}`);
    }
}
const NON_UNICODE = /[^\u0001-\uffff]/;
function assertUnicode(str, db) {
    // U+0001 .. U+007F
    // U+0080 .. U+FFFF
    if (NON_UNICODE.test(str)) {
        throw new Error(`${db} identifiers must only contain characters in the range: U+0001 .. U+FFFF`);
    }
}
function minLength(str, db) {
    if (!str) {
        throw new Error(`${db} identifiers must be at least 1 character long.`);
    }
}
function maxLength(str, length, db, ref) {
    if (str.length > length) {
        throw new Error(`${db} identifiers must not be longer than ${length} characters. ${str}`);
    }
}
//# sourceMappingURL=index.js.map