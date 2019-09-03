import { Key } from './base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { IkeyCondition, IFilterCondition } from './key-operators';
import { IBuiltConditions } from './conditions';
import { FilterValue, IFilterConditionOperators, attr } from './filter-conditions';

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

export const buildKeyConditions = (keyConditions: IKeyConditions): IBuiltConditions => buildConditions(keyConditions);

export const buildFilterConditions = (filterConditions: IFilterConditions): IBuiltConditions =>
  buildConditions(filterConditions);

const buildConditions = (keyConditions: IConditions): IBuiltConditions => {
  if (isComplexConditions(keyConditions)) {
    return buildComplexCondition(keyConditions);
  }
  return buildSimpleConditions(keyConditions);
};

const buildComplexCondition = (keyConditions: IComplexConditions): IBuiltConditions => {
  const attributes: DocumentClient.ExpressionAttributeNameMap = {};
  const values: DocumentClient.ExpressionAttributeValueMap = {};
  const conditions: string[] = [];
  Object.keys(keyConditions).forEach((field) => {
    const builtCondition = operatorToExpression(field, keyConditions[field].values, keyConditions[field].operator);
    conditions.push(`(${builtCondition.expression})`);
    Object.assign(attributes, builtCondition.attributes);
    Object.assign(values, builtCondition.values);
  });
  return {
    expression: conditions.join(' AND '),
    attributes,
    values,
  };
};

const operatorToExpression = (
  field: string,
  values: FilterValue[],
  operator: IFilterConditionOperators,
): IBuiltConditions => {
  switch (operator) {
    case 'NE':
      return attr(field)
        .neq(values[0])
        .build();
    case 'IN':
      return attr(field)
        .in(values)
        .build();
    case 'LE':
      return attr(field)
        .le(values[0])
        .build();
    case 'LT':
      return attr(field)
        .lt(values[0])
        .build();
    case 'GE':
      return attr(field)
        .ge(values[0])
        .build();
    case 'GT':
      return attr(field)
        .gt(values[0])
        .build();
    case 'BETWEEN':
      return attr(field)
        .between(values[0] as Key, values[1] as Key)
        .build();
    case 'NOT_NULL':
      return attr(field)
        .notNull()
        .build();
    case 'NULL':
      return attr(field)
        .null()
        .build();
    case 'CONTAINS':
      return attr(field)
        .contains(values[0] as string)
        .build();
    case 'NOT_CONTAINS':
      return attr(field)
        .notContains(values[0] as string)
        .build();
    case 'BEGINS_WITH':
      return attr(field)
        .beginsWith(values[0] as string)
        .build();
    default:
      return attr(field)
        .eq(values[0])
        .build();
  }
};

const buildSimpleConditions = (keyConditions: ISimpleConditions): IBuiltConditions => {
  const attributes: DocumentClient.ExpressionAttributeNameMap = {};
  const values: DocumentClient.ExpressionAttributeValueMap = {};
  const conditions: string[] = [];
  Object.keys(keyConditions).forEach((field) => {
    attributes[`#${field}`] = field;
    values[`:${field}`] = keyConditions[field];
    conditions.push(`(#${field} = :${field})`);
  });
  return {
    expression: conditions.join(' AND '),
    attributes,
    values,
  };
};

const isComplexConditions = (keyConditions: IConditions): keyConditions is IComplexConditions => {
  return Object.keys(keyConditions).some((field) => (keyConditions[field] as any).operator !== undefined);
};
