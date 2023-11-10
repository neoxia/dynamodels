import HashKeyModel from './models/hashkey';
import { clearTables } from './hooks/create-tables';
import { put, remove } from '../src';
import HashKeyUpToDateModel from './models/hashkey-up-to-date';

describe('The update method', () => {
  const model = new HashKeyModel();
  const modelUpToDate = new HashKeyUpToDateModel();
  beforeEach(async () => {
    await clearTables();
    await model.save({
      hashkey: 'hashkey',
      number: 42,
      bool: true,
      string: 'string',
      stringset: ['string', 'string'],
      list: [42, 'foo'],
      stringmap: { bar: 'baz' },
      optionalNumber: 42,
      optionalStringset: ['string', 'string'],
      optionalList: [42, 'foo'],
      optionalStringmap: { bar: 'baz' },
    });
    await modelUpToDate.save({
      hashkey: 'hashkeyUpToDate',
      number: 42,
      bool: true,
      string: 'string',
      stringset: ['string', 'string'],
      list: [42, 'foo'],
      stringmap: { bar: 'baz' },
      optionalNumber: 42,
      optionalStringset: ['string', 'string'],
      optionalList: [42, 'foo'],
      optionalStringmap: { bar: 'baz' },
    });
  });
  test('should update the item with the correct actions', async () => {
    await model.update('hashkey', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
      // foo: add('string'),
    });
    const updated = await model.get('hashkey');
    expect(updated).toEqual({
      hashkey: 'hashkey',
      number: 43,
      bool: null,
      string: 'string',
      stringset: ['string', 'string'],
      list: [42, 'foo'],
      stringmap: { bar: 'baz' },
      // foo: 'string',
      optionalStringset: ['string', 'string'],
      optionalList: [42, 'foo'],
      optionalStringmap: { bar: 'baz' },
    });
  });
  test('should update the item with updatedAt field', async () => {
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2023-11-10T14:36:39.297Z');
    await modelUpToDate.update('hashkeyUpToDate', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
    });
    const updated = await modelUpToDate.get('hashkeyUpToDate');
    expect(updated).toEqual({
      hashkey: 'hashkeyUpToDate',
      number: 43,
      bool: null,
      string: 'string',
      stringset: ['string', 'string'],
      list: [42, 'foo'],
      stringmap: { bar: 'baz' },
      optionalStringset: ['string', 'string'],
      optionalList: [42, 'foo'],
      optionalStringmap: { bar: 'baz' },
      updatedAt: '2023-11-10T14:36:39.297Z',
    });
  });
  test('should update the item with updatedAt field a second time', async () => {
    await modelUpToDate.update('hashkeyUpToDate', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
    });
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2023-12-10T14:36:39.297Z');
    await modelUpToDate.update('hashkeyUpToDate', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
    });
    const updated = await modelUpToDate.get('hashkeyUpToDate');
    expect(updated).toEqual({
      hashkey: 'hashkeyUpToDate',
      number: 43,
      bool: null,
      string: 'string',
      stringset: ['string', 'string'],
      list: [42, 'foo'],
      stringmap: { bar: 'baz' },
      optionalStringset: ['string', 'string'],
      optionalList: [42, 'foo'],
      optionalStringmap: { bar: 'baz' },
      updatedAt: '2023-12-10T14:36:39.297Z',
    });
  });
  test.todo('should throw if item doest not exist');
  test.todo('should throw is hash key is not given');
});
describe('The update method [1st overload', () => {
  test.todo('should update the item with the correct actions');
  test.todo('should throw if item doest not exist');
  test.todo('should throw is hash key is not given');
  test.todo('should throw is range key is not given');
});
