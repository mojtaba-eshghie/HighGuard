/**
 * Escapes a Postgres identifier.
 *
 * https://www.postgresql.org/docs/9.1/sql-syntax-lexical.html
 */
export declare function escapePostgresIdentifier(str: string, { extended }?: {
    extended?: boolean;
}): string;
/**
 * Escapes a MySQL identifier.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/identifiers.html
 */
export declare function escapeMySqlIdentifier(str: string, { extended }?: {
    extended?: boolean;
}): string;
/**
 * Escapes an SQLite identifier.
 *
 * https://sqlite.org/lang_keywords.html
 */
export declare function escapeSQLiteIdentifier(str: string): string;
