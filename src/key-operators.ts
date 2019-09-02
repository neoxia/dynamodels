import { Key } from './base-model';

export type IKeyConditionsOperators = 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BEGINS_WITH' | 'BETWEEN';

export type IFilterConditionOperator =
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

export interface IFilterCondition {
  operator?: IFilterConditionOperator;
  values: Key[];
}

export interface IkeyCondition {
  operator?: IKeyConditionsOperators;
  values: Key[];
}

const _op = (op: IKeyConditionsOperators | IFilterConditionOperator, values: Key[]) => ({
  operator: op,
  values,
});

export const eq = (value: Key): IkeyCondition | IFilterCondition => _op('EQ', [value]);
export const neq = (value: Key): IFilterCondition => _op('NE', [value]);
export const _in = (values: Key[]): IFilterCondition => _op('IN', values);
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
