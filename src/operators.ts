import { KeyValue } from './base-model';
import { IFilterConditionOperators, FilterValue } from './filter-conditions';
import { IKeyConditionsOperators } from './key-conditions';

type ConditionValue = KeyValue | FilterValue;

export interface IFilterCondition {
  operator: IFilterConditionOperators;
  values: FilterValue[];
}

export interface IKeyCondition {
  operator: IKeyConditionsOperators;
  values: KeyValue[];
}

const opK = (operator: IKeyConditionsOperators, values: Array<ConditionValue>): IKeyCondition => ({
  operator,
  values,
});

const opF = (
  operator: IFilterConditionOperators,
  values: Array<ConditionValue>,
): IFilterCondition => ({
  operator,
  values,
});

export const eq = (value: FilterValue): IKeyCondition => opK('EQ', [value]);
export const neq = (value: FilterValue): IFilterCondition => opF('NE', [value]);
export const isIn = (...args: FilterValue[]): IFilterCondition => opF('IN', args);
export const le = (value: KeyValue): IKeyCondition => opK('LE', [value]);
export const lt = (value: KeyValue): IKeyCondition => opK('LT', [value]);
export const ge = (value: KeyValue): IKeyCondition => opK('GE', [value]);
export const gt = (value: KeyValue): IKeyCondition => opK('GT', [value]);
export const between = (lower: KeyValue, upper: KeyValue): IKeyCondition =>
  opK('BETWEEN', [lower, upper]);
export const isNull = (): IFilterCondition => opF('NULL', []);
export const notNull = (): IFilterCondition => opF('NOT_NULL', []);
export const exists = (): IFilterCondition => opF('EXISTS', []);
export const notExists = (): IFilterCondition => opF('NOT_EXISTS', []);
export const contains = (value: string): IFilterCondition => opF('CONTAINS', [value]);
export const notContains = (value: string): IFilterCondition => opF('NOT_CONTAINS', [value]);
export const beginsWith = (value: string | Buffer): IKeyCondition => opK('BEGINS_WITH', [value]);
