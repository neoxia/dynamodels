/* eslint-env node, jest */
/* eslint-disable import/no-unresolved,no-unused-vars */
import { clearTables } from './hooks/create-tables';
import HashKeyModel from './models/hashkey';
import HashKeyJoiModel from './models/hashkey-joi';
/* eslint-enable import/no-unresolved,no-unused-vars */

describe('The save method', () => {
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
    await foo.save();
    const saved = await foo.get('bar');
    expect(saved).toEqual(item);
  });
  test('should throw an error if not item is held by the class', async () => {
    const foo = new HashKeyModel();
    try {
      await foo.save();
      /* eslint-disable-next-line no-undef */
      fail('should throw');
    } catch (e) {
      expect(e.message.includes('No item to save')).toBe(true);
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
      await foo.save();
      /* eslint-disable-next-line no-undef */
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
    await foo.save();
    const saved = await foo.get('bar');
    expect(saved).toEqual(item);
  });
});

describe('The save method [1st overload]', () => {
  beforeEach(async () => {
    await clearTables();
  });
  test('should save the item given in parameter', async () => {
    const foo = new HashKeyModel();
    const item = {
      hashkey: 'bar',
      string: 'whatever',
      stringmap: { foo: 'bar' },
      stringset: ['bar, bar'],
      number: 43,
      bool: true,
      list: ['foo', 42],
    };
    await foo.save(item);
    const saved = await foo.get('bar');
    expect(saved).toEqual(item);
  });
  test('should throw an error if a Joi schema is specified and validation failed', async () => {
    const model = new HashKeyJoiModel();
    try {
      await model.save({
        hashkey: 'bar',
        string: 'whatever',
        stringmap: { foo: 'bar' },
        stringset: ['bar, bar'],
        number: 43,
        bool: true,
        list: ['foo', 42],
      });
      /* eslint-disable-next-line no-undef */
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
    await model.save(item);
    const saved = await model.get('bar');
    expect(saved).toEqual(item);
  });
});
