/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { IFilterConditions, buildFilterConditions } from './build-keys';
import { FilterCondition } from './filter-conditions';
import paginate, { IPaginationOptions } from './paginate';
import { IBuiltConditions } from './conditions';
import PaginationMode from './paginate-mode';
/* eslint-enable import/no-unresolved,no-unused-vars */

export interface IPaginatedResult<T> {
  items: T[];
  nextPage: IPaginationOptions;
  count: number;
}

export default abstract class Operation<T> {
  protected documentClient: DocumentClient;

  protected params: DocumentClient.QueryInput | DocumentClient.ScanInput;

  protected page: IPaginationOptions;

  private pk: string;

  private sk: string;

  constructor(
    documentClient: DocumentClient,
    params: DocumentClient.QueryInput | DocumentClient.ScanInput,
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
  public abstract filter(filterConditions: IFilterConditions): Operation<T>;

  /**
   * Apply filters to the scan/query operation
   * @param filterConditions The filter condition as the result of chainable attr(),
   * or(), and(), not() and operator helpers calls.
   * @returns The filtered query/scan
   */
  public abstract filter(filterConditions: FilterCondition): Operation<T>;

  public abstract filter(filterConditions: IFilterConditions | FilterCondition): Operation<T>;

  protected doFilter(filterConditions: IFilterConditions | FilterCondition): void {
    let builtConditions: IBuiltConditions;
    if (filterConditions instanceof FilterCondition) {
      builtConditions = filterConditions.build();
    } else {
      builtConditions = buildFilterConditions(filterConditions);
    }
    this.params.FilterExpression = builtConditions.expression;
    this.addExpressionAttributes(builtConditions.attributes);
    this.addExpressionAttributes(builtConditions.values);
  }

  /**
   * Make the scan/query operation read-consistent
   * @param isConsistent (Optional) whether or not the operation should
   * be read-consistent. true if ommited.
   * The modified query/scan operation
   */
  public abstract consistent(isConsistent?: boolean): Operation<T>;

  protected doConsistent(isConsistent?: boolean): void {
    this.params.ConsistentRead = isConsistent == null ? true : isConsistent;
  }

  /**
   * Enable pagination for scan/query operation
   * @param options The size of the page and the exclusive start key
   * @returns The paginate query
   */
  public abstract paginate(options: IPaginationOptions): Operation<T>;

  protected doPaginate(options: IPaginationOptions): void {
    this.page = options ? { ...options } : { size: 100 };
    if (this.page.mode == null) {
      this.page.mode = PaginationMode.NATIVE;
    }
    if (this.page.mode === PaginationMode.NATIVE) {
      Object.assign(this.params, paginate(options));
    }
  }

  public projection(
    fields: Array<string | { list: string; index: number } | { map: string; key: string }>,
  ): Operation<T> {
    this.doProject(fields);
    return this;
  }

  protected doProject(
    fields: Array<string | { list: string; index: number } | { map: string; key: string }>,
  ): void {
    const attributes: DocumentClient.ExpressionAttributeNameMap = {};
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
    this.addExpressionAttributes(attributes);
  }

  protected buildResponse(
    result: DocumentClient.QueryOutput | DocumentClient.ScanOutput,
  ): IPaginatedResult<T> {
    return {
      items: result.Items as T[],
      count: result.Count,
      nextPage: {
        lastEvaluatedKey: result.LastEvaluatedKey,
        size: this.page != null ? this.page.size : undefined,
      },
    };
  }

  protected addExpressionAttributes(
    attributes:
      | DocumentClient.ExpressionAttributeNameMap
      | DocumentClient.ExpressionAttributeValueMap,
  ) {
    if (Object.keys(attributes).length > 0) {
      if (!this.params.ExpressionAttributeNames) {
        this.params.ExpressionAttributeNames = {};
      }
      Object.assign(this.params.ExpressionAttributeNames, attributes);
    }
  }

  protected abstract async doExec(): Promise<IPaginatedResult<T>>;

  public async exec(): Promise<IPaginatedResult<T>> {
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
      count += result.count;
    } while (lastKey != null && items.length < size);
    let lastEvaluatedKey = lastKey;
    if (items.length > size && items[size - 1]) {
      const lastEvaluatedItem = items[size - 1] as any;
      lastEvaluatedKey = {};
      lastEvaluatedKey[this.pk] = lastEvaluatedItem[this.pk];
      if (this.sk) {
        lastEvaluatedKey[this.sk] = lastEvaluatedItem[this.sk];
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
  public async execAll(): Promise<T[]> {
    let lastKey = null;
    const items = [];
    do {
      this.params.ExclusiveStartKey = lastKey;
      // Necessary to have lastEvaluatedKey
      /* eslint-disable-next-line no-await-in-loop */
      const result = await this.doExec();
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    return items as T[];
  }

  /**
   * Count all result for the scan or query operation.
   * Count is used, and not ScannedCount, so it is the count
   * after the filters are applied.
   * @returns the operation count
   */
  public async count(): Promise<number> {
    let lastKey = null;
    let count = 0;
    this.params.Select = 'COUNT';
    do {
      this.params.ExclusiveStartKey = lastKey;
      // Necessary to have lastEvaluatedKey
      /* eslint-disable-next-line no-await-in-loop */
      const result = await this.doExec();
      count += result.count;
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    this.params.Select = null;
    return count;
  }

  public getParams(): DocumentClient.ScanInput | DocumentClient.QueryInput {
    return this.params;
  }
}
