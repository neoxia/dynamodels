export default {
  AttributeDefinitions: [
    {
      AttributeName: 'hashkey',
      AttributeType: 'S',
    },
  ],
  KeySchema: [
    {
      AttributeName: 'hashkey',
      KeyType: 'HASH',
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: 'table_test_hashkey',
};
