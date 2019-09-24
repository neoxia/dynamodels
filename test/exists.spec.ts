/* eslint-env node, jest */
/* eslint-disable import/no-unresolved,no-unused-vars */
import HashKeyModel from './models/hashkey';
import CompositeKeyModel from './models/composite-keys';
import { clearTables } from './hooks/create-tables';
/* eslint-enable import/no-unresolved,no-unused-vars */

describe('The exists method', () => {
  const model = new HashKeyModel();
  const item = {
    hashkey: 'foobar',
    number: 42,
    bool: false,
    string: 'baz',
    stringset: ['1', 'two', 'tres'],
    list: [1, 'yolo'],
    stringmap: {
      hello: 'world',
    },
  };
  beforeAll(async () => {
    await clearTables();
    await model.save(item);
  });
  test('should return true if the item with the same hash key exists', async () => {
    expect(await model.exists('foobar')).toBe(true);
  });
  test('should return false if no item with the same hash key exists', async () => {
    expect(await model.exists('unknown')).toBe(false);
  });
  test('should throw an error if hash key is not given', async () => {
    try {
      await model.exists(null);
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing HashKey')).toBe(true);
    }
  });
});

describe('The exists method [1st overload]', () => {
  const model = new CompositeKeyModel();
  const item = {
    hashkey: 'foo',
    rangekey: 'bar',
    number: 42,
    bool: false,
    string: 'baz',
    stringset: ['1', 'two', 'tres'],
    list: [1, 'yolo'],
    stringmap: {
      hello: 'world',
    },
  };
  beforeAll(async () => {
    await clearTables();
    await model.save(item);
  });
  test('should return true if the item with the same composite key exists', async () => {
    expect(await model.exists('foo', 'bar')).toBe(true);
  });
  test('should return false if no item with the same composite key exists', async () => {
    expect(await model.exists('foo', 'baz')).toBe(false);
  });
  test('should throw an error if hash key is not given', async () => {
    try {
      await model.exists(null, 'baz');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing HashKey')).toBe(true);
    }
  });
  test('should throw an error if range key is not given', async () => {
    try {
      await model.exists('foo');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing RangeKey')).toBe(true);
    }
  });
});
