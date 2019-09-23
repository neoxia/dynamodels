import { Model } from '../src/base-model';
import { CompositeKeyModel, NumericalKeysModel } from './test-models';
import { clearTables } from './hooks/create-tables';
import {
  eq,
  neq,
  _in,
  le,
  lt,
  ge,
  gt,
  between,
  _null,
  notNull,
  notExists,
  exists,
  contains,
  notContains,
  beginsWith,
} from '../src/operators';
import { key } from '../src/key-conditions';
import { attr, not } from '../src/filter-conditions';
import { IPaginationOptions } from '../src/paginate';

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generatePartial = (i: number, numericalKeys?: boolean): any => ({
  rangekey: numericalKeys ? i : `rangekey-${i}`,
  number: i % 2 == 0 ? i : null,
  bool: i % 3 === 0 ? true : i % 3 === 1 ? false : null,
  string: i % 2 == 0 ? `string-${i}` : null,
  stringset: i % 2 == 0 ? [`string-${i}-0`, `string-${i}-1`, `string-${i}-2`] : null,
  list: i % 2 == 0 ? [i, `item-${i}`] : null,
  stringmap:
    i % 2 == 0
      ? {
          [`key-${i}`]: `value-${i}`,
        }
      : null,
  optional_number: i % 2 == 0 ? i : undefined,
  optional_bool: i % 2 === 0 ? true : undefined,
  optional_string: i % 2 == 0 ? `string-${i}` : undefined,
  optional_stringset: i % 2 == 0 ? [`string-${i}-0`, `string-${i}-1`, `string-${i}-2`] : undefined,
  optional_list: i % 2 == 0 ? [i, `item-${i}`] : undefined,
  optional_stringmap:
    i % 2 == 0
      ? {
          [`key-${i}`]: `value-${i}`,
        }
      : undefined,
});

const save = async (model: Model<any>, hk: number, i: number, numericalKeys?: boolean) => {
  const entity = {
    hashkey: numericalKeys ? hk : `hashkey-${hk}`,
    ...generatePartial(i, numericalKeys),
  };
  try {
    model.save(entity);
  } catch (e) {
    console.error(JSON.stringify(entity));
    console.error(e);
    throw Error(`Could not save entity ${JSON.stringify(entity)}. Reason ${e.message}`);
  }
};

const generateData = async (model: Model<any>, nbEntries: number, numericalKeys?: boolean): Promise<void> => {
  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < Math.floor(nbEntries / 2); ++i) {
    promises.push(save(model, 1, i, numericalKeys));
  }
  for (let i = Math.floor(nbEntries / 2); i < nbEntries; ++i) {
    promises.push(save(model, 2, i, numericalKeys));
  }
  await Promise.all(promises);
};

describe('The query method', () => {
  test.todo('should return all items in the table in 1MB limit when exec called');
  test.todo('should return all items in the table beyond 1MB limit when execAll called');
  test.todo('should use the provided index');
});

describe('The query method [index]', () => {
  const model = new CompositeKeyModel();
  const num = new NumericalKeysModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await generateData(num, nbEntries, true);
    await timeout(500);
  });
  test('should use the provided index in query() [string keys]', async () => {
    const result = await model
      .query('GS1')
      .keys({
        rangekey: 'rangekey-18',
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.rangekey === 'rangekey-18')).toBe(true);
  });
  test('should use the provided index in query() [number keys]', async () => {
    const result = await num
      .query('GS1')
      .keys({
        rangekey: 33,
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.rangekey === 33)).toBe(true);
  });
  test('should use the provided index in index() [string keys]', async () => {
    const result = await model
      .query()
      .index('GS1')
      .keys({
        rangekey: 'rangekey-18',
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.rangekey === 'rangekey-18')).toBe(true);
  });
  test('should use the provided index in index() [number keys]', async () => {
    const result = await num
      .query()
      .index('GS1')
      .keys({
        rangekey: 33,
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.rangekey === 33)).toBe(true);
  });
  test('should override query() defined index [string keys]', async () => {
    const result = await model
      .query('GS1')
      .index('GS2')
      .keys({
        hashkey: 'hashkey-1',
        optional_string: 'string-18',
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.hashkey === 'hashkey-1' && i.optional_string === 'string-18')).toBe(true);
  });
  test('should override query() defined index [number keys]', async () => {
    const result = await num
      .query('GS1')
      .index('GS2')
      .keys({
        hashkey: 2,
        optional_number: 34,
      })
      .exec();
    expect(result.count).toBe(1);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(1);
    expect(result.items.every((i) => i.hashkey === 2 && i.optional_number === 34)).toBe(true);
  });
});

describe('The query method [key conditions / object synthax]', () => {
  const model = new CompositeKeyModel();
  const num = new NumericalKeysModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await generateData(num, nbEntries, true);
    await timeout(500);
  });
  describe('Hash key', () => {
    describe('EQ', () => {
      test('should return items where EQ condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: 'hashkey-1',
          })
          .exec();
        expect(result.count).toBe(20);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(20);
        expect(result.items.every((i) => i.hashkey === 'hashkey-1')).toBe(true);
        expect(result.items.some((i) => i.hashkey !== 'hashkey-1')).toBe(false);
      });
      test('should return items where EQ condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: 2,
          })
          .exec();
        expect(result.count).toBe(20);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(20);
        expect(result.items.every((i) => i.hashkey === 2)).toBe(true);
        expect(result.items.some((i) => i.hashkey !== 2)).toBe(false);
      });
    });
  });
  describe('Composite key', () => {
    describe('EQ', () => {
      test('should return items where EQ condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: 'hashkey-1',
            rangekey: 'rangekey-1',
          })
          .exec();
        expect(result.count).toBe(1);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(1);
        expect(result.items[0].hashkey).toBe('hashkey-1');
        expect(result.items[0].rangekey).toBe('rangekey-1');
      });
      test('should return items where EQ condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: 2,
            rangekey: eq(21),
          })
          .exec();
        expect(result.count).toBe(1);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(1);
        expect(result.items[0].hashkey).toBe(2);
        expect(result.items[0].rangekey).toBe(21);
      });
    });
    describe('LE', () => {
      test('should return items where LE condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: le('rangekey-14'),
          })
          .exec();
        expect(result.count).toBe(7);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(7);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-14') <= 0)).toBe(true);
      });
      test('should return items where LE condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: eq(1),
            rangekey: le(14),
          })
          .exec();
        expect(result.count).toBe(15);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(15);
        expect(result.items.every((i) => i.rangekey <= 14)).toBe(true);
      });
    });
    describe('LT', () => {
      test('should return items where LT condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: lt('rangekey-14'),
          })
          .exec();
        expect(result.count).toBe(6);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(6);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-14') < 0)).toBe(true);
      });
      test('should return items where LT condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: eq(1),
            rangekey: lt(14),
          })
          .exec();
        expect(result.count).toBe(14);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(14);
        expect(result.items.every((i) => i.rangekey < 14)).toBe(true);
      });
    });
    describe('GE', () => {
      test('should return items where GE condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: ge('rangekey-14'),
          })
          .exec();
        expect(result.count).toBe(14);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(14);
        expect(result.items.every((i) => i.rangekey.localeCompare('rangekey-14') >= 0)).toBe(true);
      });
      test('should return items where GE condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: eq(1),
            rangekey: ge(14),
          })
          .exec();

        expect(result.count).toBe(6);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(6);
        expect(result.items.every((i) => i.rangekey >= 14)).toBe(true);
      });
    });
    describe('GT', () => {
      test('should return items where GT condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: gt('rangekey-11'),
          })
          .exec();
        expect(result.count).toBe(16);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(16);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-11') < 0)).toBe(true);
      });
      test('should return items where GT condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: eq(1),
            rangekey: gt(11),
          })
          .exec();
        expect(result.count).toBe(8);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(8);
        expect(result.items.every((i) => i.rangekey > 11)).toBe(true);
      });
    });
    describe('BETWEEN', () => {
      test('should return items where BETWEEN condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: between('rangekey-14', 'rangekey-7'),
          })
          .exec();
        expect(result.count).toBe(12);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(12);
        expect(
          result.items.every(
            (i) => i.rangekey.localeCompare('rangekey-14') >= 0 && i.rangekey.localeCompare('rangekey-7') <= 0,
          ),
        ).toBe(true);
      });
      test('should return items where BETWEEN condition is true [number]', async () => {
        const result = await num
          .query()
          .keys({
            hashkey: eq(1),
            rangekey: between(7, 14),
          })
          .exec();
        expect(result.count).toBe(8);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(8);
        expect(result.items.every((i) => i.rangekey <= 14 && i.rangekey >= 7)).toBe(true);
      });
    });
    describe('BEGINS_WITH', () => {
      test('should return items where BEGINS_WITH condition is true [string]', async () => {
        const result = await model
          .query()
          .keys({
            hashkey: eq('hashkey-1'),
            rangekey: beginsWith('rangekey-1'),
          })
          .exec();
        expect(result.count).toBe(11);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(11);
        expect(result.items.every((i) => i.rangekey.match(/^rangekey-1/))).toBe(true);
      });
    });
  });
});

describe('The query method [key conditions / fluid synthax]', () => {
  const model = new CompositeKeyModel();
  const num = new NumericalKeysModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await generateData(num, nbEntries, true);
    await timeout(500);
  });
  describe('Hash key', () => {
    describe('EQ', () => {
      test('should return items where EQ condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(key('hashkey').eq('hashkey-1'))
          .exec();
        expect(result.count).toBe(20);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(20);
        expect(result.items.every((i) => i.hashkey === 'hashkey-1')).toBe(true);
        expect(result.items.some((i) => i.hashkey !== 'hashkey-1')).toBe(false);
      });
      test('should return items where EQ condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(key('hashkey').eq(2))
          .exec();
        expect(result.count).toBe(20);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(20);
        expect(result.items.every((i) => i.hashkey === 2)).toBe(true);
        expect(result.items.some((i) => i.hashkey !== 2)).toBe(false);
      });
    });
  });
  describe('Composite key', () => {
    describe('EQ', () => {
      test('should return items where EQ condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').eq('rangekey-1')),
          )
          .exec();
        expect(result.count).toBe(1);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(1);
        expect(result.items[0].hashkey).toBe('hashkey-1');
        expect(result.items[0].rangekey).toBe('rangekey-1');
      });
      test('should return items where EQ condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(2)
              .and(key('rangekey').eq(21)),
          )
          .exec();
        expect(result.count).toBe(1);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(1);
        expect(result.items[0].hashkey).toBe(2);
        expect(result.items[0].rangekey).toBe(21);
      });
    });
    describe('LE', () => {
      test('should return items where LE condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').le('rangekey-14')),
          )
          .exec();
        expect(result.count).toBe(7);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(7);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-14') <= 0)).toBe(true);
      });
      test('should return items where LE condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(1)
              .and(key('rangekey').le(14)),
          )
          .exec();
        expect(result.count).toBe(15);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(15);
        expect(result.items.every((i) => i.rangekey <= 14)).toBe(true);
      });
    });
    describe('LT', () => {
      test('should return items where LT condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').lt('rangekey-14')),
          )
          .exec();
        expect(result.count).toBe(6);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(6);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-14') < 0)).toBe(true);
      });
      test('should return items where LT condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(1)
              .and(key('rangekey').lt(14)),
          )
          .exec();
        expect(result.count).toBe(14);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(14);
        expect(result.items.every((i) => i.rangekey < 14)).toBe(true);
      });
    });
    describe('GE', () => {
      test('should return items where GE condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').ge('rangekey-14')),
          )
          .exec();
        expect(result.count).toBe(14);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(14);
        expect(result.items.every((i) => i.rangekey.localeCompare('rangekey-14') >= 0)).toBe(true);
      });
      test('should return items where GE condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(1)
              .and(key('rangekey').ge(14)),
          )
          .exec();
        expect(result.count).toBe(6);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(6);
        expect(result.items.every((i) => i.rangekey >= 14)).toBe(true);
      });
    });
    describe('GT', () => {
      test('should return items where GT condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').gt('rangekey-11')),
          )
          .exec();
        expect(result.count).toBe(16);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(16);
        expect(result.items.every((i) => i.hashkey.localeCompare('rangekey-11') < 0)).toBe(true);
      });
      test('should return items where GT condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(1)
              .and(key('rangekey').ge(11)),
          )
          .exec();
        expect(result.count).toBe(9);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(9);
        expect(result.items.every((i) => i.rangekey >= 11)).toBe(true);
      });
    });
    describe('BETWEEN', () => {
      test('should return items where BETWEEN condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').between('rangekey-14', 'rangekey-4')),
          )
          .exec();
        expect(result.count).toBe(9);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(9);
        expect(
          result.items.every(
            (i) => i.rangekey.localeCompare('rangekey-14') >= 0 && i.rangekey.localeCompare('rangekey-4') <= 0,
          ),
        ).toBe(true);
      });
      test('should return items where BETWEEN condition is true [number]', async () => {
        const result = await num
          .query()
          .keys(
            key('hashkey')
              .eq(1)
              .and(key('rangekey').between(7, 14)),
          )
          .exec();
        expect(result.count).toBe(8);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(8);
        expect(result.items.every((i) => i.rangekey <= 14 && i.rangekey >= 7)).toBe(true);
      });
    });
    describe('BEGINS_WITH', () => {
      test('should return items where BEGINS_WITH condition is true [string]', async () => {
        const result = await model
          .query()
          .keys(
            key('hashkey')
              .eq('hashkey-1')
              .and(key('rangekey').beginsWith('rangekey-1')),
          )
          .exec();
        expect(result.count).toBe(11);
        expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
        expect(result.items.length).toBe(11);
        expect(result.items.every((i) => i.rangekey.match(/^rangekey-1/))).toBe(true);
      });
    });
  });
});

/** Already tested in scan and paginate method have 100% coverage */
describe('The query method [pagination]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 394;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await timeout(500);
  });
  let nextPage: IPaginationOptions;
  test('should return the first page of items with the correct size', async () => {
    const page1 = await model
      .query()
      .keys({ hashkey: 'hashkey-1' })
      .paginate({ size: 50 })
      .exec();
    nextPage = page1.nextPage;
    //expect(page1.count).toBe(nbEntries);
    expect(page1.items.length).toBe(50);
    expect(page1.nextPage.lastEvaluatedKey).toBeTruthy();
    expect(page1.nextPage.size).toBe(50);
  });
  test('should return the next page of items with the correct size', async () => {
    const page2 = await model
      .query()
      .keys({ hashkey: 'hashkey-1' })
      .paginate(nextPage)
      .exec();
    nextPage = page2.nextPage;
    // expect(page2.count).toBe(nbEntries);
    expect(page2.items.length).toBe(50);
    expect(page2.nextPage.lastEvaluatedKey).toBeTruthy();
    expect(page2.nextPage.size).toBe(50);
  });
  test('should return a null last evaluated key when last page is fetched', async () => {
    const page3 = await model
      .query()
      .keys({ hashkey: 'hashkey-1' })
      .paginate(nextPage)
      .exec();
    nextPage = page3.nextPage;
    const page4 = await model
      .query()
      .keys({ hashkey: 'hashkey-1' })
      .paginate(nextPage)
      .exec();
    // expect(page4.count).toBe(nbEntries);
    expect(page4.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(page4.items.length).toBe(0.5 * 394 - 3 * 50);
    expect(page4.nextPage.size).toBe(50);
  });
});

describe('The query method [filtering / object synthax]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await timeout(500);
  });
  describe('EQ', () => {
    test('should return items where EQ condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: eq('string-2'),
        })
        .exec();

      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-2');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: 6,
        })
        .exec();
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-6');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          bool: eq(true),
        })
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.bool)).toBe(true);
    });
  });
  describe('NE', () => {
    test('should return items where NEQ condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: neq('string-2'),
        })
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-2')).toBe(false);
    });
    test('should return items where NEQ condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: neq(8),
        })
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-8')).toBe(false);
    });
    test('should return items where NEQ condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          bool: neq(true),
        })
        .exec();
      expect(result.count).toBe(13);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(13);
      expect(result.items.every((i) => !i.bool)).toBe(true);
    });
  });
  describe('IN', () => {
    test('should return items where IN condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: _in('string-2', 'string-12', 'string-14', 'string-0'),
        })
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.map((i) => i.string).sort()).toEqual(
        ['string-2', 'string-12', 'string-14', 'string-0'].sort(),
      );
    });
    test('should return items where IN condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: _in(2, 12, 14, 0),
        })
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.map((i) => i.string).sort()).toEqual(
        ['string-2', 'string-12', 'string-14', 'string-0'].sort(),
      );
    });
    test('should return items where IN condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          bool: _in(true, false),
        })
        .exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
  });
  describe('LE', () => {
    test('should return items where LE condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: le('string-12'),
        })
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.string.localeCompare('string-12') <= 0)).toBe(true);
    });
    test('should return items where LE condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: le(12),
        })
        .exec();

      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.number <= 12)).toBe(true);
    });
  });
  describe('LT', () => {
    test('should return items where LT condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: lt('string-12'),
        })
        .exec();

      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(result.items.every((i) => i.string.localeCompare('string-12') < 0)).toBe(true);
    });
    test('should return items where LT condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: lt(12),
        })
        .exec();

      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.number < 12)).toBe(true);
    });
  });
  describe('GE', () => {
    test('should return items where GE condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: ge('string-12'),
        })
        .exec();

      expect(result.count).toBe(8);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(8);
      expect(result.items.every((i) => i.string.localeCompare('string-12') >= 0)).toBe(true);
    });
    test('should return items where GE condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: ge(12),
        })
        .exec();

      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.every((i) => i.number >= 12)).toBe(true);
    });
  });
  describe('GT', () => {
    test('should return items where GT condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: gt('string-12'),
        })
        .exec();

      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.string.localeCompare('string-12') > 0)).toBe(true);
    });
    test('should return items where GT condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: gt(12),
        })
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.number >= 12)).toBe(true);
    });
  });
  describe('BETWEEN', () => {
    test('should return items where BETWEEN condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: between('string-3', 'string-8'),
        })
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(
        result.items.every((i) => i.string.localeCompare('string-3') >= 0 && i.string.localeCompare('string-8') <= 0),
      ).toBe(true);
    });
    test('should return items where BETWEEN condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: between(6, 17),
        })
        .exec();

      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.number >= 6 && i.number <= 17)).toBe(true);
    });
  });
  describe('NOT_EXISTS', () => {
    test('should return items where NOT_EXISTS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_string: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_number: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_bool: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_list: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_stringset: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_stringmap: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringmap == null)).toBe(true);
    });
  });
  describe('EXISTS', () => {
    test('should return items where EXISTS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_string: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_number: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_bool: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_list: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_stringset: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          optional_stringmap: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringmap !== undefined)).toBe(true);
    });
  });
  describe('NOT_NULL', () => {
    test('should return items where NOT_NULL condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: notNull(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: notNull(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          bool: notNull(),
        })
        .exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          list: notNull(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          stringset: notNull(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          stringmap: notNull(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap != null)).toBe(true);
    });
  });
  describe('NULL', () => {
    test('should return items where NULL condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: _null(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string == null)).toBe(true);
    });
    test('should return items where NULL condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          number: _null(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number == null)).toBe(true);
    });
    test('should return items where NULL condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          bool: _null(),
        })
        .exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.bool == null)).toBe(true);
    });
    test('should return items where NULL condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          list: _null(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          stringset: _null(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          stringmap: _null(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap == null)).toBe(true);
    });
  });
  describe('CONTAINS', () => {
    test('should return items where CONTAINS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: contains('ing-1'),
        })
        .exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string.includes('ing-1'))).toBe(true);
    });
  });
  describe('NOT_CONTAINS', () => {
    test('should return items where NOT_CONTAINS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: notContains('ing-1'),
        })
        .exec();
      expect(result.count).toBe(15);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(15);
      expect(result.items.every((i) => !(i.string && i.string.includes('ing-1')))).toBe(true);
    });
  });
  describe('BEGINS_WITH', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter({
          string: beginsWith('string-1'),
        })
        .exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string.match(/^string-1/))).toBe(true);
    });
  });
  test('should combine multiple conditions with AND logical operator', async () => {
    const result = await model
      .query()
      .keys(key('hashkey').eq('hashkey-1'))
      .filter({
        bool: eq(true),
        number: ge(12),
        string: beginsWith('string-1'),
      })
      .exec();
    expect(result.count).toBe(2);
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(result.items.length).toBe(2);
    expect(result.items.every((i) => i.string.match(/^string-1/) && i.bool === true && i.number >= 12)).toBe(true);
  });
});

describe('The query method [filtering / fluid synthax]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await timeout(500);
  });
  describe('EQ', () => {
    test('should return items where EQ condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').eq('string-2'))
        .exec();

      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-2');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').eq(6))
        .exec();
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-6');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('bool').eq(true))
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.bool)).toBe(true);
    });
  });
  describe('NE', () => {
    test('should return items where NEQ condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').neq('string-2'))
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-2')).toBe(false);
    });
    test('should return items where NEQ condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').neq(8))
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-8')).toBe(false);
    });
    test('should return items where NEQ condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('bool').neq(true))
        .exec();
      expect(result.count).toBe(13);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(13);
      expect(result.items.every((i) => !i.bool)).toBe(true);
    });
  });
  describe('IN', () => {
    test('should return items where IN condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').in('string-2', 'string-12', 'string-14', 'string-0'))
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.map((i) => i.string).sort()).toEqual(
        ['string-2', 'string-12', 'string-14', 'string-0'].sort(),
      );
    });
    test('should return items where IN condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').in(2, 12, 14, 0))
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.map((i) => i.string).sort()).toEqual(
        ['string-2', 'string-12', 'string-14', 'string-0'].sort(),
      );
    });
    test('should return items where IN condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('bool').in(false, true))
        .exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
  });
  describe('LE', () => {
    test('should return items where LE condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').le('string-12'))
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.string.localeCompare('string-12') <= 0)).toBe(true);
    });
    test('should return items where LE condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').le(12))
        .exec();

      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.number <= 12)).toBe(true);
    });
  });
  describe('LT', () => {
    test('should return items where LT condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').lt('string-12'))
        .exec();

      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(result.items.every((i) => i.string.localeCompare('string-12') < 0)).toBe(true);
    });
    test('should return items where LT condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').lt(12))
        .exec();

      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.number < 12)).toBe(true);
    });
  });
  describe('GE', () => {
    test('should return items where GE condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').ge('string-12'))
        .exec();
      expect(result.count).toBe(8);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(8);
      expect(result.items.every((i) => i.string.localeCompare('string-12') >= 0)).toBe(true);
    });
    test('should return items where GE condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').ge(12))
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.every((i) => i.number >= 12)).toBe(true);
    });
  });
  describe('GT', () => {
    test('should return items where GT condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').gt('string-12'))
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.string.localeCompare('string-12') > 0)).toBe(true);
    });
    test('should return items where GT condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').gt(12))
        .exec();
      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.number >= 12)).toBe(true);
    });
  });
  describe('BETWEEN', () => {
    test('should return items where BETWEEN condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').between('string-3', 'string-8'))
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(
        result.items.every((i) => i.string.localeCompare('string-3') >= 0 && i.string.localeCompare('string-8') <= 0),
      ).toBe(true);
    });
    test('should return items where BETWEEN condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').between(6, 17))

        .exec();

      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.number >= 6 && i.number <= 17)).toBe(true);
    });
  });
  describe('NOT_EXISTS', () => {
    test('should return items where NOT_EXISTS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_string').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_number').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_bool').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_list').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_stringset').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_stringmap').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringmap == null)).toBe(true);
    });
  });
  describe('EXISTS', () => {
    test('should return items where EXISTS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_string').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_number').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_bool').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_list').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_stringset').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('optional_stringmap').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringmap !== undefined)).toBe(true);
    });
  });
  describe('NOT_NULL', () => {
    test('should return items where NOT_NULL condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('bool').notNull())
        .exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('list').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('stringset').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('stringmap').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap != null)).toBe(true);
    });
  });
  describe('NULL', () => {
    test('should return items where NULL condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string == null)).toBe(true);
    });
    test('should return items where NULL condition is true [number]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('number').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number == null)).toBe(true);
    });
    test('should return items where NULL condition is true [boolean]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('bool').null())
        .exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.bool == null)).toBe(true);
    });
    test('should return items where NULL condition is true [list]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('list').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringset]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('stringset').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringmap]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('stringmap').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap == null)).toBe(true);
    });
  });
  describe('CONTAINS', () => {
    test('should return items where CONTAINS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').contains('ing-1'))
        .exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string.includes('ing-1'))).toBe(true);
    });
  });
  describe('NOT_CONTAINS', () => {
    test('should return items where NOT_CONTAINS condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').notContains('ing-1'))
        .exec();
      expect(result.count).toBe(15);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(15);
      expect(result.items.every((i) => !(i.string && i.string.includes('ing-1')))).toBe(true);
    });
  });
  describe('BEGINS_WITH', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(attr('string').beginsWith('string-1'))
        .exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string.match(/^string-1/))).toBe(true);
    });
  });
  describe('OR', () => {
    test('should return items where condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        // BW: 10, 12, 14, 16, 18
        // CN: 4
        .filter(
          attr('string')
            .beginsWith('string-1')
            .or(attr('string').contains('ing-4')),
        )
        .exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.string.match(/^string-1/) || i.string.includes('ing-4'))).toBe(true);
    });
  });
  describe('AND', () => {
    test('should return items where condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(
          attr('bool')
            .eq(true)
            .and(attr('number').ge(12))
            .and(attr('string').beginsWith('string-1')),
        )
        .exec();
      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(result.items.every((i) => i.string.match(/^string-1/) && i.bool === true && i.number >= 12)).toBe(true);
    });
  });
  describe('OR/AND no-parenthesis', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(
          // bool = true AND number < 8 OR begins_with(string, string-1)
          attr('bool')
            .eq(true)
            .and(attr('number').lt(8))
            .or(attr('string').beginsWith('string-1')),
        )
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => (i.bool === true && i.number < 8) || i.string.match(/^string-1/))).toBe(true);
    });
  });
  describe('OR/AND parenthesis', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(
          // COND1 : 0, 3, 6, 9, 12, 15, 18
          // COND2: 0, 2, 6, 10, 12, 14, 16, 18
          // bool = true AND (number < 8 OR begins_with(string, string-1))
          attr('bool')
            .eq(true)
            .and(
              attr('number')
                .lt(8)
                .or(attr('string').beginsWith('string-1')),
            ),
        )
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.every((i) => i.bool === true && (i.number < 8 || i.string.match(/^string-1/)))).toBe(true);
    });
  });
  describe('NOT', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        .filter(not(attr('string').beginsWith('string-1')))
        .exec();
      expect(result.count).toBe(15);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(15);
      expect(result.items.every((i) => !i.string || !i.string.match(/^string-1/))).toBe(true);
    });
  });
  describe('NOT/OR', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .query()
        .keys(key('hashkey').eq('hashkey-1'))
        // COND1: 10, 12, 14, 16, 18
        // COND2: 1, 4, 7, 10, 13, 16, 19
        // OR : 1, 4, 7, 10, 12, 13, 16, 18, 19
        // NOT: 0, 2, 3, 5, 6, 8, 9, 11, 14, 15, 17
        .filter(
          not(
            attr('string')
              .beginsWith('string-1')
              .or(attr('bool').eq(false)),
          ),
        )
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => !(i.bool === false || (i.string && i.string.match(/^string-1/))))).toBe(true);
    });
  });
});

describe('The query method [sorting]', () => {
  const model = new CompositeKeyModel();
  const num = new NumericalKeysModel();
  const nbEntries = 40;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
    await generateData(num, nbEntries, true);
    await timeout(500);
  });
  test('should return all items sorted in ascending order if nothing is specified [string keys]', async () => {
    const result = await model
      .query()
      .keys({ hashkey: 'hashkey-2' })
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i1.rangekey.localeCompare(i2.rangekey)));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
  test('should return all items sorted in ascending order if "asc" is specified [string keys]', async () => {
    const result = await model
      .query()
      .keys({ hashkey: 'hashkey-2' })
      .sort('asc')
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i1.rangekey.localeCompare(i2.rangekey)));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
  test('should return all items sorted in descending order if "desc" is specified [string keys]', async () => {
    const result = await model
      .query()
      .keys({ hashkey: 'hashkey-2' })
      .sort('desc')
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i2.rangekey.localeCompare(i1.rangekey)));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
  test('should return all items sorted in ascending order if nothing is specified [number keys]', async () => {
    const result = await num
      .query()
      .keys({ hashkey: 1 })
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i2.rangekey - i1.rangekey));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
  test('should return all items sorted in ascending order if "asc" is specified [number keys]', async () => {
    const result = await num
      .query()
      .keys({ hashkey: 1 })
      .sort('asc')
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i2.rangekey - i1.rangekey));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
  test('should return all items sorted in descending order if "desc" is specified [number keys]', async () => {
    const result = await num
      .query()
      .keys({ hashkey: 1 })
      .sort('desc')
      .exec();
    expect(result.count).toBe(20);
    expect(result.items).toEqual(result.items.sort((i1, i2) => i1.rangekey - i2.rangekey));
    expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
  });
});

describe('The query method [projection]', () => {
  test.todo('should project on sclar type [string]');
  test.todo('should project on sclar type [number]');
  test.todo('should project on sclar type [boolean]');
  test.todo('should project on list');
  test.todo('should project on list element');
  test.todo('should project on set');
  test.todo('should project on set element');
  test.todo('should project on map');
  test.todo('should project on map element');
  test.todo('should combine projections');
});

describe('The query method [consistent-read]', () => {
  test.todo('should perform a consistent read if null');
  test.todo('should perform a consistent read if true');
  test.todo('should not perform a consistent read if false');
});

describe('The suery method [combinations]', () => {
  test.todo('should combine keys and paginate');
  test.todo('should combine paginate and filter');
  test.todo('should combine projection and keys');
  test.todo('should combine filter and paginate');
  test.todo('should combine keys, projection, filter and paginate');
});
