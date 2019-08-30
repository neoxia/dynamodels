import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export interface IPaginationOptions {
  lastEvaluatedKey: any;
  size: number;
}

export const paginate = (params: DocumentClient.ScanInput | DocumentClient.QueryInput, options: IPaginationOptions) => {
  params.ExclusiveStartKey = options.lastEvaluatedKey;
  params.Limit = options.size;
};
