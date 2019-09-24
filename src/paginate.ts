/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb';
/* eslint-enable import/no-unresolved,no-unused-vars */

export interface IPaginationOptions {
  lastEvaluatedKey?: Key;
  size: number;
}

const paginate = (options: IPaginationOptions) => {
  const params: Partial<DocumentClient.ScanInput> | Partial<DocumentClient.QueryInput> = {};
  if (options.lastEvaluatedKey) {
    params.ExclusiveStartKey = options.lastEvaluatedKey;
  } else {
    params.ExclusiveStartKey = null;
  }
  params.Limit = options.size;
  return params;
};

export default paginate;
