/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Operation, { IPaginatedResult } from './operation';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class Scan<T> extends Operation<T> {
  protected params: DocumentClient.ScanInput;

  /**
   * Scan items in the limit of 1MB
   * @returns Fetched items, and pagination metadata
   */
  public async exec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.scan(this.params).promise();
    return this.buildResponse(result);
  }
}
