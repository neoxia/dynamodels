import Joi from '@hapi/joi';
import { AWSError } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';

export type Key = string | number | Buffer;

export type Operator =
  | 'EQ'
  | 'NE'
  | 'IN'
  | 'LE'
  | 'LT'
  | 'GE'
  | 'GT'
  | 'BETWEEN'
  | 'NOT_NULL'
  | 'NULL'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'BEGINS_WITH';

export interface IQueryResult<T> {
  items: T[];
  nextPage: IPagination;
  count: number;
}

export type IScanResult<T> = IQueryResult<T>;

export type IKeyConditions = IKeySimpleConditions | IKeyComplexConditions;

export interface IKeyComplexConditions {
  [atributeName: string]: {
    operator?: Operator;
    values: Key[];
  };
}

export interface IKeySimpleConditions {
  [atributeName: string]: Key;
}

export interface IQueryOptions {
  keys: IKeyConditions;
  index?: string;
  page?: IPagination;
  filters?: IKeyConditions;
  sort?: 'asc' | 'desc';
}

export interface IScanOptions {
  page?: IPagination;
  filters?: IKeyConditions;
}

export interface IPagination {
  lastEvaluatedKey: any;
  size: number;
}

export interface IUpdateActions {
  [attributeName: string]: {
    action: 'ADD' | 'PUT' | 'DELETE';
    value: any;
  };
}

class ValidationError extends Error {
  details: Joi.ValidationError;
  constructor(message: string, details: Joi.ValidationError) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export abstract class Model<T> {
  protected tableName: string;
  protected item: T;
  protected pk: string;
  protected sk: string;
  protected documentClient: DocumentClient;
  protected schema: Joi.ObjectSchema;

  constructor(item?: T) {
    this.item = item;
    if (!this.tableName) {
      throw Error('No table name specified');
    }
    if (!this.pk) {
      throw Error('No hash key specified');
    }
    if (!this.documentClient) {
      this.documentClient = new DocumentClient();
    }
  }

  public setItem(item: T): void {
    this.item = item;
  }

  /**
   * Create the item hold by the class. Prevent overwritting of an existing item with the same key(s).
   * @param options Additional options supported by AWS document client put operation.
   */
  public async create(options?: Partial<DocumentClient.PutItemInput>): Promise<T>;
  /**
   * Create an item. Prevent overwritting of an existing item with the same key(s).
   * @param item The item to create
   * @param options Additional options supported by AWS document client put operation.
   */
  public async create(item: T, options?: Partial<DocumentClient.PutItemInput>): Promise<T>;
  public async create(
    item_options?: T | Partial<DocumentClient.PutItemInput>,
    options?: Partial<DocumentClient.PutItemInput>,
  ): Promise<T> {
    // Handle typescript method overloading
    const toCreate: T = item_options != null && this.isItem(item_options) ? item_options : this.item;
    const putOptions: Partial<DocumentClient.PutItemInput> =
      item_options != null && this.isItem(item_options) ? options : item_options;
    // Extract keys
    const pk = toCreate[this.pk];
    const sk = this.sk != null ? toCreate[this.sk] : null;
    // Prevent overwritting of existing item
    if (await this.exists(pk, sk)) {
      const error = new Error(`Item (hashkey=${pk}${sk != null ? `, rangekey= ${sk}` : ''}) already exists`);
      error.name = 'EALREADYEXISTS';
      throw error;
    }
    // Save item
    return this.save(toCreate, putOptions);
  }

  private isItem(item: T | any): item is T {
    return item[this.pk] !== undefined;
  }

  /**
   * Save the item hold by the class. Overwrite of an existing item with the same key(s) if it exists.
   * @param options Additional options supported by AWS document client put operation.
   */
  public async save(options?: Partial<DocumentClient.PutItemInput>): Promise<T>;
  /**
   * Save an item. Overwrite of an existing item with the same key(s) if it exists.
   * @param item The item to save
   * @param options Additional options supported by AWS document client put operation.
   */
  public async save(item: T, options?: Partial<DocumentClient.PutItemInput>): Promise<T>;
  public async save(
    item_options?: T | Partial<DocumentClient.PutItemInput>,
    options?: Partial<DocumentClient.PutItemInput>,
  ): Promise<T> {
    // Handle typescript method overloading
    const toSave: T = item_options != null && this.isItem(item_options) ? item_options : this.item;
    const putOptions: Partial<DocumentClient.PutItemInput> =
      item_options != null && this.isItem(item_options) ? options : item_options;
    // Validate item to put
    if (this.schema) {
      const { error } = Joi.validate(toSave, this.schema);
      if (error) {
        throw new ValidationError('Validation error', error);
      }
    }
    // Prepare putItem operation
    const params: DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: toSave,
    };
    // Overload putItem parameters with options given in arguments (if any)
    if (putOptions) {
      Object.assign(params, putOptions);
    }
    // Perform putItem operation
    await this.documentClient.put(params).promise();
    return toSave;
  }

  /**
   * Get a single item by hash key
   * @param pk : The hash key value
   * @param options : Additional options supported by AWS document client.
   * @returns The matching item
   */
  public async get(pk: Key, options?: Partial<DocumentClient.GetItemInput>): Promise<T>;
  /**
   * Get a single item by hash key and range key
   * @param pk : The hash key value
   * @param sk  : The range key value, if the table has a composite key
   * @param options : Additional options supported by AWS document client.
   * @returns The matching item
   */
  public async get(pk: Key, sk: Key, options?: Partial<DocumentClient.GetItemInput>): Promise<T>;
  public async get(
    pk: any,
    sk_options?: Partial<DocumentClient.GetItemInput> | Key,
    options?: Partial<DocumentClient.GetItemInput>,
  ): Promise<T> {
    // Handle method overloading
    const sk: Key = sk_options != null && this.isKey(sk_options) ? sk_options : null;
    const getOptions: Partial<DocumentClient.GetItemInput> =
      sk_options != null && this.isKey(sk_options) ? options : (sk_options as Partial<DocumentClient.GetItemInput>);
    // Prepare getItem operation
    this.testKeys(pk, sk);
    const params: DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
    };
    // Overload getItem parameters with options given in arguments (if any)
    if (options) {
      Object.assign(params, getOptions);
    }
    const result = await this.documentClient.get(params).promise();
    if (result && result.Item) {
      return result.Item as T;
    } else {
      return null;
    }
  }

  private testKeys(pk: Key, sk?: Key) {
    if (!pk) {
      throw Error(`Missing HashKey ${this.pk}=${pk}`);
    }
    if (this.sk != null && !sk) {
      throw Error(`Missing RangeKey ${this.sk}=${sk}`);
    }
  }

  private isKey(key: Key | Object): key is Key {
    return typeof key !== 'object' || key.constructor === Buffer;
  }

  /**
   * Check if an item exist by keys
   * @param pk : The hash key value
   * @param options : Additional options supported by AWS document client.
   * @returns true if item exists, false otherwise
   */
  public async exists(pk: Key, options?: Partial<DocumentClient.GetItemInput>): Promise<boolean>;
  /**
   * Check if an item exist by keys
   * @param pk : The hash key value
   * @param sk  : The range key value, if the table has a composite key
   * @param options : Additional options supported by AWS document client.
   * @returns true if item exists, false otherwise
   */
  public async exists(pk: Key, sk: Key, options?: Partial<DocumentClient.GetItemInput>): Promise<boolean>;
  public async exists(pk: Key, sk_options?: any, options?: Partial<DocumentClient.GetItemInput>): Promise<boolean> {
    const req = await this.get(pk, sk_options, options);
    return req != null;
  }

  /**
   * Delete a single item by key
   * @param pk : The hash key value
   * @param options : Additional options supported by AWS document client.
   * @returns  The item as it was before deletion and consumed capacity
   */
  public async delete(
    pk: Key,
    options?: Partial<DocumentClient.DeleteItemInput>,
  ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>;
  /**
   * Delete a single item by key
   * @param pk : The hash key value
   * @param sk  : The range key value, if the table has a composite key
   * @param options : Additional options supported by AWS document client.
   * @returns  The item as it was before deletion and consumed capacity
   */
  public async delete(
    pk: Key,
    sk: Key,
    options?: Partial<DocumentClient.DeleteItemInput>,
  ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>;
  public async delete(
    pk: Key,
    sk_options?: Key | Partial<DocumentClient.DeleteItemInput>,
    options?: Partial<DocumentClient.DeleteItemInput>,
  ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>> {
    // Handle method overloading
    const sk: Key = sk_options != null && this.isKey(sk_options) ? sk_options : null;
    const deleteOptions: Partial<DocumentClient.GetItemInput> =
      sk_options != null && this.isKey(sk_options) ? options : (sk_options as Partial<DocumentClient.DeleteItemInput>);
    // Build delete item params
    this.testKeys(pk, sk);
    const params: DocumentClient.DeleteItemInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
    };
    if (options) {
      Object.assign(params, deleteOptions);
    }
    return this.documentClient.delete(params).promise();
  }

  /**
   * Perform a scan operation on the table
   * @param options : Additional options supported by AWS document client.
   * @returns  The scanned items (in the 1MB single scan operation limit) and the last evaluated key
   */
  public async scan(): Promise<IScanResult<T>>;
  public async scan(
    scanOptions: IScanOptions,
    nativeOptions?: Partial<DocumentClient.ScanInput>,
  ): Promise<IScanResult<T>>;
  public async scan(nativeOptions: Partial<DocumentClient.ScanInput>): Promise<IScanResult<T>>;
  public async scan(
    scanOptions_nativeOptions?: IScanOptions | Partial<DocumentClient.ScanInput>,
    nativeOptions?: Partial<DocumentClient.ScanInput>,
  ): Promise<IScanResult<T>> {
    // Handle method overloading
    const scanOptions: IScanOptions =
      scanOptions_nativeOptions != null && this.isScanOptions(scanOptions_nativeOptions)
        ? scanOptions_nativeOptions
        : null;
    const options: Partial<DocumentClient.ScanInput> =
      scanOptions_nativeOptions != null && this.isScanOptions(scanOptions_nativeOptions)
        ? nativeOptions
        : (scanOptions_nativeOptions as Partial<DocumentClient.ScanInput>);
    // Building scan parameters
    const params: DocumentClient.ScanInput = {
      TableName: this.tableName,
    };
    if (scanOptions) {
      if (scanOptions.page) {
        params.ExclusiveStartKey = scanOptions.page.lastEvaluatedKey;
        params.Limit = scanOptions.page.size;
      }
      if (scanOptions.filters != null) {
        params.ScanFilter = this.buildKeyConditions(scanOptions.filters);
      }
    }
    if (options) {
      Object.assign(params, options);
    }
    const result = await this.documentClient.scan(params).promise();
    return {
      items: result.Items as T[],
      count: result.ScannedCount,
      nextPage: {
        lastEvaluatedKey: result.LastEvaluatedKey,
        size: scanOptions && scanOptions.page ? scanOptions.page.size : undefined,
      },
    };
  }

  private isScanOptions(options): options is IScanOptions {
    return (options as IScanOptions).filters !== undefined || (options as IScanOptions).page !== undefined;
  }

  /**
   * Scan all items in the table, even if it is larger than 1MB
   * @param options : Additional options supported by AWS document client.
   * @returns All the items in the table
   */
  public async scanAll(): Promise<T[]>;
  public async scanAll(scanOptions: IScanOptions, nativeOptions?: Partial<DocumentClient.ScanInput>): Promise<T[]>;
  public async scanAll(nativeOptions: Partial<DocumentClient.ScanInput>): Promise<T[]>;
  public async scanAll(
    scanOptions_nativeOptions?: IScanOptions | Partial<DocumentClient.ScanInput>,
    nativeOptions?: Partial<DocumentClient.ScanInput>,
  ): Promise<T[]> {
    // Handle method overloading
    const scanOptions: IScanOptions =
      scanOptions_nativeOptions != null && this.isScanOptions(scanOptions_nativeOptions)
        ? scanOptions_nativeOptions
        : null;
    const options: Partial<DocumentClient.ScanInput> =
      scanOptions_nativeOptions != null && this.isScanOptions(scanOptions_nativeOptions)
        ? nativeOptions
        : (scanOptions_nativeOptions as Partial<DocumentClient.ScanInput>);
    let lastKey = null;
    const items = [];
    do {
      const params: Partial<DocumentClient.ScanInput> = {
        ExclusiveStartKey: lastKey,
      };
      // Building scan parameters
      if (options) {
        Object.assign(params, options);
      }
      const result = await this.scan(scanOptions, params);
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    return items as T[];
  }

  /**
   * Peform a query operation.
   * @param options The query options expected by AWS document client.
   * @returns The items matching the keys conditions, in the limit of 1MB, and the last evaluated key.
   */
  public async query(
    queryOptions: IQueryOptions,
    nativeOptions?: Partial<DocumentClient.QueryInput>,
  ): Promise<IQueryResult<T>> {
    // Building query
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditions: {},
    };
    // Building key condition
    params.KeyConditions = this.buildKeyConditions(queryOptions.keys);
    if (queryOptions != null) {
      // Specifying index
      if (queryOptions.index != null) {
        params.IndexName = queryOptions.index;
      }
      // Building filter condition
      if (queryOptions.filters != null) {
        params.QueryFilter = this.buildKeyConditions(queryOptions.filters);
      }
      // Enable pagination
      if (queryOptions.page != null) {
        params.ExclusiveStartKey = queryOptions.page.lastEvaluatedKey;
        params.Limit = queryOptions.page.size;
      }
      // Enable sorting
      if (queryOptions.sort != null) {
        params.ScanIndexForward = queryOptions.sort === 'desc' ? false : true;
      }
    }
    Object.assign(params, nativeOptions);
    const result = await this.documentClient.query(params).promise();
    // Build response
    return {
      items: result.Items as T[],
      count: result.Count,
      nextPage: {
        lastEvaluatedKey: result.LastEvaluatedKey,
        size: queryOptions && queryOptions.page ? queryOptions.page.size : undefined,
      },
    };
  }

  private buildKeyConditions(keyConditions: IKeyConditions): DocumentClient.KeyConditions {
    const conditions: DocumentClient.KeyConditions = {};
    if (this.isComplexConditions(keyConditions)) {
      Object.keys(keyConditions).forEach((field) => {
        conditions[field] = {
          ComparisonOperator: keyConditions[field].operator != null ? keyConditions[field].operator : 'EQ',
          AttributeValueList: [keyConditions[field].values],
        };
      });
      return conditions;
    }
    Object.keys(keyConditions).forEach((field) => {
      conditions[field] = {
        ComparisonOperator: 'EQ',
        AttributeValueList: [keyConditions[field]],
      };
    });
    return conditions;
  }

  private isComplexConditions(keyConditions: IKeyConditions): keyConditions is IKeyComplexConditions {
    return Object.keys(keyConditions).some((field) => (keyConditions[field] as any).operator !== undefined);
  }

  /**
   * Peform a query operation and return all matching item, even it overcome 1MB single query operation limit.
   * @param options The query options expected by AWS document client.
   * @returns The items matching the keys conditions.
   */
  public async queryAll(queryOptions: IQueryOptions, nativeOptions?: Partial<DocumentClient.QueryInput>): Promise<T[]> {
    let lastKey = null;
    const items = [];
    do {
      const params: Partial<DocumentClient.QueryInput> = {
        ExclusiveStartKey: lastKey,
      };
      if (nativeOptions) {
        Object.assign(params, nativeOptions);
      }
      const result = await this.query(queryOptions, params);
      items.push(...result.items);
      lastKey = result.nextPage.lastEvaluatedKey;
    } while (lastKey != null);
    return items as T[];
  }

  /**
   * Perform a batch get operation in the limit of 100 items
   * @param keys : the keys of the items we want to retrieve
   * @param options : Additional options supported by AWS document client.
   * @returns the batch get operation result
   */
  public async batchGet(
    keys: Array<{ pk: any; sk?: any }>,
    options?: Partial<DocumentClient.BatchGetItemInput>,
  ): Promise<T[]> {
    const params: DocumentClient.BatchGetItemInput = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys.map((k) => this.buildKeys(k.pk, k.sk)),
        },
      },
    };
    if (options) {
      Object.assign(params, options);
    }
    const result = await this.documentClient.batchGet(params).promise();
    return result.Responses[this.tableName] as T[];
  }

  /**
   * Perform a batch get operation beyond the limit of 100 items.
   * If the is more than 100 items, the keys are automatically split in batch of 100 that
   * are run in parallel.
   * @param keys : the keys of the items we want to retrieve
   * @param options : Additional options supported by AWS document client.
   * @returns all the matching items
   */
  public async batchGetAll(
    keys: Array<{ pk: any; sk?: any }>,
    options?: Partial<DocumentClient.BatchGetItemInput>,
  ): Promise<T[]> {
    // Split these IDs in batch of 100 as it is AWS DynamoDB batchGetItems operation limit
    const batches: Array<Array<{ pk: any; sk?: any }>> = keys.reduce((all, one, idx) => {
      const chunk = Math.floor(idx / 100);
      all[chunk] = [].concat(all[chunk] || [], one);
      return all;
    }, []);
    // Perform the batchGet operation for each batch
    const responsesBatches: T[][] = await Promise.all(
      batches.map((batch: Array<{ pk: any; sk?: any }>) => {
        return this.batchGet(batch, options);
      }),
    );
    // Flatten batches of responses in array of users' data
    return responsesBatches.reduce((b1, b2) => b1.concat(b2), []);
  }

  public async update(
    pk: Key,
    actions: IUpdateActions,
  ): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>>;
  public async update(
    pk: Key,
    sk: Key,
    actions: IUpdateActions,
  ): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>>;
  public async update(
    pk: Key,
    sk_actions: Key | IUpdateActions,
    actions?: IUpdateActions,
  ): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>> {
    // Handle overloading
    const sk: Key = this.isKey(sk_actions) ? sk_actions : null;
    const updateActions: IUpdateActions = this.isKey(sk_actions) ? actions : sk_actions;
    // Build updateItem params
    this.testKeys(pk, sk);
    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
      AttributeUpdates: {},
    };
    Object.keys(updateActions).forEach((field) => {
      params.AttributeUpdates[field] = {
        Action: updateActions[field].action,
        Value: updateActions[field].value,
      };
    });
    return this.documentClient.update(params).promise();
  }

  private buildKeys(pk: any, sk?: any): DocumentClient.Key {
    const keys: DocumentClient.Key = {
      [this.pk]: pk,
    };
    if (this.sk) {
      keys[this.sk] = sk;
    }
    return keys;
  }
}
