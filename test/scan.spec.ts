import { CompositeKeyModel } from './test-models';
import { clearTables } from './hooks/create-tables';
import { IPaginationOptions } from '../src/paginate';
import { Model } from '../src/base-model';
import { eq } from '../src/key-operators';

const generateData = async (model: Model<any>, nbEntries: number): Promise<any[]> => {
  const promises: Array<Promise<any>> = [];
  for (let i = 0; i < nbEntries; ++i) {
    promises.push(
      model.save({
        hashkey: `hashkey-${i}`,
        rangekey: `rangekey-${i}`,
        number: i % 2 == 0 ? i : null,
        bool: i % 2 == 0 ? i % 3 === 0 : null,
        string: `string-${i}`,
        stringset: [`string-${i}-0`, `string-${i}-1`, `string-${i}-2`],
        list: [i, `item-${i}`],
        stringmap: {
          [`key-${i}`]: `value-${i}`,
        },
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
          string: 'string-3',
        })
        .exec();

      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter({
          number: eq(3),
        })
        .exec();
      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter({
          boolean: true,
        })
        .exec();
      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
  });
  describe('NE', () => {
    test.todo('should return items where NEQ condition is true [string]');
    test.todo('should return items where NEQ condition is true [number]');
    test.todo('should return items where NEQ condition is true [boolean]');
  });
  describe('IN', () => {
    test.todo('should return items where IN condition is true [string]');
    test.todo('should return items where IN condition is true [number]');
    test.todo('should return items where IN condition is true [boolean]');
  });
  describe('LE', () => {
    test.todo('should return items where LE condition is true [string]');
    test.todo('should return items where LE condition is true [number]');
    test.todo('should return items where LE condition is true [boolean]');
  });
  describe('LT', () => {
    test.todo('should return items where LT condition is true [string]');
    test.todo('should return items where LT condition is true [number]');
    test.todo('should return items where LT condition is true [boolean]');
  });
  describe('GE', () => {
    test.todo('should return items where GE condition is true [string]');
    test.todo('should return items where GE condition is true [number]');
    test.todo('should return items where GE condition is true [boolean]');
  });
  describe('GT', () => {
    test.todo('should return items where GT condition is true [string]');
    test.todo('should return items where GT condition is true [number]');
    test.todo('should return items where GT condition is true [boolean]');
  });
  describe('BETWEEN', () => {
    test.todo('should return items where BETWEEN condition is true [string]');
    test.todo('should return items where BETWEEN condition is true [number]');
    test.todo('should return items where BETWEEN condition is true [boolean]');
  });
  describe('NOT_NULL', () => {
    test.todo('should return items where NOT_NULL condition is true [string]');
    test.todo('should return items where NOT_NULL condition is true [number]');
    test.todo('should return items where NOT_NULL condition is true [boolean]');
    test.todo('should return items where NOT_NULL condition is true [list]');
    test.todo('should return items where NOT_NULL condition is true [stringset]');
    test.todo('should return items where NOT_NULL condition is true [stringmap]');
  });
  describe('NULL', () => {
    test.todo('should return items where NULL condition is true [string]');
    test.todo('should return items where NULL condition is true [number]');
    test.todo('should return items where NULL condition is true [boolean]');
    test.todo('should return items where NULL condition is true [list]');
    test.todo('should return items where NULL condition is true [stringset]');
    test.todo('should return items where NULL condition is true [stringmap]');
  });
  describe('CONTAINS', () => {
    test.todo('should return items where CONTAINS condition is true [string]');
  });
  describe('NOT_CONTAINS', () => {
    test.todo('should return items where NOT_CONTAINS condition is true [string]');
  });
  describe('BEGINS_WITH', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
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
        .filter({
          string: 'string-3',
        })
        .exec();

      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
    test('should return items where EQ condition is true [number]', async () => {
      const result = await model
        .scan()
        .filter({
          number: eq(3),
        })
        .exec();
      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
    test('should return items where EQ condition is true [boolean]', async () => {
      const result = await model
        .scan()
        .filter({
          boolean: true,
        })
        .exec();
      console.log(result.items);
      expect(result.count).toBe(1);
      expect(result.nextPage.lastEvaluatedKey).toBeFalsy();
      expect(result.items.length).toBe(1);
      expect(result.items[0].string).toBe('string-3');
    });
  });
  describe('NE', () => {
    test.todo('should return items where NEQ condition is true [string]');
    test.todo('should return items where NEQ condition is true [number]');
    test.todo('should return items where NEQ condition is true [boolean]');
  });
  describe('IN', () => {
    test.todo('should return items where IN condition is true [string]');
    test.todo('should return items where IN condition is true [number]');
    test.todo('should return items where IN condition is true [boolean]');
  });
  describe('LE', () => {
    test.todo('should return items where LE condition is true [string]');
    test.todo('should return items where LE condition is true [number]');
    test.todo('should return items where LE condition is true [boolean]');
  });
  describe('LT', () => {
    test.todo('should return items where LT condition is true [string]');
    test.todo('should return items where LT condition is true [number]');
    test.todo('should return items where LT condition is true [boolean]');
  });
  describe('GE', () => {
    test.todo('should return items where GE condition is true [string]');
    test.todo('should return items where GE condition is true [number]');
    test.todo('should return items where GE condition is true [boolean]');
  });
  describe('GT', () => {
    test.todo('should return items where GT condition is true [string]');
    test.todo('should return items where GT condition is true [number]');
    test.todo('should return items where GT condition is true [boolean]');
  });
  describe('BETWEEN', () => {
    test.todo('should return items where BETWEEN condition is true [string]');
    test.todo('should return items where BETWEEN condition is true [number]');
    test.todo('should return items where BETWEEN condition is true [boolean]');
  });
  describe('NOT_NULL', () => {
    test.todo('should return items where NOT_NULL condition is true [string]');
    test.todo('should return items where NOT_NULL condition is true [number]');
    test.todo('should return items where NOT_NULL condition is true [boolean]');
    test.todo('should return items where NOT_NULL condition is true [list]');
    test.todo('should return items where NOT_NULL condition is true [stringset]');
    test.todo('should return items where NOT_NULL condition is true [stringmap]');
  });
  describe('NULL', () => {
    test.todo('should return items where NULL condition is true [string]');
    test.todo('should return items where NULL condition is true [number]');
    test.todo('should return items where NULL condition is true [boolean]');
    test.todo('should return items where NULL condition is true [list]');
    test.todo('should return items where NULL condition is true [stringset]');
    test.todo('should return items where NULL condition is true [stringmap]');
  });
  describe('CONTAINS', () => {
    test.todo('should return items where CONTAINS condition is true [string]');
  });
  describe('NOT_CONTAINS', () => {
    test.todo('should return items where NOT_CONTAINS condition is true [string]');
  });
  describe('BEGINS_WITH', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
  });

  describe('OR', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
  });

  describe('AND', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
  });

  describe('OR/AND no-parenthesis', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
  });

  describe('OR/AND parenthesis', () => {
    test.todo('should return items where BEGINS_WITH condition is true [string]');
  });
});
