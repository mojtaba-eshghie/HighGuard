"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
jest.setTimeout(30000);
const db = (0, __1.default)();
afterAll(async () => {
    await db.dispose();
});
test('error messages', async () => {
    const s = __1.sql;
    await expect(db.query(s `
    SELECT * FRM 'baz;
  `)).rejects.toMatchInlineSnapshot(`[Error: SQLITE_ERROR: near "FRM": syntax error]`);
});
test('query', async () => {
    const [{ foo }] = await db.query((0, __1.sql) `SELECT 1 + 1 as foo`);
    expect(foo).toBe(2);
});
test('query with params', async () => {
    const [{ foo }] = await db.query((0, __1.sql) `SELECT 1 + ${41} as ${__1.sql.ident('foo')}`);
    expect(foo).toBe(42);
});
test('bigint', async () => {
    await db.query((0, __1.sql) `CREATE TABLE bigint_test_bigints (id BIGINT NOT NULL PRIMARY KEY);`);
    await db.query((0, __1.sql) `
    INSERT INTO bigint_test_bigints (id)
    VALUES (1),
           (2),
           (42);
  `);
    const result = await db.query((0, __1.sql) `SELECT id from bigint_test_bigints;`);
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 42 }]);
});
test('transaction', async () => {
    const result = await db.tx(async (tx) => {
        const a = await tx.query((0, __1.sql) `SELECT 1 + ${41} as ${__1.sql.ident('foo')}`);
        const b = await tx.query((0, __1.sql) `SELECT 1 + 2 as bar;`);
        return { a, b };
    });
    expect(result).toMatchInlineSnapshot(`
Object {
  "a": Array [
    Object {
      "foo": 42,
    },
  ],
  "b": Array [
    Object {
      "bar": 3,
    },
  ],
}
`);
});
test('transaction with rollback', async () => {
    await db.query((0, __1.sql) `CREATE TABLE test_rollback (id INTEGER NOT NULL PRIMARY KEY);`);
    try {
        await db.tx(async (tx) => {
            await tx.query((0, __1.sql) `
        INSERT INTO test_rollback (id)
          VALUES (1), (2), (42);
      `);
            const result = await tx.query((0, __1.sql) `SELECT id from test_rollback;`);
            expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 42 }]);
            throw new Error('rollback');
        });
    }
    catch (e) {
        expect(e.message).toBe('rollback');
    }
    const result = await db.query((0, __1.sql) `SELECT id from test_rollback;`);
    expect(result).toEqual([]);
});
//# sourceMappingURL=index.test.js.map