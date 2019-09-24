/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Model from '../../src/base-model';
import documentClient, { CommonFields } from './common';
/* eslint-enable import/no-unresolved,no-unused-vars */

export type HashKeyEntity = CommonFields & {
  hashkey: string;
};

export default class HashKeyModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_hashkey';

  protected pk = 'hashkey';

  protected documentClient: DocumentClient = documentClient;
}
