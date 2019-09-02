import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IPaginationOptions, paginate } from './paginate';
import { IFilterConditions, buildFilterConditions } from './build-keys';

export interface IPaginatedResult<T> {
  items: T[];
  nextPage: IPaginationOptions;
  count: number;
}

export abstract class Operation<T> {
  protected documentClient: DocumentClient;
  protected params: DocumentClient.QueryInput;
  protected page: IPaginationOptions;

  constructor(documentClient: DocumentClient, params: DocumentClient.QueryInput) {
    this.documentClient = documentClient;
    this.params = params;
  }

  public filter(filterConditions: IFilterConditions) {
    this.params.QueryFilter = buildFilterConditions(filterConditions);
  }

  public paginate(options: IPaginationOptions) {
    this.page = options;
    paginate(this.params, options);
  }

  protected buildResponse(result: DocumentClient.QueryOutput | DocumentClient.ScanOutput): IPaginatedResult<T> {
    return {
      items: result.Items as T[],
      count: result.Count,
      nextPage: {
        lastEvaluatedKey: result.LastEvaluatedKey,
        size: this.page != null ? this.page.size : undefined,
      },
    };
  }

  public async exec(): Promise<IPaginatedResult<T>> {
    return;
  }

  public async execAll(): Promise<T[]> {
    let lastKey = null;
    const items = [];
    do {
      this.params.ExclusiveStartKey = lastKey;
      const result = await this.exec();
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    return items as T[];
  }
}
