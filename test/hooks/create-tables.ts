import { DynamoDB } from 'aws-sdk';
import { compositeTable } from '../tables/compositekey';
import { hashTable } from '../tables/hashkey';

const tables: any = {
  hashTable,
  compositeTable,
};

const dynamodb = new DynamoDB({
  region: 'localhost',
  endpoint: `http://localhost:${process.env.LOCAL_DYNAMODB_PORT}`,
});

export const clearTables = async () => {
  await deleteTables();
  return createTables();
};

export const deleteTables = async () => {
  return Promise.all(
    Object.keys(tables).map((tableName: string) => {
      return dynamodb
        .deleteTable({
          TableName: tables[tableName].TableName,
        })
        .promise();
    }),
  );
};

export const createTables = async () => {
  return Promise.all(
    Object.keys(tables).map((tableName: string) => {
      return dynamodb
        .createTable(tables[tableName])
        .promise()
        .catch((err) => {
          if (err.message === 'Cannot create preexisting table') {
            return;
          }
          throw err;
        });
    }),
  );
};
