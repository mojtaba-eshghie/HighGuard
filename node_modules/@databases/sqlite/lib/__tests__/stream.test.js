"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
jest.setTimeout(30000);
const db = (0, __1.default)();
test('streaming', async () => {
    await db.query((0, __1.sql) `CREATE TABLE stream_values (id BIGINT NOT NULL PRIMARY KEY);`);
    const allValues = [];
    for (let batch = 0; batch < 10; batch++) {
        const batchValues = [];
        for (let i = 0; i < 10; i++) {
            const value = batch * 10 + i;
            batchValues.push(value);
            allValues.push(value);
        }
        await db.query((0, __1.sql) `
      INSERT INTO stream_values (id)
      VALUES ${__1.sql.join(batchValues.map((v) => (0, __1.sql) `(${v})`), (0, __1.sql) `,`)};
    `);
    }
    const results = [];
    for await (const row of db.queryStream((0, __1.sql) `SELECT * FROM stream_values`)) {
        results.push(row.id);
    }
    expect(results).toEqual(allValues);
});
//# sourceMappingURL=stream.test.js.map