import { Model } from '../src/base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export const documentClient = new DocumentClient({
  region: 'localhost',
  endpoint: `http://localhost:${process.env.LOCAL_DYNAMODB_PORT || 8000}`,
});

interface CommonFields {
  number: number;
  bool: boolean;
  string: string;
  stringset: string[];
  list: Array<number | string>;
  stringmap: { [key: string]: string };
}

type HashKeyEntity = CommonFields & {
  hashkey: string;
};

type CompositeKeyEntity = CommonFields & {
  hashkey: string;
  rangekey: string;
};

export class HashKeyModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_hashkey';
  protected pk = 'hashkey';
  protected documentClient: DocumentClient = documentClient;

  constructor(item?: HashKeyEntity) {
    super(item);
  }
}

export class CompositeKeyModel extends Model<CompositeKeyEntity> {
  protected tableName = 'table_test_compositekey';
  protected pk = 'hashkey';
  protected sk = 'rangekey';
  protected documentClient: DocumentClient = documentClient;

  constructor(item?: CompositeKeyEntity) {
    super(item);
  }
}

export class InvalidTableModel extends Model<HashKeyEntity> {
  protected pk = 'hashkey';
  protected documentClient: DocumentClient = documentClient;

  constructor(item?: HashKeyEntity) {
    super(item);
  }
}

export class NoDocClientModel extends Model<HashKeyEntity> {
  protected tableName = 'table_test_compositekey';
  protected pk = 'hashkey';

  constructor(item?: HashKeyEntity) {
    super(item);
  }
}

export class InvalidPKModel extends Model<CompositeKeyEntity> {
  protected tableName = 'table_test_compositekey';
  protected sk = 'rangekey';
  protected documentClient: DocumentClient = documentClient;

  constructor(item?: CompositeKeyEntity) {
    super(item);
  }
}
