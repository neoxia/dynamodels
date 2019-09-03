import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IKeyConditions, buildKeyConditions } from './build-keys';
import { Operation, IPaginatedResult } from './operation';
import { KeyCondition } from './key-conditions';
import { IBuiltConditions } from './conditions';

export class Query<T> extends Operation<T> {
  protected params: DocumentClient.QueryInput;

  constructor(documentClient: DocumentClient, params: DocumentClient.QueryInput) {
    super(documentClient, params);
  }

  /**
   * Apply key condition to the query.
   * Only "equal" operator can be used for hashkey
   * If table has a composite key, other condition on range key can also be applied.
   * @param keyConditions : Key condition as an object of field => target value or field => { target_value, operator }
   */
  public keys(keyConditions: IKeyConditions): Query<T>;
  /**
   * Apply key condition to the query.
   * Only "equal" operator can be used for hashkey
   * If table has a composite key, other condition on range key can also be applied using and() helper method.
   * (e.g. query().keys(key('hashkey').eq('foo').and(key('rangekey').beginsWith('bar'))))
   * @param keyConditions : Key condition obtained by chaining key(), and() and key oeprators method helpers
   * eq(), le(), lt(), ge(), gt() and beginsWith()
   */
  public keys(keyConditions: KeyCondition): Query<T>;
  public keys(keyConditions: IKeyConditions | KeyCondition): Query<T> {
    let builtConditions: IBuiltConditions;
    if (keyConditions instanceof KeyCondition) {
      builtConditions = keyConditions.build();
    } else {
      builtConditions = buildKeyConditions(keyConditions);
    }
    this.params.KeyConditionExpression = builtConditions.expression;
    this.addExpressionAttributesName(builtConditions.attributes);
    this.addExpressionAttributesValue(builtConditions.values);
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

  /**
   * Whether the sort order should be ascending or descending.
   * Query is always sort on the table/index range key.
   * @param direction 'asc' or 'desc'
   */
  public sort(direction: 'asc' | 'desc'): Query<T> {
    this.params.ScanIndexForward = direction === 'desc' ? false : true;
    return this;
  }

  public async exec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.query(this.params).promise();
    return this.buildResponse(result);
  }
}
