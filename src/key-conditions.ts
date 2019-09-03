import { Key } from './base-model';
import { ConditionAttribute, Condition } from './conditions';

export type IKeyConditionsOperators = 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BEGINS_WITH' | 'BETWEEN';

export class KeyAttribute extends ConditionAttribute<Key> {
  constructor(field: string) {
    super(field);
  }
}

export class KeyCondition extends Condition<Key> {
  constructor(expression: string, attr: Map<string, string>, values: Map<string, Key>) {
    super(expression, attr, values);
  }
}

export const key = (field: string) => new KeyAttribute(field);
