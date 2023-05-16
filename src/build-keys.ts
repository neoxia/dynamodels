import { KeyValue } from './base-model';
import { IFilterCondition, IKeyCondition } from './operators';
import { IBuiltConditions } from './conditions';
import { FilterValue, IFilterConditionOperators, attr } from './filter-conditions';
import { IKeyConditionsOperators } from './key-conditions';

type IConditions = IKeyConditions | IFilterConditions;

type ICondition = IKeyCondition | IFilterCondition;

export interface IKeyConditions {
  [key: string]: IKeyCondition | KeyValue;
}

export interface IFilterConditions {
  [key: string]: IFilterCondition | FilterValue;
}
const operatorToExpression = (
  field: string,
  values: FilterValue[],
  operator: IKeyConditionsOperators | IFilterConditionOperators,
): IBuiltConditions => {
  switch (operator) {
    case 'NE':
      return attr(field).neq(values[0]).build();
    case 'IN':
      return attr(field)
        .in(...values)
        .build();
    case 'LE':
      return attr(field).le(values[0]).build();
    case 'LT':
      return attr(field).lt(values[0]).build();
    case 'GE':
      return attr(field).ge(values[0]).build();
    case 'GT':
      return attr(field).gt(values[0]).build();
    case 'BETWEEN':
      return attr(field)
        .between(values[0] as KeyValue, values[1] as KeyValue)
        .build();
    case 'NOT_NULL':
      return attr(field).notNull().build();
    case 'NULL':
      return attr(field).null().build();
    case 'EXISTS':
      return attr(field).exists().build();
    case 'NOT_EXISTS':
      return attr(field).notExists().build();
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
      return attr(field).eq(values[0]).build();
  }
};

const isComplexCondition = (
  condition: ICondition | KeyValue | FilterValue,
): condition is ICondition =>
  typeof condition === 'object' && (condition as ICondition).values !== undefined;

const buildConditions = (keyConditions: IConditions): IBuiltConditions => {
  const attributes: Record<string, unknown> = {};
  const values: Record<string, unknown> = {};
  const expressions: string[] = [];
  Object.keys(keyConditions).forEach((field) => {
    if (isComplexCondition(keyConditions[field])) {
      const condition: ICondition = keyConditions[field] as ICondition;
      const builtCondition = operatorToExpression(field, condition.values, condition.operator);
      expressions.push(`(${builtCondition.expression})`);
      Object.assign(attributes, builtCondition.attributes);
      Object.assign(values, builtCondition.values);
    } else {
      attributes[`#${field}`] = field;
      values[`:${field}`] = keyConditions[field];
      expressions.push(`(#${field} = :${field})`);
    }
  });
  return {
    expression: expressions && expressions.length > 0 ? expressions.join(' AND ') : undefined,
    attributes,
    values,
  };
};

export const buildKeyConditions = (keyConditions: IKeyConditions): IBuiltConditions =>
  buildConditions(keyConditions);

export const buildFilterConditions = (filterConditions: IFilterConditions): IBuiltConditions =>
  buildConditions(filterConditions);
