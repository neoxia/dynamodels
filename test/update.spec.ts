/* eslint-disable import/no-unresolved,no-unused-vars */
import HashKeyModel from './models/hashkey';
import { clearTables } from './hooks/create-tables';
import { put, remove } from '../src/update-operators';
/* eslint-enable import/no-unresolved,no-unused-vars */

/* eslint-env node, jest */
describe('The update method', () => {
  const model = new HashKeyModel();
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
