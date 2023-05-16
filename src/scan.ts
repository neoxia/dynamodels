import Operation, { IPaginatedResult } from './operation';
import { IPaginationOptions } from './paginate';
import { IFilterConditions } from './build-keys';
import { FilterCondition } from './filter-conditions';
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

export default class Scan<T extends Record<string, unknown>> extends Operation<T> {
  protected params: ScanCommandInput;

  constructor(
    documentClient: DynamoDBDocumentClient,
    params: QueryCommandInput | ScanCommandInput,
    pk: string,
    sk?: string,
  ) {
    super(documentClient, params, pk, sk);
    this.params = params;
  }

  public limit(limit: number): Scan<T> {
    this.doLimit(limit);
    return this;
  }

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
    const result = await this.documentClient.send(new ScanCommand(this.params));
    return this.buildResponse(result);
  }
}
