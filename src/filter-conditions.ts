import { ConditionAttribute, Condition } from './conditions';
import { Key } from './base-model';

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
  | 'EXISTS'
  | 'NOT_EXISTS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'BEGINS_WITH';

export class FilterAttribute extends ConditionAttribute<FilterValue> {
  constructor(field: string) {
    super(field);
  }

  public eq(value: FilterValue): FilterCondition {
    return new FilterCondition(...super._eq(value));
  }
  public gt(value: FilterValue): FilterCondition {
    return new FilterCondition(...super._gt(value));
  }
  public ge(value: FilterValue): FilterCondition {
    return new FilterCondition(...super._ge(value));
  }
  public lt(value: FilterValue): FilterCondition {
    return new FilterCondition(...super._lt(value));
  }
  public le(value: FilterValue): FilterCondition {
    return new FilterCondition(...super._le(value));
  }
  public between(lower: Key, upper: Key): FilterCondition {
    return new FilterCondition(...super._between(lower, upper));
  }
  public beginsWith(value: string): FilterCondition {
    return new FilterCondition(...super._beginsWith(value));
  }

  public neq(value: FilterValue): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`#${id} <> :${id}`, attr, values);
  }

  public in(...values: FilterValue[]): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const _values: Map<string, FilterValue> = new Map();
    attr.set(`#${id}`, this.field);
    values.forEach((value, idx) => {
      _values.set(`:${id}${idx}`, value);
    });
    return new FilterCondition(`#${id} IN (${Array.from(_values.keys()).join(',')})`, attr, _values);
  }

  public null(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(`:null`, null);
    return new FilterCondition(`#${id} = :null`, attr, values);
  }

  public notNull(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(`:null`, null);
    return new FilterCondition(`#${id} <> :null`, attr, values);
  }

  public exists(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    return new FilterCondition(`attribute_exists(#${id})`, attr, new Map());
  }

  public notExists(): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    attr.set(`#${id}`, this.field);
    return new FilterCondition(`attribute_not_exists(#${id})`, attr, new Map());
  }

  public contains(value: string): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`contains(#${id}, :${id})`, attr, values);
  }

  public notContains(value: string): FilterCondition {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return new FilterCondition(`NOT contains(#${id}, :${id})`, attr, values);
  }
}

export class FilterCondition extends Condition<FilterValue> {
  constructor(expression: string, attr: Map<string, string>, values: Map<string, FilterValue>) {
    super(expression, attr, values);
  }

  public and(condition: FilterCondition): FilterCondition {
    super.and(condition);
    return this;
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
    this.expression = `NOT (${this.expression})`;
    return this;
  }
}

export const not = (condition: FilterCondition): FilterCondition => {
  return condition.not();
};

export const attr = (field: string) => new FilterAttribute(field);

/* attr('foo').ge(42)
    .and(
      attr('bar').eq('baz').or(attr('foobar').eq(13))
      )*/
// (foo > 42) AND (bar = baz OR FOOBAR = 13)

/* attr('foo').ge(42)
    .or(
      attr('bar').eq('baz').and(attr('foobar').eq(13))
      )*/
// (foo > 42) OR (bar = baz AND FOOBAR = 13)
