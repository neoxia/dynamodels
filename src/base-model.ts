import { ObjectSchema } from 'joi';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  BatchGetCommandInput,
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  QueryCommandInput,
  ScanCommandInput,
  TranslateConfig,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import Query from './query';
import Scan from './scan';
import { IUpdateActions, buildUpdateActions, put } from './update-operators';
import ValidationError from './validation-error';
import { PutCommandInput } from '@aws-sdk/lib-dynamodb/dist-types/commands/PutCommand';

export type KeyValue = string | number | Buffer | boolean | null;
type SimpleKey = KeyValue;
type CompositeKey = { pk: KeyValue; sk: KeyValue };
type Keys = SimpleKey[] | CompositeKey[];

const isComposite = (hashKeys_compositeKeys: Keys): hashKeys_compositeKeys is CompositeKey[] =>
  hashKeys_compositeKeys.length > 0 && (hashKeys_compositeKeys[0] as { pk: string } & unknown).pk !== undefined;

const isSimple = (hashKeys_compositeKeys: Keys): hashKeys_compositeKeys is SimpleKey[] => hashKeys_compositeKeys.length > 0 && Model.isKey(hashKeys_compositeKeys[0]);

export default abstract class Model<T> {
  protected tableName: string | undefined;

  protected item: T | undefined;

  protected pk: string | undefined;

  protected sk: string | undefined;

  protected documentClient: DynamoDBDocumentClient;

  protected schema: ObjectSchema | undefined;

  protected autoCreatedAt = false;

  protected autoUpdatedAt = false;

  constructor(item?: T, options?: DynamoDBClientConfig, translateConfig?: TranslateConfig) {
    this.item = item;
    const client = new DynamoDBClient(options ?? { region: process.env.AWS_REGION });
    this.documentClient = DynamoDBDocumentClient.from(
      client,
      translateConfig ?? {
        marshallOptions: { removeUndefinedValues: true },
      },
    );
  }

  static keyValue(item: unknown | undefined, key: string, type: 'range' | 'hash'): KeyValue {
    if (!item) {
      throw new Error(`Model error: tried to access ${type} key value on undefined`);
    }
    if (typeof item !== 'object') {
      throw new Error(`Model error: tried to access ${type} key of a non-object`);
    }
    const skValue = (item as Record<string, unknown>)[key];
    if (skValue === undefined) {
      throw new Error(
        `Model error: ${type} key "${key}" is not defined on ${JSON.stringify(item)}`,
      );
    }
    if (!this.isKey(skValue)) {
      throw new Error('Model error: ${type} key value is neither a primitive type nor Buffer');
    }
    return skValue as KeyValue;
  }

  static pkValue(item: unknown, pk?: string) {
    if (!pk) {
      throw new Error('Model error: hash key is not defined on this Model');
    }
    return this.keyValue(item, pk, 'hash');
  }

  static skValue(item: unknown, sk?: string) {
    if (!sk) {
      throw new Error('Model error: tried to access range key value on a non-composite model');
    }
    return this.keyValue(item, sk, 'range');
  }

  static isKey(key: unknown): key is KeyValue {
    return (
      key === null || ['string', 'boolean', 'number'].includes(typeof key) || Buffer.isBuffer(key)
    );
  }

  public setItem(item: T): void {
    this.item = item;
  }

  public getItem(): T | undefined {
    return this.item;
  }

  private isItem(item: unknown): item is T {
    try {
      this.pkValue(item as T);
      return true;
    } catch (e) {
      return false;
    }
  }

  private isValidItem(item: unknown): item is T {
    try {
      this.pkValue(item as T);
      if (!!this.sk) {
        this.skValue(item as T);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private pkValue(item: T): KeyValue {
    return Model.pkValue(item, this.pk);
  }

  private skValue(item: T): KeyValue {
    return Model.skValue(item, this.sk);
  }

  /**
   * Create the item hold by the class. Prevent overwriting of an existing
   * item with the same key(s).
   * @param options Additional options supported by AWS document client put operation.
   */
  async create(options?: Partial<PutCommandInput>): Promise<T>;

  /**
   * Create an item. Prevent overwriting of an existing item with the same key(s).
   * @param item The item to create
   * @param options Additional options supported by AWS document client put operation.
   */
  async create(item: T, options?: Partial<PutCommandInput>): Promise<T>;

  async create(
    item_options?: T | Partial<PutCommandInput>,
    options?: Partial<PutCommandInput>,
  ): Promise<T> {
    // Handle typescript method overloading
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const toCreate: T | undefined =
      item_options != null && this.isItem(item_options) ? item_options : this.item;
    if (!toCreate) {
      throw new Error(
        'No item to create, either pass it in Model.prototype.constructor or Model.prototype.create',
      );
    }
    const putOptions: Partial<PutCommandInput> | undefined =
      item_options != null && this.isItem(item_options)
        ? options
        : (item_options as Partial<PutCommandInput> | undefined);
    // Extract keys
    const pk = this.pkValue(toCreate);
    const sk: KeyValue | undefined = this.sk != null ? this.skValue(toCreate) : undefined;
    // Prevent overwriting of existing item
    if (await this.exists(pk, sk)) {
      const error = new Error(
        `Item (hashKey=${pk}${sk != null ? `, rangeKey= ${sk}` : ''}) already exists`,
      );
      error.name = 'E_ALREADY_EXISTS';
      throw error;
    }
    if (this.autoCreatedAt) {
      Object.assign(toCreate, { createdAt: new Date().toISOString() });
    }
    // Save item
    return this.save(toCreate, putOptions);
  }

  /**
   * Save the item hold by the class. Overwrite of an existing item with the same key(s)
   * if it exists.
   * @param options Additional options supported by AWS document client put operation.
   */
  async save(options?: Partial<PutCommandInput>): Promise<T>;

  /**
   * Save an item. Overwrite of an existing item with the same key(s) if it exists.
   * @param item The item to save
   * @param options Additional options supported by AWS document client put operation.
   */
  async save(item: T, options?: Partial<PutCommandInput>): Promise<T>;

  async save(
    item_options?: T | Partial<PutCommandInput>,
    options?: Partial<PutCommandInput>,
  ): Promise<T> {
    // Handle typescript method overloading
    const toSave: T | undefined =
      item_options != null && this.isItem(item_options) ? item_options : this.item;
    const putOptions: Partial<PutCommandInput> | undefined =
      item_options != null && this.isItem(item_options)
        ? options
        : (item_options as Partial<PutCommandInput> | undefined);
    // Validate item to put
    if (!toSave) {
      throw new Error(
        'No item to save, either pass it in Model.prototype.constructor or Model.prototype.save',
      );
    }
    if (this.schema) {
      const { error } = this.schema.validate(toSave);
      if (error) {
        throw new ValidationError('Validation error', error);
      }
    }
    if (this.autoUpdatedAt) {
      Object.assign(toSave, { updatedAt: new Date().toISOString() });
    }
    // Prepare putItem operation
    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: toSave,
    };
    // Overload putItem parameters with options given in arguments (if any)
    if (putOptions) {
      Object.assign(params, putOptions);
    }
    // Perform putItem operation
    await this.documentClient.send(new PutCommand(params));
    return toSave;
  }

  /**
   * Get a single item by hash key
   * @param pk: hash key value
   * @param options: Additional options supported by AWS document client.
   * @returns The matching item
   */
  async get(pk: KeyValue, options?: Partial<GetCommandInput>): Promise<T>;

  /**
   * Get a single item by hash key and range key
   * @param pk: The hash key value
   * @param sk: The range key value, if the table has a composite key
   * @param options: Additional options supported by AWS document client.
   * @returns The matching item
   */
  async get(pk: KeyValue, sk: KeyValue, options?: Partial<GetCommandInput>): Promise<T>;

  async get(
    pk: KeyValue,
    sk_options?: Partial<GetCommandInput> | KeyValue,
    options?: Partial<GetCommandInput>,
  ): Promise<T | null> {
    // Handle method overloading
    const sk: KeyValue = sk_options != null && Model.isKey(sk_options) ? sk_options : null;
    const getOptions = this.getOptions(sk_options, options);
    // Prepare getItem operation
    this.testKeys(pk, sk);
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
    };
    // Overload getItem parameters with options given in arguments (if any)
    if (options) {
      Object.assign(params, getOptions);
    }
    const result = await this.documentClient.send(new GetCommand(params));
    if (result && result.Item) {
      return result.Item as T;
    }
    return null;
  }

  private testKeys(
    pk: KeyValue | undefined,
    sk: KeyValue | undefined,
  ): { pk: KeyValue; sk?: KeyValue } {
    if (!pk) {
      throw Error(`Missing HashKey ${this.pk}=${pk}`);
    }
    if (this.sk != null && !sk) {
      throw Error(`Missing RangeKey ${this.sk}=${sk}`);
    }
    return { pk, sk };
  }

  /**
   * Check if an item exist by keys
   * @param pk: The hash key value
   * @param options: Additional options supported by AWS document client.
   * @returns true if item exists, false otherwise
   */
  async exists(pk: KeyValue, options?: Partial<GetCommandInput>): Promise<boolean>;

  /**
   * Check if an item exist by keys
   * @param pk: The hash key value
   * @param sk: The range key value, if the table has a composite key
   * @param options: Additional options supported by AWS document client.
   * @returns true if item exists, false otherwise
   */
  async exists(pk: KeyValue, sk?: KeyValue, options?: Partial<GetCommandInput>): Promise<boolean>;

  async exists(
    pk: KeyValue,
    sk_options?: Partial<GetCommandInput> | KeyValue,
    options?: Partial<GetCommandInput>,
  ): Promise<boolean> {
    // Typescript refuses to pass overloads methods arguments which is dumb IMHO as t is safe
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const req = await this.get(pk, sk_options, options);
    return req != null;
  }

  /**
   * Delete a single item by key
   * @param pk: The hash key value
   * @param options: Additional options supported by AWS document client.
   * @returns  The item as it was before deletion and consumed capacity
   */
  async delete(pk: KeyValue, options?: Partial<DeleteCommandInput>): Promise<DeleteCommandOutput>;

  async delete(item: T, options?: Partial<DeleteCommandInput>): Promise<DeleteCommandOutput>;
  /**
   * Delete a single item by key
   * @param pk: The hash key value
   * @param sk: The range key value, if the table has a composite key
   * @param options: Additional options supported by AWS document client.
   * @returns  The item as it was before deletion and consumed capacity
   */

  async delete(
    pk: KeyValue,
    sk: KeyValue,
    options?: Partial<DeleteCommandInput>,
  ): Promise<DeleteCommandOutput>;

  async delete(
    pk_item: KeyValue | T,
    sk_options?: KeyValue | Partial<DeleteCommandInput>,
    options?: Partial<DeleteCommandInput>,
  ): Promise<DeleteCommandOutput> {
    // Handle method overloading
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const _pk: KeyValue | undefined = Model.isKey(pk_item)
      ? pk_item
      : pk_item
        ? this.pkValue(pk_item)
        : undefined;
    const _sk: KeyValue = sk_options != null && Model.isKey(sk_options) ? sk_options : null;
    const deleteOptions = this.getOptions(sk_options, options);
    // Build delete item params
    const { pk, sk } = this.testKeys(_pk, _sk);
    if (!(await this.exists(pk, sk))) {
      throw new Error('Item to delete does not exists');
    }
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
    };
    if (options) {
      Object.assign(params, deleteOptions);
    }
    return this.documentClient.send(new DeleteCommand(params));
  }

  /**
   * Perform a scan operation on the table
   * @param options: Additional options supported by AWS document client.
   * @returns  The scanned items (in the 1MB single scan operation limit) and the last evaluated key
   */
  public scan(options?: Partial<ScanCommandInput>): Scan<T> {
    // Building scan parameters
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const params: ScanCommandInput = {
      TableName: this.tableName,
    };
    if (options) {
      Object.assign(params, options);
    }
    return new Scan(this.documentClient, params, this.pk, this.sk);
  }

  /**
   * Count all item of the table
   * Careful ! All the table will be scanned. This might be time-consuming.
   * @returns the number of items in the table
   */
  async count(): Promise<number> {
    return this.scan().count();
  }

  public query(index?: string): Query<T>;

  public query(options?: Partial<QueryCommandInput>): Query<T>;

  /**
   * Performs a query operation.
   * @param index The secondary index (LSI or GSI) on which perform query
   * @param options The query options expected by AWS document client.
   * @returns The items matching the keys conditions, in the limit of 1MB,
   * and the last evaluated key.
   */
  public query(index?: string, options?: Partial<QueryCommandInput>): Query<T>;

  public query(
    index_options?: string | Partial<QueryCommandInput>,
    options?: Partial<QueryCommandInput>,
  ): Query<T> {
    // Handle overloading
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const indexName: string | undefined =
      index_options != null && typeof index_options === 'string' ? index_options : undefined;
    const queryOptions: Partial<QueryCommandInput> | undefined =
      index_options != null && typeof index_options === 'string'
        ? options
        : (index_options as Partial<QueryCommandInput>);
    // Building query
    const params: QueryCommandInput = {
      TableName: this.tableName,
    };
    if (indexName) {
      params.IndexName = indexName;
    }
    if (queryOptions) {
      Object.assign(params, queryOptions);
    }
    return new Query(this.documentClient, params, this.pk, this.sk);
  }

  /**
   * Perform a batch get operation in the limit of 100 items
   * @param keys: the keys of the items we want to retrieve
   * @param options: Additional options supported by AWS document client.
   * @returns the batch get operation result
   */
  private async getSingleBatch(keys: Keys, options?: Partial<BatchGetCommandInput>): Promise<T[]> {
    let params: BatchGetCommandInput;
    if (!this.tableName) {
      throw new Error('Table name is not defined on your model');
    }
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    if (isComposite(keys)) {
      params = {
        RequestItems: {
          [this.tableName]: {
            Keys: keys.map((k) => this.buildKeys(k.pk, k.sk)),
          },
        },
      };
    } else {
      params = {
        RequestItems: {
          [this.tableName]: {
            Keys: keys.map((pk) => ({ [String(this.pk)]: pk })),
          },
        },
      };
    }
    if (options) {
      Object.assign(params, options);
    }
    const result = await this.documentClient.send(new BatchGetCommand(params));
    return result.Responses ? (result.Responses[this.tableName] as T[]) : [];
  }

  /**
   * Perform a batch get operation beyond the limit of 100 items.
   * If the is more than 100 items, the keys are automatically split in batch of 100 that
   * are run in parallel.
   * @param keys: the keys of the items we want to retrieve
   * @param options: Additional options supported by AWS document client.
   * @returns all the matching items
   */
  async batchGet(keys: Keys, options?: Partial<BatchGetCommandInput>): Promise<T[]> {
    if (keys.length === 0) {
      return [];
    }
    if (isComposite(keys)) {
      // Split these IDs in batch of 100 as it is AWS DynamoDB batchGetItems operation limit
      const batches = this.splitBatch(keys, 100);
      // Perform the batchGet operation for each batch
      const responsesBatches: T[][] = await Promise.all(
        batches.map((batch: CompositeKey[]) => this.getSingleBatch(batch, options)),
      );
      // Flatten batches of responses in array of users' data
      return responsesBatches.reduce((b1, b2) => b1.concat(b2), []);
    }
    // Split these IDs in batch of 100 as it is AWS DynamoDB batchGetItems operation limit
    const batches = this.splitBatch(keys, 100);
    // Perform the batchGet operation for each batch
    const responsesBatches: T[][] = await Promise.all(
      batches.map((batch: KeyValue[]) => this.getSingleBatch(batch, options)),
    );
    // Flatten batches of responses in array of users' data
    return responsesBatches.reduce((b1, b2) => b1.concat(b2), []);
  }

  async update(
    pk: KeyValue,
    actions: IUpdateActions,
    options?: Partial<UpdateCommandInput>,
  ): Promise<UpdateCommandOutput>;

  async update(
    pk: KeyValue,
    sk: KeyValue,
    actions: IUpdateActions,
    options?: Partial<UpdateCommandInput>,
  ): Promise<UpdateCommandOutput>;

  async update(
    pk: KeyValue,
    sk_actions: KeyValue | IUpdateActions,
    actions_options?: IUpdateActions | Partial<UpdateCommandInput>,
    options?: Partial<UpdateCommandInput>,
  ): Promise<UpdateCommandOutput> {
    // Handle overloading
    let sk: KeyValue;
    let updateActions: IUpdateActions;
    let nativeOptions: Partial<UpdateCommandInput> | undefined;
    if (!Model.isKey(sk_actions)) {
      // 1st overload
      sk = null;
      updateActions = sk_actions;
      nativeOptions = actions_options;
    } else {
      // 2nd overload
      sk = sk_actions;
      updateActions = actions_options as IUpdateActions;
      nativeOptions = options;
    }
    this.testKeys(pk, sk);
    if (this.autoUpdatedAt) {
      updateActions['updatedAt'] = put(new Date().toISOString());
    }
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: this.buildKeys(pk, sk),
      AttributeUpdates: buildUpdateActions(updateActions),
    };
    if (nativeOptions) {
      Object.assign(params, nativeOptions);
    }
    return this.documentClient.send(new UpdateCommand(params));
  }

  private buildKeys(pk: unknown, sk?: unknown): Record<string, unknown> {
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const keys = {
      [this.pk]: pk,
    };
    if (this.sk) {
      keys[this.sk] = sk;
    }
    return keys;
  }

  private getOptions(
    sk_options: KeyValue | Partial<GetCommandInput> | undefined,
    options: Partial<GetCommandInput> | undefined,
  ): Partial<GetCommandInput> | undefined {
    return sk_options != null && Model.isKey(sk_options)
      ? options
      : (sk_options as Partial<GetCommandInput>);
  }

  private splitBatch = <K>(_keys: K[], CHUNK_SIZE: number): K[][] => {
    return _keys.reduce((batches: K[][], item: K, idx) => {
      const chunkIndex = Math.floor(idx / CHUNK_SIZE);
      if (!batches[chunkIndex]) batches[chunkIndex] = [];
      batches[chunkIndex].push(item);
      return batches;
    }, []);
  };

  /**
   * Performs a batch write operation beyond the limit of 25 put or delete operations
   * @param items.put: An array of items to be added or updated.
   * @param items.delete: Keys or an array of items to be deleted.
   * @param options: Additional options supported by AWS document client.
   * @returns the result of the batch write operation.
   */
  async batchWrite(items: { put: T[], delete: Keys | T[] }, options?: Partial<BatchWriteCommandInput>): Promise<BatchWriteCommandOutput[]> {
    if (!this.tableName) {
      throw new Error('Table name is not defined on your model');
    }
    if (!this.pk) {
      throw new Error('Primary key is not defined on your model');
    }
    const writeRequests: any[] = [];
    //Building put requests
    items.put.forEach(item => {
      if (!this.isValidItem(item)) {
        throw new Error("One of the required keys is missing")
      }
      if (this.autoUpdatedAt) {
        item = {
          ...item,
          updatedAt: new Date().toISOString()
        }
      }
      writeRequests.push({
        PutRequest: {
          Item: item
        }
      });
    });
    //Building delete requests
    if (isComposite(items.delete as Keys)) {
      (items.delete as CompositeKey[]).forEach(compositeKey => {
        writeRequests.push({
          DeleteRequest: {
            Key: this.buildKeys(compositeKey.pk, compositeKey.sk)
          }
        });
      })
    } else if (isSimple(items.delete as Keys)) {
      (items.delete as SimpleKey[]).forEach(hashKey => {
        writeRequests.push({
          DeleteRequest: {
            Key: { [this.pk as string]: hashKey }
          }
        });
      })
    } else {
      items.delete.forEach(item => {
        const pk = this.pkValue(item as T);
        const sk = !!this.sk ? this.skValue(item as T) : undefined;
        writeRequests.push({
          DeleteRequest: {
            Key: this.buildKeys(pk, sk)
          }
        });
      })
    }
    // Split the array of operations into batches of 25
    const batches = this.splitBatch(writeRequests, 25);
    //Make one BatchWrite request for every batch of 25 operations
    let params: BatchWriteCommandInput;
    const output: BatchWriteCommandOutput[] = await Promise.all(
      batches.map(batch => {
        params = {
          RequestItems: {
            [this.tableName as string]: batch
          }
        }
        if (options) {
          Object.assign(params, options);
        }
        const command = new BatchWriteCommand(params);
        return this.documentClient.send(command);
      })
    );
    return output;
  }

  /**
   * Performs a batch put operation beyond the limit of 25 operations
   * @param items: An array of items to be added or updated in the database.
   * @param options: Additional options supported by AWS document client.
   * @returns the result of the batch write operation.
   */
  async batchCreate(items: T[], options?: Partial<BatchWriteCommandInput>): Promise<BatchWriteCommandOutput[]> {
    return this.batchWrite({ put: items, delete: [] }, options);
  }


  /**
   * Performs a batch delete operation beyond the limit of 25 operations
   * @param items: Keys or an array of items to be deleted from the database.
   * @param options: Additional options supported by AWS document client.
   * @returns the result of the batch write operation.
   */
  async batchDelete(items: Keys | T[], options?: Partial<BatchWriteCommandInput>): Promise<BatchWriteCommandOutput[]> {
    return this.batchWrite({ put: [], delete: items }, options);
  }
}