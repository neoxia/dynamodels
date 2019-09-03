import { InvalidTableModel, NoDocClientModel, HashKeyModel, InvalidPKModel } from './test-models';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

describe.skip('Base model class Model<T>', () => {
  const spy = jest.fn();
  function Mock() {
    spy();
    DocumentClient.apply(this);
  }
  Mock.prototype = DocumentClient.prototype;
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
});
