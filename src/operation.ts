/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { IFilterConditions, buildFilterConditions } from './build-keys';
import { FilterCondition } from './filter-conditions';
import paginate, { IPaginationOptions } from './paginate';
import { IBuiltConditions } from './conditions';
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

  constructor(
    documentClient: DocumentClient,
    params: DocumentClient.QueryInput | DocumentClient.ScanInput,
  ) {
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
  public filter(filterConditions: IFilterConditions): Operation<T>;

  /**
   * Apply filters to the scan/query operation
   * @param filterConditions The filter condition as the result of chainable attr(),
   * or(), and(), not() and operator helpers calls.
   * @returns The filtered query/scan
   */
  public filter(filterConditions: FilterCondition): Operation<T>;

  public filter(filterConditions: IFilterConditions | FilterCondition): Operation<T> {
    let builtConditions: IBuiltConditions;
    if (filterConditions instanceof FilterCondition) {
      builtConditions = filterConditions.build();
    } else {
      builtConditions = buildFilterConditions(filterConditions);
    }
    this.params.FilterExpression = builtConditions.expression;
    this.addExpressionAttributesName(builtConditions.attributes);
    this.addExpressionAttributesValue(builtConditions.values);
    return this;
  }

  /**
   * Make the scan/query operation read-consistent
   * @param isConsistent (Optional) whether or not the operation should
   * be read-consistent. true if ommited.
   * The modified query/scan operation
   */
  public consistent(isConsistent?: boolean): Operation<T> {
    this.params.ConsistentRead = isConsistent == null ? true : isConsistent;
    return this;
  }

  /**
   * Enable pagination for scan/query operation
   * @param options The size of the page and the exclusive start key
   * @returns The paginate query
   */
  public paginate(options: IPaginationOptions): Operation<T> {
    this.page = options;
    Object.assign(this.params, paginate(options));
    return this;
  }

  public projection(
    fields: Array<string | { list: string; index: number } | { map: string; key: string }>,
  ): Operation<T> {
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
    this.addExpressionAttributesName(attributes);
    return this;
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

  protected addExpressionAttributesName(attributes: DocumentClient.ExpressionAttributeNameMap) {
    if (Object.keys(attributes).length > 0) {
      if (!this.params.ExpressionAttributeNames) {
        this.params.ExpressionAttributeNames = {};
      }
      Object.assign(this.params.ExpressionAttributeNames, attributes);
    }
  }

  protected addExpressionAttributesValue(values: DocumentClient.ExpressionAttributeValueMap) {
    if (Object.keys(values).length > 0) {
      if (!this.params.ExpressionAttributeValues) {
        this.params.ExpressionAttributeValues = {};
      }
      Object.assign(this.params.ExpressionAttributeValues, values);
    }
  }

  public abstract async exec(): Promise<IPaginatedResult<T>>;

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
      const result = await this.exec();
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    return items as T[];
  }

  public getParams(): DocumentClient.ScanInput {
    return this.params;
  }
}
