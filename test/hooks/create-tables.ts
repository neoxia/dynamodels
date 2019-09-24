/* eslint-disable import/no-unresolved,no-unused-vars */
import { DynamoDB } from 'aws-sdk';
import compositeTable from '../tables/composite-key';
import hashTable from '../tables/hash-key';
import numericalTable from '../tables/numerical-keys';
/* eslint-enable import/no-unresolved,no-unused-vars */

const tables: any = {
  hashTable,
  compositeTable,
  numericalTable,
};

const dynamodb = new DynamoDB({
  region: 'localhost',
  endpoint: `http://localhost:${process.env.LOCAL_DYNAMODB_PORT || 8000}`,
});

export const deleteTables = async () =>
  Promise.all(
    Object.keys(tables).map((tableName: string) =>
      dynamodb
        .deleteTable({
          TableName: tables[tableName].TableName,
        })
        .promise(),
    ),
  );

export const createTables = async () =>
  Promise.all(
    Object.keys(tables).map((tableName: string) =>
      dynamodb
        .createTable(tables[tableName])
        .promise()
        .catch((err) => {
          if (err.message === 'Cannot create preexisting table') {
            return;
          }
          throw err;
        }),
    ),
  );

export const clearTables = async () => {
  await deleteTables();
  return createTables();
};
