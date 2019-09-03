import { clearTables } from './hooks/create-tables';
import { HashKeyModel, HashKeyJoiModel, CompositeKeyModel } from './test-models';

describe('The create method', () => {
  beforeEach(async () => {
    await clearTables();
  });
  test('should save the item held by the class', async () => {
    const item = {
      hashkey: 'bar',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    const foo = new HashKeyModel(item);
    await foo.create();
    const saved = await foo.get('bar');
    expect(saved).toEqual(item);
  });
  test('should throw an error if not item is held by the class', async () => {
    const foo = new HashKeyModel();
    try {
      await foo.create();
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('No item to save')).toBe(true);
    }
  });
  test('should throw an error if an item with the same hash key exists', async () => {
    const foo = new HashKeyModel();
    await foo.save({
      hashkey: 'bar',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    });
    try {
      await foo.create({
        hashkey: 'bar',
        string: 'whatever',
        stringmap: { foo: 'bar' },
        stringset: ['bar, bar'],
        number: 43,
        bool: true,
        list: ['foo', 42],
      });
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('already exists')).toBe(true);
    }
  });
  test('should throw an error if a Joi schema is specified and validation failed', async () => {
    const foo = new HashKeyJoiModel({
      hashkey: 'bar',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    });
    try {
      await foo.create();
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Validation error')).toBe(true);
    }
  });
  test('should not throw an error if a Joi schema is specified and validation succeed', async () => {
    const item = {
      hashkey: 'bar',
      string: 'whatever@domain.com',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    const foo = new HashKeyJoiModel(item);
    await foo.create();
    const saved = await foo.get('bar');
    expect(saved).toEqual(item);
  });
});

describe('The create method [1st overload]', () => {
  beforeEach(async () => {
    await clearTables();
  });
  test('should save the item given in parameters', async () => {
    const foo = new CompositeKeyModel();
    const item = {
      hashkey: 'bar',
      rangekey: 'baz',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    await foo.create(item);
    const saved = await foo.get('bar', 'baz');
    expect(saved).toEqual(item);
  });
  test('should throw an error if an item with the same composite key exists', async () => {
    const foo = new CompositeKeyModel();
    const item = {
      hashkey: 'bar',
      rangekey: 'baz',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    await foo.save(item);
    try {
      await foo.create(item);
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('already exists')).toBe(true);
    }
  });
  test('should throw an error if a Joi schema is specified and validation failed', async () => {
    const model = new HashKeyJoiModel();
    try {
      await model.create({
        hashkey: 'bar',
        string: 'whatever',
        stringmap: { foo: 'bar' },
        stringset: ['bar, bar'],
        number: 43,
        bool: true,
        list: ['foo', 42],
      });
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('Validation error')).toBe(true);
    }
  });
  test('should not throw an error if a Joi schema is specified and validation succeed', async () => {
    const item = {
      hashkey: 'bar',
      string: 'whatever@domain.com',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    const model = new HashKeyJoiModel();
    await model.create(item);
    const saved = await model.get('bar');
    expect(saved).toEqual(item);
  });
});
