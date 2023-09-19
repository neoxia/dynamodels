import CompositeKeyModel from './models/composite-keys';
import { clearTables } from './hooks/create-tables';
import { hashOnly } from './factories';
import HashKeyModel from './models/hashkey';
import { KeyValue } from '../src/base-model';

jest.setTimeout(20 * 1000);

const compositeModel = new CompositeKeyModel();
const hashModel = new HashKeyModel();

const setupTestData = async (nbEntries: number): Promise<Array<KeyValue>> => {
  await clearTables();
  const items = await hashOnly(hashModel, nbEntries);
  return items.map((item) => item.hashkey as KeyValue);
};

const setupCompositeKeyTestData = async (nbEntries: number) => {
  await clearTables();
  const items = await hashOnly(compositeModel, nbEntries);
  return items.map((item) => ({
    pk: item.hashkey as KeyValue,
    sk: item.rangekey as KeyValue,
  }));
};

describe('The batch get method', () => {
  test('should return all items when hash keys are correct [case < 100]', async () => {
    const keys = await setupTestData(42);
    const result = await hashModel.batchGet(keys);
    expect(result.length).toBe(42);
  });
  test('should return all items when hash keys are correct [case > 100]', async () => {
    const keys = await setupTestData(142);
    const result = await hashModel.batchGet(keys);
    expect(result.length).toBe(142);
  });
  test('should return empty array if keys are an empty array', async () => {
    const result = await compositeModel.batchGet([]);
    expect(result).toEqual([]);
  });
  test('should return all items when composite keys are correct [case < 100]', async () => {
    const keys = await setupCompositeKeyTestData(42);
    const result = await compositeModel.batchGet(keys);
    expect(result.length).toBe(42);
  });
  test('should return all items when composite keys are correct [case > 100]', async () => {
    const keys = await setupCompositeKeyTestData(642);
    const result = await compositeModel.batchGet(keys);
    expect(result.length).toBe(642);
  });
  test.todo('should throw if a key or key pair is invalid');
});
