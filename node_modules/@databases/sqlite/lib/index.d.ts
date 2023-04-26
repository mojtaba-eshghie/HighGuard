import sql, { SQLQuery, isSqlQuery } from '@databases/sql';
export type { SQLQuery };
export { sql, isSqlQuery };
export declare enum DatabaseConnectionMode {
    ReadOnly,
    ReadWrite,
    ReadWriteCreate,
    ReadCreate,
    Create
}
export interface DatabaseConnectionOptions {
    /**
     * Sets the busy timeout. Must be a postive integer if provided.
     *
     * @see https://www.sqlite.org/c3ref/busy_timeout.html
     */
    busyTimeout?: number;
    /**
     * Defaults to DatabaseConnectionMode.ReadWriteCreate
     */
    mode?: DatabaseConnectionMode;
    /**
     * Enable long stack traces for debugging. This is global
     * and cannot be disabled once enabled.
     */
    verbose?: boolean;
}
export interface DatabaseTransaction {
    query(query: SQLQuery): Promise<any[]>;
    /**
     * @deprecated use queryStream
     */
    stream(query: SQLQuery): AsyncIterableIterator<any>;
    queryStream(query: SQLQuery): AsyncIterableIterator<any>;
}
export interface DatabaseConnection extends DatabaseTransaction {
    tx<T>(fn: (db: DatabaseTransaction) => Promise<T>): Promise<T>;
    dispose(): Promise<void>;
}
export declare const IN_MEMORY = ":memory:";
export default function connect(filename?: string, options?: DatabaseConnectionOptions): DatabaseConnection;
