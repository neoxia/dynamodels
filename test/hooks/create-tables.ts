import compositeTable from '../tables/composite-key';
import hashTable from '../tables/hash-key';
import numericalTable from '../tables/numerical-keys';
import timeTrackedTable from '../tables/autoCreatedAt-autoUpdatedAt';
import {
  CreateTableCommand,
  CreateTableCommandInput,
  DeleteTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

const tables: Record<string, CreateTableCommandInput> = {
  hashTable,
  compositeTable,
  numericalTable,
  timeTrackedTable
};

const dynamodb = new DynamoDBClient({
  region: 'local',
  endpoint: `http://${process.env.LOCAL_DYNAMODB_HOST}:${process.env.LOCAL_DYNAMODB_PORT || 8000}`,
});

export const deleteTables = async () =>
  Promise.all(
    Object.keys(tables).map((tableName: string) =>
      dynamodb.send(new DeleteTableCommand({ TableName: tables[tableName].TableName })),
    ),
  );

export const createTables = async () =>
  Promise.all(
    Object.keys(tables).map((tableName: string) =>
      dynamodb.send(new CreateTableCommand(tables[tableName])).catch((err) => {
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
