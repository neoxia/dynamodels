import Model from '../../src/base-model';
import documentClient, { CommonFields } from './common';

export type HashKeyEntity = CommonFields & {
  hashkey: string;
};

export default class HashKeyModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_hashkey';

  protected pk = 'hashkey';

  protected documentClient = documentClient;
}
