import { Key } from './base-model';
import { IFilterConditionOperators, FilterValue } from './filter-conditions';
import { IKeyConditionsOperators } from './key-conditions';

type ConditionValue = Key | FilterValue;

export interface IFilterCondition {
  operator?: IFilterConditionOperators;
  values: FilterValue[];
}

export interface IKeyCondition {
  operator?: IKeyConditionsOperators;
  values: Key[];
}

const _op = (op: IKeyConditionsOperators | IFilterConditionOperators, values: Array<ConditionValue>) => ({
  operator: op,
  values,
});

export const eq = (value: FilterValue): any => _op('EQ', [value]);
export const neq = (value: FilterValue): IFilterCondition => _op('NE', [value]);
export const _in = (...args: FilterValue[]): IFilterCondition => _op('IN', args);
export const le = (value: Key): any => _op('LE', [value]);
export const lt = (value: Key): any => _op('LT', [value]);
export const ge = (value: Key): any => _op('GE', [value]);
export const gt = (value: Key): any => _op('GT', [value]);
export const between = (lower: Key, upper: Key): any => _op('BETWEEN', [lower, upper]);
export const _null = (): IFilterCondition => _op('NULL', []);
export const notNull = (): IFilterCondition => _op('NOT_NULL', []);
export const exists = (): IFilterCondition => _op('EXISTS', []);
export const notExists = (): IFilterCondition => _op('NOT_EXISTS', []);
export const contains = (value: string): IFilterCondition => _op('CONTAINS', [value]);
export const notContains = (value: string): IFilterCondition => _op('NOT_CONTAINS', [value]);
export const beginsWith = (value: string | Buffer): any => _op('BEGINS_WITH', [value]);
