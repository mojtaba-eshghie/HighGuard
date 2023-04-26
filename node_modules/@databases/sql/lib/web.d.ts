export declare enum SQLItemType {
    RAW = 0,
    VALUE = 1,
    IDENTIFIER = 2
}
/**
 * A single, escaped, `SQLQuery` item. These items are assembled into a SQL
 * query through the compile method.
 */
export declare type SQLItem = {
    type: SQLItemType.RAW;
    text: string;
} | {
    type: SQLItemType.VALUE;
    value: any;
} | {
    type: SQLItemType.IDENTIFIER;
    names: Array<any>;
};
export interface FormatConfig {
    escapeIdentifier: (str: string) => string;
    formatValue: (value: unknown, index: number) => {
        readonly placeholder: string;
        readonly value: unknown;
    };
}
declare const literalSeparators: Set<"" | "," | ", " | " AND " | " OR " | ") AND (" | ") OR (" | ";">;
declare type LiteralSeparator = typeof literalSeparators extends Set<infer T> ? T : never;
/**
 * The representation of a SQL query. Call `compile` to turn it into a SQL
 * string with value placeholders.
 *
 * This object is immutable. Instead of changing the object, new `SQLQuery`
 * values will be returned.
 *
 * The constructor for this class is private and may not be called.
 */
declare class SQLQuery {
    static registerFormatter<T>(constructor: new (...args: any[]) => T, format: (value: T) => SQLQuery): void;
    /**
     * A template string tag that interpolates literal SQL with placeholder SQL
     * values.
     */
    static query(strings: TemplateStringsArray, ...values: Array<any>): SQLQuery;
    /**
     * Joins multiple queries together and puts a separator in between if a
     * separator was defined.
     */
    static join(queries: Array<SQLQuery>, separator?: LiteralSeparator | SQLQuery): SQLQuery;
    /**
     * Creates a new query with the raw text.
     */
    static __dangerous__rawValue(text: string): SQLQuery;
    /**
     * Creates a new query from the array of `SQLItem` parts
     */
    static __dangerous__constructFromParts(items: readonly SQLItem[]): SQLQuery;
    /**
     * Creates a new query with the value. This value will be turned into a
     * placeholder when the query gets compiled.
     */
    static value(value: any): SQLQuery;
    /**
     * Creates an identifier query. Each name will be escaped, and the
     * names will be concatenated with a period (`.`).
     */
    static ident(...names: Array<any>): SQLQuery;
    /**
     * The internal array of SQL items. This array is never mutated, only cloned.
     */
    private readonly _items;
    private readonly _cache;
    private constructor();
    format(config: FormatConfig): {
        text: string;
        values: unknown[];
    };
    format<T>(formatter: (items: readonly SQLItem[]) => T): T;
}
export type { SQLQuery };
/**
 * The interface we actually expect people to use.
 */
export declare type SQL = typeof SQLQuery.query & {
    readonly join: typeof SQLQuery.join;
    readonly __dangerous__rawValue: typeof SQLQuery.__dangerous__rawValue;
    readonly __dangerous__constructFromParts: typeof SQLQuery.__dangerous__constructFromParts;
    readonly value: typeof SQLQuery.value;
    readonly ident: typeof SQLQuery.ident;
    readonly registerFormatter: typeof SQLQuery.registerFormatter;
    readonly isSqlQuery: (query: unknown) => query is SQLQuery;
};
declare const sql: SQL;
export default sql;
export declare function isSqlQuery(query: unknown): query is SQLQuery;
