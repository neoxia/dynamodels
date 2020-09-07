/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { IKeyConditions, buildKeyConditions, IFilterConditions } from './build-keys';
import { IBuiltConditions } from './conditions';
import { KeyCondition } from './key-conditions';
import Operation, { IPaginatedResult } from './operation';
import { FilterCondition } from './filter-conditions';
import { IPaginationOptions } from './paginate';
/* eslint-enable import/no-unresolved,no-unused-vars */

const isFuild = (keyConditions: IKeyConditions | KeyCondition): keyConditions is KeyCondition =>
  keyConditions instanceof KeyCondition;

export default class Query<T> extends Operation<T> {
  protected params: DocumentClient.QueryInput;

  /**
   * Apply key condition to the query.
   * Only "equal" operator can be used for hashkey
   * If table has a composite key, other condition on range key can also be applied using and()
   *  helper method.
   * (e.g. query().keys(key('hashkey').eq('foo').and(key('rangekey').beginsWith('bar'))))
   * @param keyConditions : Key condition as an object of field => target value or
   * field => { target_value, operator } OR Key condition obtained by chaining key(),
   * and() and key oeprators method helpers
   * eq(), le(), lt(), ge(), gt() and beginsWith()
   */
  public keys(keyConditions: IKeyConditions | KeyCondition): Query<T> {
    let builtConditions: IBuiltConditions;
    if (isFuild(keyConditions)) {
      builtConditions = keyConditions.build();
    } else {
      builtConditions = buildKeyConditions(keyConditions);
    }
    this.params.KeyConditionExpression = builtConditions.expression;
    this.addExpressionAttributes(builtConditions.attributes, 'name');
    this.addExpressionAttributes(builtConditions.values, 'value');
    return this;
  }

  /**
   * Perofrm query using a specified index
   * @param name : the name of the index to use
   */
  public index(name: string): Query<T> {
    this.params.IndexName = name;
    return this;
  }

  public consistent(isConsistent?: boolean): Query<T> {
    this.doConsistent(isConsistent);
    return this;
  }

  public filter(filterConditions: IFilterConditions | FilterCondition): Query<T> {
    this.doFilter(filterConditions);
    return this;
  }

  public paginate(options: IPaginationOptions): Query<T> {
    this.doPaginate(options);
    return this;
  }

  /**
   * Whether the sort order should be ascending or descending.
   * Query is always sort on the table/index range key.
   * @param direction 'asc' or 'desc'
   */
  public sort(direction: 'asc' | 'desc'): Query<T> {
    this.params.ScanIndexForward = direction === 'desc';
    return this;
  }

  public async doExec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.query(this.params).promise();
    return this.buildResponse(result);
  }
}
