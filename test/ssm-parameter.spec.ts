import Model from "../src";
import {HashKeyEntity} from "./models/hashkey";
import documentClient from "./models/common";

export default class TestClass<HashKeyEntity> extends Model<HashKeyEntity> {
    protected tableName = 'table_test_hashkey';

    protected pk = 'hashkey';

    protected documentClient = documentClient;
}

describe("The ssm-parameter feature ", () => {
    test('should verify tableName exists as a getter', () => {
        const model: TestClass<HashKeyEntity> = new TestClass<HashKeyEntity>();
        expect(model.getTableName).toBeDefined();
    });
})