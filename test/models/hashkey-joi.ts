/* eslint-disable import/no-unresolved,no-unused-vars,object-curly-newline */
import { object, string, number, boolean, array, any } from '@hapi/joi';
import Model from '../../src/base-model';
import documentClient from './common';
import { HashKeyEntity } from './hashkey';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class HashKeyJoiModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_hashkey';

  protected pk = 'hashkey';

  protected documentClient = documentClient;

  protected schema = object().keys({
    hashkey: string().required(),
    number: number().required(),
    bool: boolean(),
    string: string()
      .email()
      .required(),
    stringset: array().items(string()),
    list: array().items(any()),
    stringmap: object(),
  });
}
