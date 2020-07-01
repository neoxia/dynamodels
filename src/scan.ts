/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Operation, { IPaginatedResult } from './operation';
import { IPaginationOptions } from './paginate';
import { IFilterConditions } from './build-keys';
import { FilterCondition } from './filter-conditions';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default class Scan<T> extends Operation<T> {
  protected params: DocumentClient.ScanInput;

  public consistent(isConsistent?: boolean): Scan<T> {
    this.doConsistent(isConsistent);
    return this;
  }

  public filter(filterConditions: IFilterConditions | FilterCondition): Scan<T> {
    this.doFilter(filterConditions);
    return this;
  }

  public paginate(options: IPaginationOptions): Scan<T> {
    this.doPaginate(options);
    return this;
  }

  /**
   * Scan items in the limit of 1MB
   * @returns Fetched items, and pagination metadata
   */
  public async doExec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.scan(this.params).promise();
    return this.buildResponse(result);
  }
}
