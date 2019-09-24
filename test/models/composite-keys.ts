/* eslint-disable import/no-unresolved,no-unused-vars */
import Model from '../../src/base-model';
import documentClient, { CommonFields } from './common';
/* eslint-enable import/no-unresolved,no-unused-vars */

export type CompositeKeyEntity = CommonFields & {
  hashkey: string;
  rangekey: string;
};

export default class CompositeKeyModel extends Model<CompositeKeyEntity> {
  protected tableName = 'table_test_compositekey';

  protected pk = 'hashkey';

  protected sk = 'rangekey';

  protected documentClient = documentClient;
}
