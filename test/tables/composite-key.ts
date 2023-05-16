export default {
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
      AttributeName: 'optionalString',
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
  TableName: 'table_test_composite_key',
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
          AttributeName: 'optionalString',
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
