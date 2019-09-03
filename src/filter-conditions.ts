import { ConditionAttribute, Condition } from './conditions';

export type FilterValue = string | number | boolean | Buffer;

export type IFilterConditionOperators =
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

export class FilterAttribute extends ConditionAttribute<FilterValue> {
  constructor(field: string) {
    super(field);
  }

  public neq(value: FilterValue): FilterCondition {
    const attr: Map<string, string> = new Map();
    const values: Map<string, FilterValue> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new FilterCondition(`#${this.field} <> :${this.field}`, attr, values);
  }

  public in(values: FilterValue[]): FilterCondition {
    const attr: Map<string, string> = new Map();
    const _values: Map<string, FilterValue> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.forEach((value, idx) => {
      _values.set(`:${this.field}-${idx}`, value);
    });
    return new FilterCondition(`#${this.field} IN (${Array.from(_values.keys()).join(',')})`, attr, _values);
  }

  public null(): FilterCondition {
    const attr: Map<string, string> = new Map();
    attr.set(`#${this.field}`, this.field);
    return new FilterCondition(`attribute_not_exists(#${this.field})`, attr, new Map());
  }

  public notNull(): FilterCondition {
    const attr: Map<string, string> = new Map();
    attr.set(`#${this.field}`, this.field);
    return new FilterCondition(`attribute_exists(#${this.field})`, attr, new Map());
  }

  public contains(value: string): FilterCondition {
    const attr: Map<string, string> = new Map();
    const values: Map<string, FilterValue> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new FilterCondition(`contains(#${this.field}, :${this.field}`, attr, values);
  }

  public notContains(value: string): FilterCondition {
    const attr: Map<string, string> = new Map();
    const values: Map<string, FilterValue> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new FilterCondition(`NOT contains(#${this.field}, :${this.field}`, attr, values);
  }
}

export class FilterCondition extends Condition<FilterValue> {
  constructor(expression: string, attr: Map<string, string>, values: Map<string, FilterValue>) {
    super(expression, attr, values);
  }
  public or(condition: FilterCondition): FilterCondition {
    condition.attributes.forEach((value, key) => {
      this.attributes.set(key, value);
    });
    condition.values.forEach((value, key) => {
      this.values.set(key, value);
    });
    this.expression = `${this.expression} OR (${condition.expression})`;
    return this;
  }

  public not(): FilterCondition {
    this.expression = `NOT ${this.expression}`;
    return this;
  }
}

export const not = (condition: FilterCondition): FilterCondition => {
  return condition.not();
};

export const attr = (field: string) => new FilterAttribute(field);
