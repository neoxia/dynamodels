import { clearTables } from './hooks/create-tables';
import HashKeyModel, { HashKeyEntity } from './models/hashkey';
import CompositeKeyModel, { CompositeKeyEntity } from './models/composite-keys';
import { generateItems, hashOnly } from './factories';
import { KeyValue } from '../src/base-model';
import TimeTrackedModel from './models/autoCreatedAt-autoUpdatedAt';



const hashModel = new HashKeyModel();
const compositeModel = new CompositeKeyModel();
const timeTrackedModel = new TimeTrackedModel();


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


describe('The batchWrite method', () => {
    beforeEach(async () => {
        await clearTables();
    });

    test('should put a batch of items and delete a batch of items by their hashkeys', async () => {
        const toSave = generateItems(50) as HashKeyEntity[];
        const toDelete = await setupTestData(50);
        await hashModel.batchWrite({ put: toSave, delete: toDelete });
        const deleteResult = await hashModel.batchGet(toDelete);
        const putResult = await hashModel.batchGet(toSave.map(item => item.hashkey));
        expect(deleteResult.length).toBe(0);
        expect(putResult.length).toBe(50);
    });

    test('should put a batch of items and delete a batch of items by their compositekeys', async () => {
        const toSave = generateItems(50) as CompositeKeyEntity[];
        const toDelete = await setupCompositeKeyTestData(50);
        await compositeModel.batchWrite({ put: toSave, delete: toDelete });
        const deleteResult = await compositeModel.batchGet(toDelete);
        const putResult = await compositeModel.batchGet(toSave.map(item => ({ pk: item.hashkey, sk: item.rangekey })));
        expect(deleteResult.length).toBe(0);
        expect(putResult.length).toBe(50);
    });

    test('should put and delete a batch of items', async () => {
        const toSave = generateItems(50) as HashKeyEntity[];
        const keys = await setupTestData(50);
        const toDelete = await hashModel.batchGet(keys);
        await hashModel.batchWrite({ put: toSave, delete: toDelete });
        const putResult = await hashModel.batchGet(toSave.map(item => item.hashkey));
        const deleteResult = await hashModel.batchGet(keys);
        expect(deleteResult.length).toBe(0);
        expect(putResult.length).toBe(50);
    });

})

describe('The batchDelete method', () => {
    beforeEach(async () => {
        await clearTables();
    });

    test('should delete a batch of items by their hashkeys', async () => {
        const keys = await setupTestData(50);
        await hashModel.batchDelete(keys)
        const result = await hashModel.batchGet(keys);
        expect(result.length).toBe(0);
    })

    test('should delete a batch of items by their compositekeys', async () => {
        const keys = await setupCompositeKeyTestData(50);
        await compositeModel.batchDelete(keys);
        const result = await compositeModel.batchGet(keys);
        expect(result.length).toBe(0);
    })

    test('should delete a batch of items', async () => {
        const keys = await setupTestData(50);
        const toDelete = await hashModel.batchGet(keys);
        await hashModel.batchDelete(toDelete);
        const deleteResult = await hashModel.batchGet(keys);
        expect(deleteResult.length).toBe(0);
    })
})

describe('The batchCreate method', () => {
    beforeEach(async () => {
        await clearTables();
    });

    test('should throw an error if hash key is not given', async () => {
        let toSave = generateItems(50) as HashKeyEntity[];
        toSave = toSave.map(item => {
            const { hashkey, ...rest } = item;
            return rest;
        }) as HashKeyEntity[];
        try {
            await hashModel.batchCreate(toSave);
        } catch (e) {
            expect((e as Error).message.includes('One of the required keys is missing')).toBe(true);
        }
    })

    test('should throw an error if range key is not given', async () => {
        let toSave = generateItems(2) as CompositeKeyEntity[];
        toSave = toSave.map(item => {
            const { rangekey, ...rest } = item;
            return rest;
        }) as CompositeKeyEntity[];
        try {
            await compositeModel.batchCreate(toSave);
        } catch (e) {
            expect((e as Error).message.includes('One of the required keys is missing')).toBe(true);
        }
    })

    test('should put a batch of items', async () => {
        const toSave = generateItems(50) as HashKeyEntity[];
        await hashModel.batchCreate(toSave);
        const putResult = await hashModel.batchGet(toSave.map(item => item.hashkey));
        const allHaveUpdatedAtProperty = putResult.every(item => item.hasOwnProperty('updatedAt'));
        expect(putResult.length).toBe(50);
        expect(allHaveUpdatedAtProperty).toBe(false);
    })

    test('should put a batch of items and add the updatedAt field when autoUpdatedAt is enabled', async () => {
        const toSave = generateItems(50) as HashKeyEntity[];
        await timeTrackedModel.batchCreate(toSave);
        const putResult = await timeTrackedModel.batchGet(toSave.map(item => item.hashkey));
        const allHaveUpdatedAtProperty = putResult.every(item => item.hasOwnProperty('updatedAt'));
        expect(putResult.length).toBe(50);
        expect(allHaveUpdatedAtProperty).toBe(true);
    })
})