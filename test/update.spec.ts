import HashKeyModel from './models/hashkey';
import TimeTrackedModel from './models/autoCreatedAt-autoUpdatedAt';
import { clearTables } from './hooks/create-tables';
import { put, remove } from '../src';

describe('The update method', () => {
  const model = new HashKeyModel();
  const timeTrackedModel = new TimeTrackedModel();
  beforeAll(async () => {
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
    await timeTrackedModel.save({
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
  });
  test('should save the item with updatedAt field when updating an item for the first time and autoUpdatedAt is enabled', async () => {
    await timeTrackedModel.update('hashkey', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
    });
    const updatedItem = await timeTrackedModel.get('hashkey');
    expect(updatedItem).toHaveProperty('updatedAt');

  });
  test('should save the item and update the updatedAt field when calling the update method subsequently', async () => {
    await timeTrackedModel.update('hashkey', {
      number: put(43),
      bool: put(null),
      optionalNumber: remove(),
    });
    const firstCallResult = await timeTrackedModel.get('hashkey');
    await timeTrackedModel.update('hashkey', {
      number: put(13),
    });
    const secondCallResult = await timeTrackedModel.get('hashkey');
    expect(firstCallResult.updatedAt).not.toEqual(secondCallResult.updatedAt);

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
  test.todo('should throw if item doest not exist');
  test.todo('should throw is hash key is not given');
});
describe('The update method [1st overload', () => {
  test.todo('should update the item with the correct actions');
  test.todo('should throw if item doest not exist');
  test.todo('should throw is hash key is not given');
  test.todo('should throw is range key is not given');
});
