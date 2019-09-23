import { Key } from './base-model';
import { ConditionAttribute, Condition } from './conditions';

export type IKeyConditionsOperators = 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BEGINS_WITH' | 'BETWEEN';

export class KeyAttribute extends ConditionAttribute<Key> {
  constructor(field: string) {
    super(field);
  }

  public eq(value: Key): KeyCondition {
    return new KeyCondition(...super._eq(value));
  }
  public gt(value: Key): KeyCondition {
    return new KeyCondition(...super._gt(value));
  }
  public ge(value: Key): KeyCondition {
    return new KeyCondition(...super._ge(value));
  }
  public lt(value: Key): KeyCondition {
    return new KeyCondition(...super._lt(value));
  }
  public le(value: Key): KeyCondition {
    return new KeyCondition(...super._le(value));
  }
  public between(lower: Key, upper: Key): KeyCondition {
    return new KeyCondition(...super._between(lower, upper));
  }
  public beginsWith(value: string): KeyCondition {
    return new KeyCondition(...super._beginsWith(value));
  }
}

export class KeyCondition extends Condition<Key> {
  constructor(expression: string, attr: Map<string, string>, values: Map<string, Key>) {
    super(expression, attr, values);
  }

  public and(condition: KeyCondition): KeyCondition {
    super.and(condition);
    return this;
  }
}

export const key = (field: string) => new KeyAttribute(field);
