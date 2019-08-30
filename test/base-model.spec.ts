import { InvalidTableModel, NoDocClientModel, HashKeyModel, InvalidPKModel } from './test-models';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { clearTables } from './hooks/create-tables';

describe('Base model class Model<T>', () => {
  const spy = jest.fn()
  function Mock () {
    spy()
    DocumentClient.apply(this)
  }
  Mock.prototype = DocumentClient.prototype
  describe('Constructor', () => {
    test.skip('should throw an error if table name is not specified', () => {
      expect(new InvalidTableModel()).toThrowError('No table name specified');
    });
    test.skip('should throw an error if hash key is not specified', () => {
      expect(new InvalidPKModel()).toThrowError('No hashkey specified');
    });
    test.skip('should throw an error if instanciate a new DocumentClient if not specified', () => {
      new NoDocClientModel();
      expect(spy.mock.calls.length).toBe(1);
      spy.mockRestore();
    });
    test.skip('should throw an error if the dervied class DocumentClient if specified', () => {
      new NoDocClientModel();
      expect(spy.mock.calls.length).toBe(0);
      spy.mockRestore();
    });
  });

  describe('The save method', () => {
    beforeAll(async () => {
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
    test('should throw an error if not item is held by the class', async() => {
      const foo = new HashKeyModel();
      expect(foo.save).toThrowError('No item to save');
    });
    test.todo('should throw an error if a Joi schema is specified and validation failed');
    test.todo('should not throw an error if a Joi schema is specified and validation succeed');
  });

  describe('The save method [1st overload]', () => {
    test.todo('should save the item given in parameter');
    test.todo('should throw an error if a Joi schema is specified and validation failed');
    test.todo('should not throw an error if a Joi schema is specified and validation succeed');
  });

  describe('The create method', () => {
    test.todo('should save the item held by the class');
    test.todo('should throw an error if not item is held by the class');
    test.todo('should throw an error if an item with the same hash key exists');
    test.todo('should throw an error if a Joi schema is specified and validation failed');
    test.todo('should not throw an error if a Joi schema is specified and validation succeed');
  });

  describe('The create method [1st overload]', () => {
    test.todo('should save the item given in parameters');
    test.todo('should throw an error if an item with the same composite key exists');
    test.todo('should throw an error if a Joi schema is specified and validation failed');
    test.todo('should not throw an error if a Joi schema is specified and validation succeed');
  });

  describe('The get method', () => {
    test.todo('should return the item with the same hash key');
    test.todo('should return null if no item is found with this hash key');
    test.todo('should throw an error if hash key is not given');
  });

  describe('The get method [1st overload]', () => {
    test.todo('should return the item with the same composite key');
    test.todo('should return null if no item is found with this composite key');
    test.todo('should throw an error if hash key is not given');
    test.todo('should throw an error if range key is not given');
  });

  describe('The exists method', () => {
    test.todo('should return true if the item with the same hash key exists');
    test.todo('should return false if no item with the same hash key exists');
    test.todo('should throw an error if hash key is not given');
  });

  describe('The exists method [1st overload]', () => {
    test.todo('should return true if the item with the same composite key exists');
    test.todo('should return false if no item with the same composite key exists');
    test.todo('should throw an error if hash key is not given');
    test.todo('should throw an error if range key is not given');
  });

  describe('The delete method', () => {
    test.todo('should delete the item with the same hash key');
    test.todo('should throw an error if no item is found with this hash key');
    test.todo('should throw an error if hash key is not given');
  });

  describe('The delete method [1st overload]', () => {
    test.todo('should return the item with the same composite key');
    test.todo('should return null if no item is found with this composite key');
    test.todo('should throw an error if hash key is not given');
    test.todo('should throw an error if range key is not given');
  });

  describe('The scan method', () => {
    test.todo('should return all items in the table in 1MB limit is exec called');
    test.todo('should return all items in the table is execAll called');
  });
  describe('The scan method [pagination]', () => {
    test.todo('should return a null page size [no pagination options given]');
    test.todo('should return last evaluated key if there is more items [no pagination options given]');
    test.todo('should return a null last evaluated key if there is no more items [no pagination options given]');
    test.todo('should return the given page size [pagination options given]');
    test.todo('should return all a last evaluated key if there is more items [pagination options given]');
    test.todo('should return all a null last evaluated key if there is no more items [pagination options given]');
  });

  describe('The scan method [filtering]', () => {
    test.todo(
      'should return the filtered results when filtering with operator equal on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator not equal on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator null on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator not null on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator begin with on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator contains on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator not contains on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator equal on a number field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator not equal on a number field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator null on a number field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator not null on a number field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator lesser than on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator greater than on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator lesser or equal than on a string field [filtering options given]',
    );
    test.todo(
      'should return the filtered results when filtering with operator greater or equal than on a string field [filtering options given]',
    );
  });

  describe('The query method', () => {
    test.todo('should return all items in the table in 1MB limit is exec called');
  });

  describe('The batchGet method', () => {});

  describe('The batchGetAll method', () => {});

  describe('The update method', () => {});
  describe('The update method [1st overload', () => {});
});
