import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IKeyConditions, buildKeyConditions } from './build-keys';
import { Operation, IPaginatedResult } from './operation';

export class Query<T> extends Operation<T> {
  constructor(documentClient: DocumentClient, params: DocumentClient.QueryInput) {
    super(documentClient, params);
  }

  public keys(keyConditions: IKeyConditions) {
    this.params.KeyConditions = buildKeyConditions(keyConditions);
  }

  public sort(direction: 'asc' | 'desc') {
    this.params.ScanIndexForward = direction === 'desc' ? false : true;
  }

  public async exec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.query(this.params).promise();
    return this.buildResponse(result);
  }
}
