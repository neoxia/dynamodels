export const compositeTable = {
  AttributeDefinitions: [
    {
      AttributeName: 'hashkey',
      AttributeType: 'S',
    },
    {
      AttributeName: 'rangekey',
      AttributeType: 'S',
    },
    {
      AttributeName: 'name',
      AttributeType: 'S',
    },
  ],
  KeySchema: [
    {
      AttributeName: 'hashkey',
      KeyType: 'HASH',
    },
    {
      AttributeName: 'rangekey',
      KeyType: 'RANGE',
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: 'table_test_compositekey',
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GS1',
      KeySchema: [
        {
          AttributeName: 'rangekey',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'hashkey',
          KeyType: 'RANGE',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: 'GS2',
      KeySchema: [
        {
          AttributeName: 'hashkey',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'name',
          KeyType: 'RANGE',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
};
