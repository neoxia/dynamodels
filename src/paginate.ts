import PaginationMode from './paginate-mode';
import { KeyValue } from './base-model';
import { QueryCommandInput, ScanCommandInput } from '@aws-sdk/lib-dynamodb';

export interface IPaginationOptions {
  mode?: PaginationMode;
  lastEvaluatedKey?: { [attribute: string]: KeyValue };
  size: number | undefined;
}

const paginate = (options: IPaginationOptions) => {
  const params: Partial<ScanCommandInput> | Partial<QueryCommandInput> = {};
  if (options.lastEvaluatedKey) {
    params.ExclusiveStartKey = options.lastEvaluatedKey;
  } else {
    params.ExclusiveStartKey = undefined;
  }
  params.Limit = options.size;
  return params;
};

export default paginate;
