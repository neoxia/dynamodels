/* eslint-env node, jest */
/* eslint-disable import/no-unresolved,no-unused-vars */
import CompositeKeyModel, { CompositeKeyEntity } from './models/composite-keys';
import { clearTables } from './hooks/create-tables';
import generateData from './factories';
import HashKeyModel, { HashKeyEntity } from './models/hashkey';
/* eslint-enable import/no-unresolved,no-unused-vars */

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const data: { hashkey: HashKeyEntity[]; compositekey: CompositeKeyEntity[] } = {
  hashkey: null,
  compositekey: null,
};
const compositeModel = new CompositeKeyModel();
const hashModel = new HashKeyModel();

describe('The batch get method', () => {
  beforeAll(() => {
    beforeAll(async () => {});
  });
  test.skip('should return all items when hash keys are corect [case < 100]', async () => {
    const nbEntries = 42;
    await clearTables();
    await generateData(hashModel, nbEntries);
    await timeout(500);
    data.hashkey = await hashModel
      .scan()
      .consistent()
      .execAll();
    const result = await hashModel.batchGet(data.hashkey.map((d) => d.hashkey));

    expect(result.length).toBe(nbEntries);
  });
  test.skip('should return all items when hash keys are corect [case > 100]', async () => {
    const nbEntries = 101;
    await clearTables();
    await generateData(hashModel, nbEntries);
    await timeout(500);
    data.hashkey = await hashModel
      .scan()
      .consistent()
      .execAll();
    const result = await hashModel.batchGet(data.hashkey.map((d) => d.hashkey));

    expect(result.length).toBe(nbEntries);
  });
  test('should return all items when composite keys are corect [case < 100]', async () => {
    const nbEntries = 42;
    await clearTables();
    await generateData(compositeModel, nbEntries);
    data.compositekey = await compositeModel
      .scan()
      .consistent()
      .execAll();
    const result = await compositeModel.batchGet(
      data.compositekey.map((d) => ({ pk: d.hashkey, sk: d.rangekey })),
    );
    expect(result.length).toBe(nbEntries);
  });
  test('should return all items when composite keys are corect [case > 100]', async () => {
    const nbEntries = 642;
    await clearTables();
    await generateData(compositeModel, nbEntries);
    data.compositekey = await compositeModel
      .scan()
      .consistent()
      .execAll();
    const result = await compositeModel.batchGet(
      data.compositekey.map((d) => ({ pk: d.hashkey, sk: d.rangekey })),
    );
    expect(result.length).toBe(nbEntries);
  });
  test.todo('should throw if a key or key pair is invalid');
});
