import Model from "../../src";
import { HashKeyEntity } from "./hashkey";
import documentClient from './common';

interface TimeTrackedEntity {
    createdAt?: string;
    updatedAt?: string;
}

export default class TimeTrackedModel extends Model<HashKeyEntity & TimeTrackedEntity> {
    protected tableName = 'table_test_autoCreatedAt_autoUpdatedAt';

    protected pk = 'hashkey';

    protected documentClient = documentClient;

    protected autoCreatedAt = true;

    protected autoUpdatedAt = true;
}