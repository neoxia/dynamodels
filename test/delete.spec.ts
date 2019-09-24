/* eslint-env node, jest */
/* eslint-disable import/no-unresolved,no-unused-vars */
import HashKeyModel from './models/hashkey';
import CompositeKeyModel from './models/composite-keys';
import { clearTables } from './hooks/create-tables';
/* eslint-enable import/no-unresolved,no-unused-vars */

describe('The delete method', () => {
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
  beforeEach(async () => {
    await clearTables();
    await model.save(item);
  });
  test('should delete the item with the same hash key', async () => {
    expect(await model.exists('foobar')).toBe(true);
    await model.delete('foobar');
    expect(await model.exists('foobar')).toBe(false);
  });
  test('should throw an error if no item is found with this hash key', async () => {
    try {
      await model.delete('unknown');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('not exist')).toBe(true);
    }
  });
  test('should throw an error if hash key is not given', async () => {
    try {
      await model.delete(null);
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing HashKey')).toBe(true);
    }
  });
});

describe('The delete method [1st overload]', () => {
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
  beforeEach(async () => {
    await clearTables();
    await model.save(item);
  });
  test('should return the item with the same composite key', async () => {
    expect(await model.exists('foo', 'bar')).toBe(true);
    await model.delete('foo', 'bar');
    expect(await model.exists('foo', 'bar')).toBe(false);
  });
  test('should throw if no item is found with this composite key', async () => {
    try {
      await model.delete('foo', 'baz');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('not exist')).toBe(true);
    }
  });
  test('should throw an error if hash key is not given', async () => {
    try {
      await model.delete(null, 'baz');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing HashKey')).toBe(true);
    }
  });
  test('should throw an error if range key is not given', async () => {
    try {
      await model.delete('foo');
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Missing RangeKey')).toBe(true);
    }
  });
});
