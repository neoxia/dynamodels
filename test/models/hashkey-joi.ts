import joi from 'joi';
import Model from '../../src/base-model';
import documentClient from './common';
import { HashKeyEntity } from './hashkey';

export default class HashKeyJoiModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_hashkey';

  protected pk = 'hashkey';

  protected documentClient = documentClient;

  protected schema = joi.object().keys({
    hashkey: joi.string().required(),
    number: joi.number().required(),
    bool: joi.boolean(),
    string: joi.string().email().required(),
    stringset: joi.array().items(joi.string()),
    list: joi.array().items(joi.any()),
    stringmap: joi.object(),
  });
}
