import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Operation, IPaginatedResult } from './operation';

export class Scan<T> extends Operation<T> {
  protected params: DocumentClient.ScanInput;

  constructor(documentClient: DocumentClient, params: DocumentClient.ScanInput) {
    super(documentClient, params);
  }

  /**
   * Scan items in the limit of 1MB
   * @returns Fetched items, and pagination metadata
   */
  public async exec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.scan(this.params).promise();
    return this.buildResponse(result);
  }
}
