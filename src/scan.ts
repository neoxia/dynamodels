import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Operation, IPaginatedResult } from './operation';

export class Scan<T> extends Operation<T> {
  constructor(documentClient: DocumentClient, params: DocumentClient.QueryInput) {
    super(documentClient, params);
  }

  public async exec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.scan(this.params).promise();
    return this.buildResponse(result);
  }
}
