import generateData from './factories';
import CompositeKeyModel from './models/composite-keys';
import { clearTables } from './hooks/create-tables';
import { IPaginationOptions } from '../src/paginate';
import {
  eq,
  neq,
  isIn,
  le,
  lt,
  ge,
  gt,
  between,
  isNull,
  notNull,
  notExists,
  exists,
  contains,
  notContains,
  beginsWith,
} from '../src';
import { attr, not } from '../src/filter-conditions';

describe('The scan method', () => {
  const model = new CompositeKeyModel();
  test('should return all items in the table in 1MB limit is exec called', async () => {
    await clearTables();
    await generateData(model, 10000);
    const result = await model.scan().exec();
    // expect(result.count).toBe(nbEntries);
    expect(result.items.length).toBeLessThan(10000);
    expect(result.nextPage.lastEvaluatedKey).not.toBeNull();
  });
  test('should return all items in the table is execAll called', async () => {
    await clearTables();
    await generateData(model, 10);
    const result = await model.scan().execAll();
    expect(result.length).toBe(10);
  });
});

describe('The count method', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 143;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  test('should return the correct number of items', async () => {
    const count = await model.count();
    expect(count).toBe(143);
  });
});

describe('The scan method [count]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 265;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  test('should return the correct number of items', async () => {
    const count = await model.scan().count();
    expect(count).toBe(265);
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
    const page1 = await model.scan().paginate({ size: 50 }).exec();
    nextPage = page1.nextPage;
    expect(page1.items.length).toBe(50);
    expect(page1.nextPage.lastEvaluatedKey).toBeTruthy();
    expect(page1.nextPage.size).toBe(50);
  });
  test('should return the next page of items with the correct size', async () => {
    const page2 = await model.scan().paginate(nextPage).exec();
    nextPage = page2.nextPage;
    expect(page2.items.length).toBe(50);
    expect(page2.nextPage.lastEvaluatedKey).toBeTruthy();
    expect(page2.nextPage.size).toBe(50);
  });
  test('should return a null last evaluated key when last page is fetched', async () => {
    const page3 = await model.scan().paginate(nextPage).exec();
    nextPage = page3.nextPage;
    const page4 = await model.scan().paginate(nextPage).exec();
    // expect(page4.count).toBe(nbEntries);
    expect(page4.items.length).toBe(187 - 3 * 50);
    expect(page4.nextPage.lastEvaluatedKey).toBeFalsy();
    expect(page4.nextPage.size).toBe(50);
  });
});

describe('The scan method [filtering / object syntax]', () => {
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
      expect(result.items.some((i) => i.string && i.string === 'string-2')).toBe(false);
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
      expect(result.items.some((i) => i.string && i.string === 'string-8')).toBe(false);
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
          string: isIn('string-2', 'string-12', 'string-14', 'string-0'),
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
          number: isIn(2, 12, 14, 0),
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
          bool: isIn(true, false),
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
      expect(result.items.every((i) => i.string!.localeCompare('string-12') <= 0)).toBe(true);
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
      expect(result.items.every((i) => i.number! <= 12)).toBe(true);
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
      expect(result.items.every((i) => i.string!.localeCompare('string-12') < 0)).toBe(true);
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
      expect(result.items.every((i) => i.number! < 12)).toBe(true);
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
      expect(result.items.every((i) => i.string!.localeCompare('string-12') >= 0)).toBe(true);
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
      expect(result.items.every((i) => i.number! >= 12)).toBe(true);
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
      expect(result.items.every((i) => i.string!.localeCompare('string-12') > 0)).toBe(true);
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
      expect(result.items.every((i) => i.number! >= 12)).toBe(true);
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
        result.items.every(
          (i) =>
            i.string!.localeCompare('string-3') >= 0 && i.string!.localeCompare('string-8') <= 0,
        ),
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
      expect(result.items.every((i) => i.number! >= 6 && i.number! <= 17)).toBe(true);
    });
  });
  describe('NOT_EXISTS', () => {
    test('should return items where NOT_EXISTS condition is true [string]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalString: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalString == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalNumber: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalNumber == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalBool: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalBool == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalList: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalList == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalStringset: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringset == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalStringmap: notExists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringmap == null)).toBe(true);
    });
  });
  describe('EXISTS', () => {
    test('should return items where EXISTS condition is true [string]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalString: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalString != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalNumber: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalNumber != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalBool: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalBool != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [list]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalList: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalList != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringset]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalStringset: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringset != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringmap]', async () => {
      const result = await model
        .scan()
        .filter({
          optionalStringmap: exists(),
        })
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringmap != null)).toBe(true);
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
          string: isNull(),
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
          number: isNull(),
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
          bool: isNull(),
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
          list: isNull(),
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
          stringset: isNull(),
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
          stringmap: isNull(),
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
      expect(result.items.every((i) => i.string!.includes('ing-1'))).toBe(true);
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
      expect(result.items.every((i) => !(i.string && i.string!.includes('ing-1')))).toBe(true);
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
      expect(result.items.every((i) => i.string!.match(/^string-1/))).toBe(true);
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
    expect(
      result.items.every((i) => i.string!.match(/^string-1/) && i.bool === true && i.number! >= 12),
    ).toBe(true);
  });
});

describe('The scan method [filtering / fluid syntax]', () => {
  const model = new CompositeKeyModel();
  const nbEntries = 20;
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  describe('EQ', () => {
    test('should return items where EQ condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').eq('string-2')).exec();

      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-2');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').eq(6)).exec();
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-6');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('bool').eq(true)).exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.bool)).toBe(true);
    });
  });
  describe('NE', () => {
    test('should return items where NEQ condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').neq('string-2')).exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string && i.string === 'string-2')).toBe(false);
    });
    test('should return items where NEQ condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').neq(8)).exec();

      expect(result.count).toBe(19);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(19);
      expect(result.items.some((i) => i.string && i.string === 'string-8')).toBe(false);
    });
    test('should return items where NEQ condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('bool').neq(true)).exec();
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
      const result = await model.scan().filter(attr('bool').in(false, true)).exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
  });
  describe('LE', () => {
    test('should return items where LE condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').le('string-12')).exec();

      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.string!.localeCompare('string-12') <= 0)).toBe(true);
    });
    test('should return items where LE condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').le(12)).exec();

      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.number! <= 12)).toBe(true);
    });
  });
  describe('LT', () => {
    test('should return items where LT condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').lt('string-12')).exec();

      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(result.items.every((i) => i.string!.localeCompare('string-12') < 0)).toBe(true);
    });
    test('should return items where LT condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').lt(12)).exec();

      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.number! < 12)).toBe(true);
    });
  });
  describe('GE', () => {
    test('should return items where GE condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').ge('string-12')).exec();
      expect(result.count).toBe(8);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(8);
      expect(result.items.every((i) => i.string!.localeCompare('string-12') >= 0)).toBe(true);
    });
    test('should return items where GE condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').ge(12)).exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(result.items.every((i) => i.number! >= 12)).toBe(true);
    });
  });
  describe('GT', () => {
    test('should return items where GT condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').gt('string-12')).exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(result.items.every((i) => i.string!.localeCompare('string-12') > 0)).toBe(true);
    });
    test('should return items where GT condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').gt(12)).exec();
      expect(result.count).toBe(3);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(3);
      expect(result.items.every((i) => i.number! >= 12)).toBe(true);
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
        result.items.every(
          (i) =>
            i.string!.localeCompare('string-3') >= 0 && i.string!.localeCompare('string-8') <= 0,
        ),
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
      expect(result.items.every((i) => i.number! >= 6 && i.number! <= 17)).toBe(true);
    });
  });
  describe('NOT_EXISTS', () => {
    test('should return items where NOT_EXISTS condition is true [string]', async () => {
      const result = await model.scan().filter(attr('optionalString').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalString == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [number]', async () => {
      const result = await model.scan().filter(attr('optionalNumber').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalNumber == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('optionalBool').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalBool == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [list]', async () => {
      const result = await model.scan().filter(attr('optionalList').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalList == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringset]', async () => {
      const result = await model.scan().filter(attr('optionalStringset').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringset == null)).toBe(true);
    });
    test('should return items where NOT_EXISTS condition is true [stringmap]', async () => {
      const result = await model.scan().filter(attr('optionalStringmap').notExists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringmap == null)).toBe(true);
    });
  });
  describe('EXISTS', () => {
    test('should return items where EXISTS condition is true [string]', async () => {
      const result = await model.scan().filter(attr('optionalString').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalString != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [number]', async () => {
      const result = await model.scan().filter(attr('optionalNumber').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalNumber != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('optionalBool').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalBool != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [list]', async () => {
      const result = await model.scan().filter(attr('optionalList').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalList != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringset]', async () => {
      const result = await model.scan().filter(attr('optionalStringset').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringset != null)).toBe(true);
    });
    test('should return items where EXISTS condition is true [stringmap]', async () => {
      const result = await model.scan().filter(attr('optionalStringmap').exists()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.optionalStringmap != null)).toBe(true);
    });
  });
  describe('NOT_NULL', () => {
    test('should return items where NOT_NULL condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').notNull()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').notNull()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('bool').notNull()).exec();
      expect(result.count).toBe(14);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(14);
      expect(result.items.every((i) => i.bool != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [list]', async () => {
      const result = await model
        .scan({
          ConsistentRead: true,
        })
        .filter(attr('list').notNull())
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringset]', async () => {
      const result = await model.scan().filter(attr('stringset').notNull()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset != null)).toBe(true);
    });
    test('should return items where NOT_NULL condition is true [stringmap]', async () => {
      const result = await model.scan().filter(attr('stringmap').notNull()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap != null)).toBe(true);
    });
  });
  describe('NULL', () => {
    test('should return items where NULL condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').null()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.string == null)).toBe(true);
    });
    test('should return items where NULL condition is true [number]', async () => {
      const result = await model.scan().filter(attr('number').null()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.number == null)).toBe(true);
    });
    test('should return items where NULL condition is true [boolean]', async () => {
      const result = await model.scan().filter(attr('bool').null()).exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(result.items.every((i) => i.bool == null)).toBe(true);
    });
    test('should return items where NULL condition is true [list]', async () => {
      const result = await model.scan().filter(attr('list').null()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.list == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringset]', async () => {
      const result = await model.scan().filter(attr('stringset').null()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringset == null)).toBe(true);
    });
    test('should return items where NULL condition is true [stringmap]', async () => {
      const result = await model.scan().filter(attr('stringmap').null()).exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(result.items.every((i) => i.stringmap == null)).toBe(true);
    });
  });
  describe('CONTAINS', () => {
    test('should return items where CONTAINS condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').contains('ing-1')).exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string!.includes('ing-1'))).toBe(true);
    });
  });
  describe('NOT_CONTAINS', () => {
    test('should return items where NOT_CONTAINS condition is true [string]', async () => {
      const result = await model
        .scan()
        .filter(attr('string').notContains('ing-1'))
        .consistent()
        .exec();
      expect(result.count).toBe(15);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(15);
      expect(result.items.every((i) => !(i.string && i.string!.includes('ing-1')))).toBe(true);
    });
  });
  describe('BEGINS_WITH', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model.scan().filter(attr('string').beginsWith('string-1')).exec();
      expect(result.count).toBe(5);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(5);
      expect(result.items.every((i) => i.string!.match(/^string-1/))).toBe(true);
    });
  });
  describe('OR', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .scan()
        .filter(attr('string').beginsWith('string-1').or(attr('string').contains('ing-4')))
        .exec();
      expect(result.count).toBe(6);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(6);
      expect(
        result.items.every((i) => i.string!.match(/^string-1/) || i.string!.includes('ing-4')),
      ).toBe(true);
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
        .consistent()
        .exec();
      expect(result.count).toBe(2);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(2);
      expect(
        result.items.every(
          (i) => i.string!.match(/^string-1/) && i.bool === true && i.number! >= 12,
        ),
      ).toBe(true);
    });
  });
  describe('OR/AND no-parenthesis', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .scan()
        .consistent()
        .filter(
          // bool = true AND number < 8 OR begins_with(string, string-1)
          attr('bool').eq(true).and(attr('number').lt(8)).or(attr('string').beginsWith('string-1')),
        )
        .exec();
      expect(result.count).toBe(7);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(7);
      expect(
        result.items.every(
          (i) => (i.bool === true && i.number! < 8) || i.string!.match(/^string-1/),
        ),
      ).toBe(true);
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
            .and(attr('number').lt(8).or(attr('string').beginsWith('string-1'))),
        )
        .exec();
      expect(result.count).toBe(4);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(4);
      expect(
        result.items.every(
          (i) => i.bool === true && (i.number! < 8 || i.string!.match(/^string-1/)),
        ),
      ).toBe(true);
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
      expect(result.items.every((i) => !i.string || !i.string!.match(/^string-1/))).toBe(true);
    });
  });
  describe('NOT/OR', () => {
    test('should return items where BEGINS_WITH condition is true [string]', async () => {
      const result = await model
        .scan()
        // COND1: 10, 12, 14, 16, 18
        // COND2: 1, 4, 7, 10, 13, 16, 19
        // NOT(1, 4, 7, 10, 12, 13, 16, 18, 19
        .filter(not(attr('string').beginsWith('string-1').or(attr('bool').eq(false))))
        .exec();
      expect(result.count).toBe(10);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(10);
      expect(
        result.items.every(
          (i) => !(i.bool === false || (i.string && i.string!.match(/^string-1/))),
        ),
      ).toBe(true);
    });
  });
});

describe('The scan method [projection]', () => {
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
    'optionalNumber',
    'optionalBool',
    'optionalString',
    'optionalStringset',
    'optionalList',
    'optionalStringmap',
  ];
  beforeAll(async () => {
    await clearTables();
    await generateData(model, nbEntries);
  });
  test('should project on scalar type [string]', async () => {
    const result = await model.scan().projection(['string']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'string').every((att) => i[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on scalar type [number]', async () => {
    const result = await model.scan().projection(['optionalNumber']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'optionalNumber').every((att) => i[att] == null),
      ),
    ).toBe(true);
  });
  test('should project on scalar type [boolean]', async () => {
    const result = await model.scan().projection(['bool']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'bool').every((att) => i[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on list', async () => {
    const result = await model.scan().projection(['list']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'list').every((att) => i[att] === undefined),
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
          attributes.filter((att) => att !== 'list').every((att) => i[att] == null) &&
          (!i.list || i.list.length === 1),
      ),
    ).toBe(true);
  });
  test('should project on set', async () => {
    const result = await model.scan().projection(['stringset']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'stringset').every((att) => i[att] === undefined),
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
          attributes.filter((att) => att !== 'stringset').every((att) => i[att] == null) &&
          (!i.stringset || i.stringset.length < 2),
      ),
    ).toBe(true);
  });
  test('should project on map', async () => {
    const result = await model.scan().projection(['stringmap']).exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every((i) =>
        attributes.filter((att) => att !== 'stringmap').every((att) => i[att] === undefined),
      ),
    ).toBe(true);
  });
  test('should project on map element', async () => {
    const result = await model
      .scan()
      .projection([{ map: 'stringmap', key: 'key2' }])
      .exec();
    expect(result.count).toBe(17);
    expect(
      result.items.every(
        (i) =>
          attributes.filter((att) => att !== 'stringmap').every((att) => i[att] == null) &&
          (i.stringmap == null ||
            (i.stringmap?.key2 != null && !Object.keys(i.stringmap).some((k) => k !== 'key2'))),
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
        { map: 'stringmap', key: 'key10' },
        { map: 'stringmap', key: 'key14' },
      ])
      .exec();
    expect(result.count).toBe(17);
    // console.log(JSON.stringify(result.items));
    /*expect(
      result.items.every(
        (i) =>
          i.string !== undefined &&
          i.number !== undefined &&
          (i.list == null || i.list[0] || i.list[1]) &&
          (i.stringmap == null ||
            !Object.keys(i.stringmap).some((k) => k !== 'key10' && k !== 'key14')) &&
          attributes
            .filter((att) => ['stringmap', 'list', 'number', 'string'].includes(att))
            .every((att) => i[att] === undefined),
      ),
    ).toBe(true);*/
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
