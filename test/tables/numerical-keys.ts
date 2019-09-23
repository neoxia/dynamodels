export const numericalTable = {
  AttributeDefinitions: [
    {
      AttributeName: 'hashkey',
      AttributeType: 'N',
    },
    {
      AttributeName: 'rangekey',
      AttributeType: 'N',
    },
    {
      AttributeName: 'optional_number',
      AttributeType: 'N',
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
  TableName: 'table_test_numerical_composite_key',
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
          AttributeName: 'optional_number',
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
