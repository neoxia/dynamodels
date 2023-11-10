import Model, { UpToDateEntity } from '../../src/base-model';
import documentClient from './common';
import { HashKeyEntity } from './hashkey';

export default class HashKeyUpToDateModel extends Model<HashKeyEntity & UpToDateEntity> {
  protected tableName = 'table_test_hashkey';

  protected pk = 'hashkey';

  protected documentClient = documentClient;

  protected autoCreatedAt = true;

  protected autoUpdatedAt = true;
}
