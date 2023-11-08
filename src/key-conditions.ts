import { KeyValue } from './base-model';
import KeyAttribute from './key-attribute';
import Condition from './conditions';

export type IKeyConditionsOperators = 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BEGINS_WITH' | 'BETWEEN';

export class KeyCondition extends Condition<KeyValue> {
  public and(condition: KeyCondition): this {
    super.and(condition);
    return this;
  }
}

export const key = (field: string) => new KeyAttribute(field);
