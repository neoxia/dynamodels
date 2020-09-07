/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import PaginationMode from './paginate-mode';
import { Key } from './base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

export interface IPaginationOptions {
  mode?: PaginationMode;
  lastEvaluatedKey?: { [attribute: string]: Key };
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
