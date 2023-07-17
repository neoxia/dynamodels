import { IKeyConditions, buildKeyConditions, IFilterConditions } from './build-keys';
import { IBuiltConditions } from './conditions';
import { KeyCondition } from './key-conditions';
import Operation, { IPaginatedResult } from './operation';
import { FilterCondition } from './filter-conditions';
import { IPaginationOptions } from './paginate';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

const isFluid = (keyConditions: IKeyConditions | KeyCondition): keyConditions is KeyCondition =>
  keyConditions instanceof KeyCondition;

export default class Query<T> extends Operation<T> {
  protected params: QueryCommandInput;

  constructor(
    documentClient: DynamoDBDocumentClient,
    params: QueryCommandInput | ScanCommandInput,
    pk: string,
    sk?: string,
  ) {
    super(documentClient, params, pk, sk);
    this.params = params;
  }
  /**
   * Apply key condition to the query.
   * Only "equal" operator can be used for hashKey
   * If table has a composite key, other condition on range key can also be applied using and()
   *  helper method.
   * (e.g. query().keys(key('hashKey').eq('foo').and(key('rangeKey').beginsWith('bar'))))
   * @param keyConditions : Key condition as an object of field => target value or
   * field => { target_value, operator } OR Key condition obtained by chaining key(),
   * and() and key operators method helpers
   * eq(), le(), lt(), ge(), gt() and beginsWith()
   */
  public keys(keyConditions: IKeyConditions | KeyCondition): Query<T> {
    let builtConditions: IBuiltConditions;
    if (isFluid(keyConditions)) {
      builtConditions = keyConditions.build();
    } else {
      builtConditions = buildKeyConditions(keyConditions);
    }
    this.params.KeyConditionExpression = builtConditions.expression;
    this.addExpressionAttributes(builtConditions.attributes, 'names');
    this.addExpressionAttributes(builtConditions.values, 'values');
    return this;
  }

  /**
   * Performs query using a specified index
   * @param name: the name of the index to use
   */
  public index(name: string): Query<T> {
    this.params.IndexName = name;
    return this;
  }

  public limit(limit: number): Query<T> {
    this.doLimit(limit);
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
    // According to documentation ScanIndexForward must be true if ascending
    // @link https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
    this.params.ScanIndexForward = direction === 'asc';
    return this;
  }

  public async doExec(): Promise<IPaginatedResult<T>> {
    const result = await this.documentClient.send(new QueryCommand(this.params));
    return this.buildResponse(result);
  }
}
