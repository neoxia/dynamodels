/* eslint-disable import/no-unresolved,no-unused-vars */
import { Key } from './base-model';
import { IFilterConditionOperators, FilterValue } from './filter-conditions';
import { IKeyConditionsOperators } from './key-conditions';
/* eslint-enable import/no-unresolved,no-unused-vars */

type ConditionValue = Key | FilterValue;

export interface IFilterCondition {
  operator?: IFilterConditionOperators;
  values: FilterValue[];
}

export interface IKeyCondition {
  operator?: IKeyConditionsOperators;
  values: Key[];
}

const op = (
  operator: IKeyConditionsOperators | IFilterConditionOperators,
  values: Array<ConditionValue>,
) => ({
  operator,
  values,
});

export const eq = (value: FilterValue): any => op('EQ', [value]);
export const neq = (value: FilterValue): IFilterCondition => op('NE', [value]);
export const isIn = (...args: FilterValue[]): IFilterCondition => op('IN', args);
export const le = (value: Key): any => op('LE', [value]);
export const lt = (value: Key): any => op('LT', [value]);
export const ge = (value: Key): any => op('GE', [value]);
export const gt = (value: Key): any => op('GT', [value]);
export const between = (lower: Key, upper: Key): any => op('BETWEEN', [lower, upper]);
export const isNull = (): IFilterCondition => op('NULL', []);
export const notNull = (): IFilterCondition => op('NOT_NULL', []);
export const exists = (): IFilterCondition => op('EXISTS', []);
export const notExists = (): IFilterCondition => op('NOT_EXISTS', []);
export const contains = (value: string): IFilterCondition => op('CONTAINS', [value]);
export const notContains = (value: string): IFilterCondition => op('NOT_CONTAINS', [value]);
export const beginsWith = (value: string | Buffer): any => op('BEGINS_WITH', [value]);
