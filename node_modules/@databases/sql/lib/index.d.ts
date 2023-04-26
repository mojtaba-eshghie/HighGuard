import { SQL as SQLBase, SQLQuery, SQLItem, SQLItemType, FormatConfig, isSqlQuery } from './web';
export type { SQLQuery, SQLItem, FormatConfig };
export { isSqlQuery, SQLItemType };
export interface SQL extends SQLBase {
    file(filename: string): SQLQuery;
}
declare const sql: SQL;
export default sql;
