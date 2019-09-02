import { Key } from './base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IkeyCondition, IFilterCondition } from './key-operators';

type IConditions = ISimpleConditions | IComplexConditions;

export type IKeyConditions = ISimpleConditions | IComplexKeyConditions;

export type IFilterConditions = ISimpleConditions | IComplexFilterConditions;

interface IComplexKeyConditions {
  [atributeName: string]: IkeyCondition;
}

interface IComplexFilterConditions {
  [atributeName: string]: IkeyCondition | IFilterCondition;
}

interface IComplexConditions {
  [atributeName: string]: IkeyCondition | IFilterCondition;
}

interface ISimpleConditions {
  [atributeName: string]: Key;
}

export const buildKeyConditions = (keyConditions: IKeyConditions): DocumentClient.KeyConditions =>
  buildConditions(keyConditions);

export const buildFilterConditions = (filterConditions: IFilterConditions): DocumentClient.KeyConditions =>
  buildConditions(filterConditions);

const buildConditions = (keyConditions: IConditions): DocumentClient.KeyConditions => {
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

const isComplexConditions = (keyConditions: IConditions): keyConditions is IComplexConditions => {
  return Object.keys(keyConditions).some((field) => (keyConditions[field] as any).operator !== undefined);
};
