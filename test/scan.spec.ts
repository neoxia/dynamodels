import { CompositeKeyModel } from './test-models';
import { clearTables } from './hooks/create-tables';
import { IPaginationOptions } from '../src/paginate';
import { Model } from '../src/base-model';
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
import { attr, not } from '../src/filter-conditions';

const generateData = async (model: Model<any>, nbEntries: number): Promise<any[]> => {
  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < nbEntries; ++i) {
    promises.push(
      model.save({
        hashkey: `hashkey-${i}`,
        rangekey: `rangekey-${i}`,
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
      }),
    );
  }
  await Promise.all(promises).catch((e) => console.error(e));
  const check = await model.scan().execAll();
  return check;
};

describe.skip('The scan method', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 10;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  test('should return all items in the table in 1MB limit is exec called', async () => {
    const result = await model.scan().exec();
    // expect(result.count).toBe(nbEntries);
    expect(result.items.length).toBeLessThan(nbEntries);
    expect(result.nextPage.lastEvaluatedKey).not.toBeNull();
  });
  test('should return all items in the table is execAll called', async () => {
    const result = await model.scan().execAll();
    expect(result.length).toBe(nbEntries);
  });
});

describe('The scan method [pagination]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 187;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  let nextPage: IPaginationOptions;
  test('should return the first page of items with the correct size', async () => {
    const page1 = await model
      .scan()
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
      .scan()
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
      .scan()
      .paginate(nextPage)
      .exec();
    nextPage = page3.nextPage;
    const page4 = await model
      .scan()
      .paginate(nextPage)
      .exec();
    // expect(page4.count).toBe(nbEntries);
    expect(page4.items.length).toBe(187 - 3 * 50);
    expect(page4.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(page4.nextPage.size).toBe(50);
  });
});

describe('The scan method [filtering / object synthax]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 20;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  describe('EQ', () => {
    test('should return items where EQ condition is true [string]', async () => {
      const result = await model
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
      .scan()
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

describe('The scan method [filtering / fluid synthax]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 20;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  describe('EQ', () => {
    test('should return items where EQ condition is true [string]', async () => {
      const result = await model
        .scan()
        .filter(attr('string').eq('string-2'))
        .exec();

      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-2');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('number').eq(6))
        .exec();
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-6');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').neq('string-2'))
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-2')).toBe(false);
    });
    test('should return items where NEQ condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('number').neq(8))
        .exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string === 'string-8')).toBe(false);
    });
    test('should return items where NEQ condition is true [boolean]', async () => {
      const result = await model
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
        .filter(attr('string').le('string-12'))
        .exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.string.localeCompare('string-12') <= 0)).toBe(true);
    });
    test('should return items where LE condition is true [number]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').lt('string-12'))
        .exec();

      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(result.items.every((i) => i.string.localeCompare('string-12') < 0)).toBe(true);
    });
    test('should return items where LT condition is true [number]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').ge('string-12'))
        .exec();
      expect(result.count).toBe(8);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(8);
      expect(result.items.every((i) => i.string.localeCompare('string-12') >= 0)).toBe(true);
    });
    test('should return items where GE condition is true [number]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').gt('string-12'))
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.string.localeCompare('string-12') > 0)).toBe(true);
    });
    test('should return items where GT condition is true [number]', async () => {
      const result = await model
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
        .filter(attr('optional_string').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_number').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_bool').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_list').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_stringset').notExists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('optional_string').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_string !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_number').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_number !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_bool').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_bool !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_list').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_list !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter(attr('optional_stringset').exists())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optional_stringset !== undefined)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('number').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter(attr('bool').notNull())
        .exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter(attr('list').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter(attr('stringset').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringmap]', async () => {
      const result = await model
        .scan()
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
        .scan()
        .filter(attr('string').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string == null)).toBe(true);
    });
    test('should return items where NULL condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter(attr('number').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number == null)).toBe(true);
    });
    test('should return items where NULL condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter(attr('bool').null())
        .exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.bool == null)).toBe(true);
    });
    test('should return items where NULL condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter(attr('list').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter(attr('stringset').null())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringmap]', async () => {
      const result = await model
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
        .filter(attr('string').beginsWith('string-1'))
        .exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string.match(/^string-1/))).toBe(true);
    });
  });
  describe('OR', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .scan()
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
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
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
        .scan()
        // COND1: 10, 12, 14, 16, 18
        // COND2: 1, 4, 7, 10, 13, 16, 19
        // NOT(1, 4, 7, 10, 12, 13, 16, 18, 19
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

describe.skip('The scan method [projection]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 17;
  const attributes = [
    'hashkey',
    'rangekey',
    'number',
    'bool',
    'string',
    'stringset',
    'list',
    'stringmap',
    'optional_number',
    'optional_bool',
    'optional_string',
    'optional_stringset',
    'optional_list',
    'optional_stringmap',
  ];
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  test('should project on sclar type [string]', async () => {
    const result = await model
      .scan()
      .projection(['string'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.string !== undefined &&
          attributes.filter((att) => att !== 'string').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on sclar type [number]', async () => {
    const result = await model
      .scan()
      .projection(['optional_number'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'optional_number').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on sclar type [boolean]', async () => {
    const result = await model
      .scan()
      .projection(['bool'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.bool !== undefined &&
          attributes.filter((att) => att !== 'bool').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on list', async () => {
    const result = await model
      .scan()
      .projection(['list'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.list !== undefined &&
          attributes.filter((att) => att !== 'list').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on list element', async () => {
    const result = await model
      .scan()
      .projection([{ list: 'list', index: 0 }])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.list !== undefined &&
          attributes.filter((att) => att !== 'list').every((att) => (i as any)[att] === undefined) &&
          (!i.list || i.list.length === 1),
      ),
    ).toBe(true);
  });
  test('should project on set', async () => {
    const result = await model
      .scan()
      .projection(['stringset'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.stringset !== undefined &&
          attributes.filter((att) => att !== 'stringset').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on set element', async () => {
    const result = await model
      .scan()
      .projection([{ list: 'stringset', index: 0 }])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.stringset !== undefined &&
          attributes.filter((att) => att !== 'stringset').every((att) => (i as any)[att] === undefined) &&
          (!i.stringset || i.stringset.length < 2),
      ),
    ).toBe(true);
  });
  test('should project on map', async () => {
    const result = await model
      .scan()
      .projection(['stringmap'])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.stringmap !== undefined &&
          attributes.filter((att) => att !== 'stringmap').every((att) => (i as any)[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on map element', async () => {
    const result = await model
      .scan()
      .projection([{ map: 'stringmap', key: 'key-2' }])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.stringmap !== undefined &&
          attributes.filter((att) => att !== 'stringmap').every((att) => (i as any)[att] === undefined) &&
          !Object.keys(i.stringmap).some((k) => k !== 'key-2'),
      ),
    ).toBe(true);
  });
  test('should combine projections', async () => {
    const result = await model
      .scan()
      .projection([
        'string',
        'number',
        { list: 'list', index: 0 },
        { list: 'list', index: 1 },
        { map: 'stringmap', key: 'key-10' },
        { map: 'stringmap', key: 'key-14' },
      ])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          i.string !== undefined &&
          i.number !== undefined &&
          i.list !== undefined &&
          i.stringmap !== undefined &&
          attributes
            .filter((att) => ['stringmap', 'list', 'number', 'string'].includes(att))
            .every((att) => (i as any)[att] === undefined) &&
          !Object.keys(i.stringmap).some((k) => k !== 'key-10' && k !== 'key-14') &&
          (!i.list || i.list.length < 3),
      ),
    ).toBe(true);
  });
});

// A tester, important
describe('The scan method [combinations]', () => {
  test.todo('should combine paginate and filter');
  test.todo('should combine projection and filter');
  test.todo('should combine projection and paginate');
  test.todo('should combine projection, filter and paginate');
});

// spyOn exec
describe('The scan method [consistent-read]', () => {
  test.todo('should perform a consistent read if null');
  test.todo('should perform a consistent read if true');
  test.todo('should not perform a consistent read if false');
});
