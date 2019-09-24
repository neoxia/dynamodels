/* eslint-disable import/no-unresolved,no-unused-vars */
import documentClient, { CommonFields } from './common';
import Model from '../../src/base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

type NumericalKeyEntity = CommonFields & {
  hashkey: number;
  rangekey: number;
};

export default class NumericalKeysModel extends Model<NumericalKeyEntity> {
  protected tableName = 'table_test_numerical_composite_key';

  protected pk = 'hashkey';

  protected sk = 'rangekey';

  protected documentClient = documentClient;
}
