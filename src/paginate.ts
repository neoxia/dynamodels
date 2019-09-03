import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb';

export interface IPaginationOptions {
  lastEvaluatedKey?: Key;
  size: number;
}

export const paginate = (params: DocumentClient.ScanInput | DocumentClient.QueryInput, options: IPaginationOptions) => {
  if (options.lastEvaluatedKey) {
    params.ExclusiveStartKey = options.lastEvaluatedKey;
  } else {
    params.ExclusiveStartKey = null;
  }
  params.Limit = options.size;
};
