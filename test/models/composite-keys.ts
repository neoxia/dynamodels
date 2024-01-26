import Model from '../../src/base-model';
import documentClient, { CommonFields } from './common';

export type CompositeKeyEntity = CommonFields & {
  [key: string]: unknown;
  hashkey: string;
  rangekey: string;
};

export default class CompositeKeyModel extends Model<CompositeKeyEntity> {
  protected tableName = 'table_test_composite_key';

  protected allowScan = true;

  protected pk = 'hashkey';

  protected sk = 'rangekey';

  protected documentClient = documentClient;
}
