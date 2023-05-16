import { IFilterConditions, buildFilterConditions } from './build-keys';
import { FilterCondition } from './filter-conditions';
import paginate, { IPaginationOptions } from './paginate';
import { IBuiltConditions } from './conditions';
import PaginationMode from './paginate-mode';
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { KeyValue } from './base-model';

export interface IPaginatedResult<T> {
  items: T[];
  nextPage: IPaginationOptions;
  count: number | undefined;
}

export type PageReceivedHook<T> = (page: IPaginatedResult<T>) => void;

export default abstract class Operation<T extends Record<string, unknown>> {
  protected documentClient: DynamoDBDocumentClient;

  protected params: QueryCommandInput | ScanCommandInput;

  protected page: IPaginationOptions | undefined;

  private readonly pk: string;

  private readonly sk: string | undefined;

  protected constructor(
    documentClient: DynamoDBDocumentClient,
    params: QueryCommandInput | ScanCommandInput,
    pk: string,
    sk?: string,
  ) {
    this.pk = pk;
    this.sk = sk;
    this.documentClient = documentClient;
    this.params = params;
  }

  /**
   * Apply filters to the scan/query operation
   * @param filterConditions The filter condition as an object where keys are fields
   * and value the targeted value
   * for this field. In this case an equal 'EQ' operation is done. Value can also be
   *  a call to an operator
   * helper to perform something than an equal.
   * @returns The filtered query/scan
   */
  abstract filter(filterConditions: IFilterConditions): Operation<T>;

  /**
   * Apply filters to the scan/query operation
   * @param filterConditions The filter condition as the result of chainable attr(),
   * or(), and(), not() and operator helpers calls.
   * @returns The filtered query/scan
   */
  abstract filter(filterConditions: FilterCondition): Operation<T>;

  abstract filter(filterConditions: IFilterConditions | FilterCondition): Operation<T>;

  protected doFilter(filterConditions: IFilterConditions | FilterCondition): void {
    let builtConditions: IBuiltConditions;
    if (filterConditions instanceof FilterCondition) {
      builtConditions = filterConditions.build();
    } else {
      builtConditions = buildFilterConditions(filterConditions);
    }
    this.params.FilterExpression = builtConditions.expression;
    this.addExpressionAttributes(builtConditions.attributes, 'names');
    this.addExpressionAttributes(builtConditions.values, 'values');
  }

  /**
   * Set the scan/query operation number of items to return
   * @param limit the number of element to return
   * @returns the modified query/scan operation
   */
  abstract limit(limit: number): Operation<T>;

  protected doLimit(limit: number): void {
    const isValid = Number.isInteger(Number(limit));
    this.params.Limit = isValid ? Number(limit) : undefined;
  }

  /**
   * Make the scan/query operation read-consistent
   * @param isConsistent (Optional) regardless of whether the operation should
   * be read-consistent. true if omitted.
   * The modified query/scan operation
   */
  abstract consistent(isConsistent?: boolean): Operation<T>;

  protected doConsistent(isConsistent?: boolean): void {
    this.params.ConsistentRead = isConsistent == null ? true : isConsistent;
  }

  /**
   * Enable pagination for scan/query operation
   * @param options The size of the page and the exclusive start key
   * @returns The paginate query
   */
  abstract paginate(options: IPaginationOptions): Operation<T>;

  protected doPaginate(options: IPaginationOptions): void {
    this.page = options ? { ...options } : { size: 100 };
    if (this.page.mode == null) {
      this.page.mode = PaginationMode.NATIVE;
    }
    if (this.page.mode === PaginationMode.NATIVE) {
      Object.assign(this.params, paginate(options));
    }
  }

  projection(
    fields: Array<string | { list: string; index: number } | { map: string; key: string }>,
  ): Operation<T> {
    this.doProject(fields);
    return this;
  }

  protected doProject(
    fields: Array<string | { list: string; index: number } | { map: string; key: string }>,
  ): void {
    const attributes: Record<string, unknown> = {};
    const expression = fields.map((f) => {
      if (typeof f === 'string') {
        attributes[`#${f}`] = f;
        return `#${f}`;
      }
      if ((f as { list: string; index: number }).list !== undefined) {
        const l = f as { list: string; index: number };
        attributes[`#${l.list}`] = l.list;
        return `#${l.list}[${l.index}]`;
      }
      if ((f as { map: string; key: string }).map !== undefined) {
        const m = f as { map: string; key: string };
        attributes[`#${m.map}`] = m.map;
        return `#${m.map}.${m.key}`;
      }
      return '';
    });
    this.params.ProjectionExpression = expression.join(', ');
    this.addExpressionAttributes(attributes, 'names');
  }

  protected buildResponse(result: QueryCommandOutput | ScanCommandOutput): IPaginatedResult<T> {
    return {
      items: result.Items as T[],
      count: result.Count,
      nextPage: {
        lastEvaluatedKey: result.LastEvaluatedKey,
        size: this.page != null ? this.page.size : undefined,
      },
    };
  }

  protected addExpressionAttributes(attributes: Record<string, unknown>, type: 'names' | 'values') {
    if (Object.keys(attributes).length > 0) {
      const key = type === 'names' ? 'ExpressionAttributeNames' : 'ExpressionAttributeValues';
      const map: Record<string, string> = this.params[key] ?? {};
      Object.assign(map, attributes);
      this.params[key] = map;
    }
  }

  protected abstract doExec(): Promise<IPaginatedResult<T>>;

  async exec(): Promise<IPaginatedResult<T>> {
    if (!this.page || this.page.mode === PaginationMode.NATIVE) {
      return this.doExec();
    }
    // Constant page size pagination mode
    const items: T[] = [];
    const size = this.page.size || 100;
    this.params.Limit = size;
    let count = 0;
    let lastKey = this.page.lastEvaluatedKey;
    do {
      this.params.ExclusiveStartKey = lastKey;
      // Necessary to have lastEvaluatedKey
      /* eslint-disable-next-line no-await-in-loop */
      const result = await this.doExec();
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
      count += result.count ?? 0;
    } while (lastKey != null && items.length < size);
    let lastEvaluatedKey: Record<string, KeyValue> | undefined = lastKey;
    if (items.length > size && items[size - 1]) {
      const lastEvaluatedItem: T = items[size - 1];
      lastEvaluatedKey = {};
      lastEvaluatedKey[this.pk] = lastEvaluatedItem[this.pk] as KeyValue;
      if (this.sk) {
        lastEvaluatedKey[this.sk] = lastEvaluatedItem[this.sk] as KeyValue;
      }
    }
    return {
      count,
      items: items.slice(0, size),
      nextPage: {
        lastEvaluatedKey,
        size,
      },
    };
  }

  /**
   * Fetch all results beyond the 1MB scan/query of single operation limits.
   * By iteratively fetching next 1MB page of results until last evaluated key is null
   * @returns All the results
   */
  async execAll(onPageReceived?: PageReceivedHook<T>): Promise<T[]> {
    let lastKey = undefined;
    const items = [];
    do {
      this.params.ExclusiveStartKey = lastKey;
      // Necessary to have lastEvaluatedKey
      const page = await this.doExec();
      items.push(...page.items);
      lastKey = page.nextPage.lastEvaluatedKey;
      if (onPageReceived) {
        onPageReceived(page);
      }
    } while (lastKey != null);
    return items as T[];
  }

  /**
   * Count all result for the scan or query operation.
   * Count is used, and not ScannedCount, so it is the count
   * after the filters are applied.
   * @returns the operation count
   */
  async count(): Promise<number> {
    let lastKey = undefined;
    let count = 0;
    this.params.Select = 'COUNT';
    do {
      this.params.ExclusiveStartKey = lastKey;
      // Necessary to have lastEvaluatedKey
      const result = await this.doExec();
      count += result.count ?? 0;
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    this.params.Select = undefined;
    return count;
  }

  /**
   * Execute the query and return the first result matching the query criteria
   * @returns the first matching element
   */
  async first(): Promise<T> {
    this.params.Limit = 1;
    const result = await this.doExec();
    return result.items[0];
  }

  getParams(): ScanCommandInput | QueryCommandInput {
    return this.params;
  }
}
