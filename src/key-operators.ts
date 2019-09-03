import { Key } from './base-model';
import { IFilterConditionOperators, FilterValue } from './filter-conditions';
import { IKeyConditionsOperators } from './key-conditions';

type ConditionValue = Key | FilterValue;

export interface IFilterCondition {
  operator?: IFilterConditionOperators;
  values: FilterValue[];
}

export interface IkeyCondition {
  operator?: IKeyConditionsOperators;
  values: Key[];
}

const _op = (op: IKeyConditionsOperators | IFilterConditionOperators, values: Array<ConditionValue>) => ({
  operator: op,
  values,
});

export const eq = (value: Key): IkeyCondition | IFilterCondition => _op('EQ', [value]);
export const neq = (value: FilterValue): IFilterCondition => _op('NE', [value]);
export const _in = (values: FilterValue[]): IFilterCondition => _op('IN', values);
export const le = (value: Key): IkeyCondition | IFilterCondition => _op('LE', [value]);
export const lt = (value: Key): IkeyCondition | IFilterCondition => _op('LT', [value]);
export const ge = (value: Key): IkeyCondition | IFilterCondition => _op('GE', [value]);
export const gt = (value: Key): IkeyCondition | IFilterCondition => _op('GT', [value]);
export const between = (lower: Key, upper: Key): IkeyCondition | IFilterCondition => _op('BETWEEN', [lower, upper]);
export const _null = (): IFilterCondition => _op('NULL', []);
export const notNull = (): IFilterCondition => _op('NOT_NULL', []);
export const contains = (value: string): IFilterCondition => _op('CONTAINS', [value]);
export const notContains = (value: string): IFilterCondition => _op('NOT_CONTAINS', [value]);
export const beginsWith = (value: string | Buffer): IkeyCondition | IFilterCondition => _op('BEGINS_WITH', [value]);
