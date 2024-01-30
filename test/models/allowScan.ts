import Model from "../../src";
import { HashKeyEntity } from "./hashkey";
import documentClient from './common';

export default class AllowScanModel extends Model<HashKeyEntity> {
    protected tableName = 'table_test_allowScan';

    protected allowScan = false;

    protected pk = 'hashkey';

    protected documentClient = documentClient;
}