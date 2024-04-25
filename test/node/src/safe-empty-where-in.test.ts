import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  createTableWithId,
  DIALECTS,
  NOT_SUPPORTED,
} from './test-setup.js'

import {
  WithSafeArrayWhereInPlugin,
  Generated,
  Kysely,
  DeleteResult,
  UpdateResult,
} from '../../../'

for (const dialect of DIALECTS) {
  describe(`${dialect}: safe empty array where in`, () => {
    let ctx: TestContext
    let db: Kysely<Database>

    interface Person {
      id: Generated<number>
      firstName: string
      nullableColumn: null | string
    }

    interface Database {
      safeEmptyArrayPerson: Person
    }

    beforeEach(async function () {
      ctx = await initTest(this, dialect)

      db = new Kysely<Database>({
        ...ctx.config,
        plugins: [new WithSafeArrayWhereInPlugin()],
      })

      await db.schema.dropTable('safeEmptyArrayPerson').ifExists().execute()
      await createTableWithId(db.schema, dialect, 'safeEmptyArrayPerson')
        .addColumn('firstName', 'varchar(255)')
        .addColumn('nullableColumn', 'varchar(255)')
        .execute()

      await db
        .insertInto('safeEmptyArrayPerson')
        .values([
          {
            firstName: 'John',
            nullableColumn: '1',
          },
          {
            firstName: 'Mary',
            nullableColumn: null,
          },
          {
            firstName: 'Tom',
            nullableColumn: null,
          },
        ])
        .execute()
    })

    it('nullable columns should still return empty as it is a no-op', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .where('nullableColumn', 'in', [])
        .select('safeEmptyArrayPerson.nullableColumn')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."nullableColumn"`,
            `from "safeEmptyArrayPerson"`,
            `where "nullableColumn" in ($1)`,
          ],
          parameters: [null],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`nullableColumn`',
            'from `safeEmptyArrayPerson`',
            'where `nullableColumn` in (?)',
          ],
          parameters: [null],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."nullableColumn"`,
            `from "safeEmptyArrayPerson"`,
            `where "nullableColumn" in (@1)`,
          ],
          parameters: [null],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."nullableColumn"`,
            `from "safeEmptyArrayPerson"`,
            `where "nullableColumn" in (?)`,
          ],
          parameters: [null],
        },
      })

      const result = await query.execute()

      expect(result).to.deep.equal([])
    })

    it('should handle empty array select from statements without throwing runtime errors', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', [])
        .where('firstName', 'not in', [])
        .select('safeEmptyArrayPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1)`,
            `and "firstName" not in ($2)`,
          ],
          parameters: [null, null],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` in (?)',
            'and `firstName` not in (?)',
          ],
          parameters: [null, null],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1)`,
            `and "firstName" not in (@2)`,
          ],
          parameters: [null, null],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (?)`,
            `and "firstName" not in (?)`,
          ],
          parameters: [null, null],
        },
      })

      const result = await query.execute()

      expect(result).to.deep.equal([])
    })

    it('having clause', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .groupBy('safeEmptyArrayPerson.firstName')
        .having('firstName', 'in', [])
        .select('safeEmptyArrayPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `group by "safeEmptyArrayPerson"."firstName"`,
            `having "firstName" in ($1)`,
          ],
          parameters: [null],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'group by `safeEmptyArrayPerson`.`firstName`',
            'having `firstName` in (?)',
          ],
          parameters: [null],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `group by "safeEmptyArrayPerson"."firstName"`,
            `having "firstName" in (@1)`,
          ],
          parameters: [null],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `group by "safeEmptyArrayPerson"."firstName"`,
            `having "firstName" in (?)`,
          ],
          parameters: [null],
        },
      })

      const res = await query.execute()

      expect(res).to.deep.equal([])
    })

    it('non-empty array select from should return expected results', async () => {
      const query = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', ['John', 'Mary'])
        .select('safeEmptyArrayPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      let result = await query.execute()

      expect(result).to.have.length(2)
      expect(result).to.deep.equal([
        { firstName: 'John' },
        { firstName: 'Mary' },
      ])

      const notInQuery = db
        .selectFrom('safeEmptyArrayPerson')
        .where('firstName', 'not in', ['John', 'Mary'])
        .select('safeEmptyArrayPerson.firstName')

      testSql(notInQuery, dialect, {
        postgres: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'select `safeEmptyArrayPerson`.`firstName`',
            'from `safeEmptyArrayPerson`',
            'where `firstName` not in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `select "safeEmptyArrayPerson"."firstName"`,
            `from "safeEmptyArrayPerson"`,
            `where "firstName" not in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      result = await notInQuery.execute()

      expect(result).to.have.length(1)
      expect(result).to.deep.equal([{ firstName: 'Tom' }])
    })

    it('should handle deleteFrom without returning with no runtime errors', async () => {
      const query = db
        .deleteFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', [])
        .where('firstName', 'not in', [])

      testSql(query, dialect, {
        postgres: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1)`,
            `and "firstName" not in ($2)`,
          ],
          parameters: [null, null],
        },
        mysql: {
          sql: [
            'delete from `safeEmptyArrayPerson`',
            'where `firstName` in (?)',
            'and `firstName` not in (?)',
          ],
          parameters: [null, null],
        },
        mssql: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1)`,
            `and "firstName" not in (@2)`,
          ],
          parameters: [null, null],
        },
        sqlite: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in (?)`,
            `and "firstName" not in (?)`,
          ],
          parameters: [null, null],
        },
      })

      const result = await query.execute()

      expect(result).to.deep.equal([new DeleteResult(BigInt(0))])
    })

    it('should handle deleteFrom with returning in supported dialects', async () => {
      if (dialect === 'postgres' || dialect === 'sqlite') {
        const query = db
          .deleteFrom('safeEmptyArrayPerson')
          .where('firstName', 'in', [])
          .returning(['firstName', 'id'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              `delete from "safeEmptyArrayPerson"`,
              `where "firstName" in ($1)`,
              `returning "firstName", "id"`,
            ],
            parameters: [null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: [
              `delete from "safeEmptyArrayPerson"`,
              `where "firstName" in (?)`,
              `returning "firstName", "id"`,
            ],
            parameters: [null],
          },
        })

        const resultWithReturning = await query.execute()

        expect(resultWithReturning).to.deep.equal([])

        const notInWithReturningQuery = db
          .deleteFrom('safeEmptyArrayPerson')
          .where('firstName', 'not in', [])
          .returning(['firstName', 'id'])

        testSql(notInWithReturningQuery, dialect, {
          postgres: {
            sql: [
              `delete from "safeEmptyArrayPerson"`,
              `where "firstName" not in ($1)`,
              `returning "firstName", "id"`,
            ],
            parameters: [null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: [
              `delete from "safeEmptyArrayPerson"`,
              `where "firstName" not in (?)`,
              `returning "firstName", "id"`,
            ],
            parameters: [null],
          },
        })

        const notInResult = await notInWithReturningQuery.execute()

        expect(notInResult).to.deep.equal([])
      }
    })

    it('non-empty array should handle deleteFrom without returning', async () => {
      const query = db
        .deleteFrom('safeEmptyArrayPerson')
        .where('firstName', 'in', ['John', 'Mary'])

      testSql(query, dialect, {
        postgres: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'delete from `safeEmptyArrayPerson`',
            'where `firstName` in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      let result = await query.execute()

      expect(result).to.deep.equal([new DeleteResult(BigInt(2))])

      const notInQuery = db
        .deleteFrom('safeEmptyArrayPerson')
        .where('firstName', 'not in', ['John', 'Mary'])

      testSql(notInQuery, dialect, {
        postgres: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" not in ($1, $2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        mysql: {
          sql: [
            'delete from `safeEmptyArrayPerson`',
            'where `firstName` not in (?, ?)',
          ],
          parameters: ['John', 'Mary'],
        },
        mssql: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" not in (@1, @2)`,
          ],
          parameters: ['John', 'Mary'],
        },
        sqlite: {
          sql: [
            `delete from "safeEmptyArrayPerson"`,
            `where "firstName" not in (?, ?)`,
          ],
          parameters: ['John', 'Mary'],
        },
      })

      result = await notInQuery.execute()

      expect(result).to.deep.equal([new DeleteResult(BigInt(1))])
    })

    it('should handle updateTable without returning with no runtime errors', async () => {
      const empty: string[] = []

      const query = db
        .updateTable('safeEmptyArrayPerson')
        .where('firstName', 'in', empty)
        .where('firstName', 'not in', empty)
        .set('firstName', 'John')

      const result = await query.execute()

      testSql(query, dialect, {
        postgres: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = $1`,
            `where "firstName" in ($2)`,
            `and "firstName" not in ($3)`,
          ],
          parameters: ['John', null, null],
        },
        mysql: {
          sql: [
            'update `safeEmptyArrayPerson`',
            'set `firstName` = ?',
            'where `firstName` in (?)',
            'and `firstName` not in (?)',
          ],
          parameters: ['John', null, null],
        },
        mssql: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            'set "firstName" = @1',
            `where "firstName" in (@2)`,
            `and "firstName" not in (@3)`,
          ],
          parameters: ['John', null, null],
        },
        sqlite: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = ?`,
            `where "firstName" in (?)`,
            `and "firstName" not in (?)`,
          ],
          parameters: ['John', null, null],
        },
      })

      if (dialect === 'mysql') {
        expect(result).to.deep.equal([new UpdateResult(BigInt(0), BigInt(0))])
      } else {
        expect(result).to.deep.equal([new UpdateResult(BigInt(0), undefined)])
      }
    })

    it('should handle updateTable with returning in supported dialects', async () => {
      if (dialect === 'postgres' || dialect === 'sqlite') {
        const query = db
          .updateTable('safeEmptyArrayPerson')
          .where('firstName', 'in', [])
          .set('firstName', 'John')
          .returning(['firstName', 'id'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = $1`,
              `where "firstName" in ($2)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['John', null],
          },
          sqlite: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = ?`,
              `where "firstName" in (?)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['John', null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
        })

        const resultWithReturning = await query.execute()

        expect(resultWithReturning).to.deep.equal([])

        const notInWithReturningQuery = db
          .updateTable('safeEmptyArrayPerson')
          .where('firstName', 'not in', [])
          .set('firstName', 'John')
          .returning(['firstName', 'id'])

        testSql(notInWithReturningQuery, dialect, {
          postgres: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = $1`,
              `where "firstName" not in ($2)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['John', null],
          },
          sqlite: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = ?`,
              `where "firstName" not in (?)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['John', null],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
        })

        const notInResult = await notInWithReturningQuery.execute()

        expect(notInResult).to.deep.equal([])
      }
    })

    it('non-empty array should handle updateTable without returning', async () => {
      const query = db
        .updateTable('safeEmptyArrayPerson')
        .where('firstName', 'in', ['John', 'Mary'])
        .set('firstName', 'Thomas')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = $1`,
            `where "firstName" in ($2, $3)`,
          ],
          parameters: ['Thomas', 'John', 'Mary'],
        },
        mysql: {
          sql: [
            'update `safeEmptyArrayPerson`',
            'set `firstName` = ?',
            'where `firstName` in (?, ?)',
          ],
          parameters: ['Thomas', 'John', 'Mary'],
        },
        mssql: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            'set "firstName" = @1',
            `where "firstName" in (@2, @3)`,
          ],
          parameters: ['Thomas', 'John', 'Mary'],
        },
        sqlite: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = ?`,
            `where "firstName" in (?, ?)`,
          ],
          parameters: ['Thomas', 'John', 'Mary'],
        },
      })

      let result = await query.execute()

      if (dialect === 'mysql') {
        expect(result).to.deep.equal([new UpdateResult(BigInt(2), BigInt(2))])
      } else {
        expect(result).to.deep.equal([new UpdateResult(BigInt(2), undefined)])
      }

      const notInQuery = db
        .updateTable('safeEmptyArrayPerson')
        .where('firstName', 'not in', [
          'UNIQUE_NAME_THAT_DOES_NOT_EXIST',
          'UNIQUE_NAME_2_THAT_DOES_NOT_EXIST',
        ])
        .set('firstName', 'UNIQUE_3')

      testSql(notInQuery, dialect, {
        postgres: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = $1`,
            `where "firstName" not in ($2, $3)`,
          ],
          parameters: [
            'UNIQUE_3',
            'UNIQUE_NAME_THAT_DOES_NOT_EXIST',
            'UNIQUE_NAME_2_THAT_DOES_NOT_EXIST',
          ],
        },
        mysql: {
          sql: [
            'update `safeEmptyArrayPerson`',
            'set `firstName` = ?',
            'where `firstName` not in (?, ?)',
          ],
          parameters: [
            'UNIQUE_3',
            'UNIQUE_NAME_THAT_DOES_NOT_EXIST',
            'UNIQUE_NAME_2_THAT_DOES_NOT_EXIST',
          ],
        },
        mssql: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            'set "firstName" = @1',
            `where "firstName" not in (@2, @3)`,
          ],
          parameters: [
            'UNIQUE_3',
            'UNIQUE_NAME_THAT_DOES_NOT_EXIST',
            'UNIQUE_NAME_2_THAT_DOES_NOT_EXIST',
          ],
        },
        sqlite: {
          sql: [
            `update "safeEmptyArrayPerson"`,
            `set "firstName" = ?`,
            `where "firstName" not in (?, ?)`,
          ],
          parameters: [
            'UNIQUE_3',
            'UNIQUE_NAME_THAT_DOES_NOT_EXIST',
            'UNIQUE_NAME_2_THAT_DOES_NOT_EXIST',
          ],
        },
      })

      result = await notInQuery.execute()

      if (dialect === 'mysql') {
        expect(result).to.deep.equal([new UpdateResult(BigInt(3), BigInt(3))])
      } else {
        expect(result).to.deep.equal([new UpdateResult(BigInt(3), undefined)])
      }
    })

    it('non-empty array should handle updateTable with returning in supported dialects', async () => {
      if (dialect === 'postgres' || dialect === 'sqlite') {
        const query = db
          .updateTable('safeEmptyArrayPerson')
          .where('firstName', 'in', ['John', 'Mary'])
          .set('firstName', 'Thomas')
          .returning(['firstName', 'id'])

        testSql(query, dialect, {
          postgres: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = $1`,
              `where "firstName" in ($2, $3)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['Thomas', 'John', 'Mary'],
          },
          sqlite: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = ?`,
              `where "firstName" in (?, ?)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['Thomas', 'John', 'Mary'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
        })

        let result = await query.execute()

        expect(result).to.deep.equal([
          { id: 1, firstName: 'Thomas' },
          { id: 2, firstName: 'Thomas' },
        ])

        const notInWithReturningQuery = db
          .updateTable('safeEmptyArrayPerson')
          .where('firstName', 'not in', ['John', 'Mary'])
          .set('firstName', 'Thomas')
          .returning(['firstName', 'id'])

        testSql(notInWithReturningQuery, dialect, {
          postgres: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = $1`,
              `where "firstName" not in ($2, $3)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['Thomas', 'John', 'Mary'],
          },
          sqlite: {
            sql: [
              `update "safeEmptyArrayPerson"`,
              `set "firstName" = ?`,
              `where "firstName" not in (?, ?)`,
              `returning "firstName", "id"`,
            ],
            parameters: ['Thomas', 'John', 'Mary'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
        })

        result = await notInWithReturningQuery.execute()

        expect(result.sort((a, b) => a.id - b.id)).to.deep.equal([
          { id: 1, firstName: 'Thomas' },
          { id: 2, firstName: 'Thomas' },
          { id: 3, firstName: 'Thomas' },
        ])
      }
    })

    after(async () => {
      await db.schema.dropTable('safeEmptyArrayPerson').ifExists().execute()
      await db.destroy()
      await destroyTest(ctx)
    })
  })
}
