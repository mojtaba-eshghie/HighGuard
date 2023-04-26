"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
test('correctly renders sql', () => {
    const query = (0, __1.default) `
      SELECT *
      FROM foo
      WHERE id = ${10}
      AND created_at > ${new Date(1545238400939)};
  `;
    expect(query.format({
        escapeIdentifier: () => {
            throw new Error('not implemented');
        },
        formatValue: (value) => ({ placeholder: '?', value }),
    })).toMatchInlineSnapshot(`
    Object {
      "text": "SELECT *
    FROM foo
    WHERE id = ?
    AND created_at > ?;",
      "values": Array [
        10,
        2018-12-19T16:53:20.939Z,
      ],
    }
  `);
});
test('can join parts of query', () => {
    const conditions = [
        (0, __1.default) `id = ${10}`,
        (0, __1.default) `created_at > ${new Date(1545238400939)}`,
    ];
    const query = (0, __1.default) `
      SELECT *
      FROM foo
      WHERE ${__1.default.join(conditions, (0, __1.default) ` AND `)};
  `;
    expect(query.format({
        escapeIdentifier: () => {
            throw new Error('not implemented');
        },
        formatValue: (value) => ({ placeholder: '?', value }),
    })).toMatchInlineSnapshot(`
    Object {
      "text": "SELECT *
    FROM foo
    WHERE id = ? AND created_at > ?;",
      "values": Array [
        10,
        2018-12-19T16:53:20.939Z,
      ],
    }
  `);
});
test('can read in a file', () => {
    const query = __1.default.file(`${__dirname}/fixture.sql`);
    expect(query.format({
        escapeIdentifier: () => {
            throw new Error('not implemented');
        },
        formatValue: (value) => ({ placeholder: '?', value }),
    })).toMatchInlineSnapshot(`
    Object {
      "text": "SELECT * FROM my_table;",
      "values": Array [],
    }
  `);
});
//# sourceMappingURL=index.test.js.map