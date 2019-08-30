import { Key } from './base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

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

export const buildKeyConditions = (keyConditions: IKeyConditions): DocumentClient.KeyConditions => {
  const conditions: DocumentClient.KeyConditions = {};
  if (isComplexConditions(keyConditions)) {
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
};

export const isComplexConditions = (keyConditions: IKeyConditions): keyConditions is IKeyComplexConditions => {
  return Object.keys(keyConditions).some((field) => (keyConditions[field] as any).operator !== undefined);
};
