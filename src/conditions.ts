import { Key } from './base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export interface IBuiltConditions {
  expression: string;
  attributes: DocumentClient.ExpressionAttributeNameMap;
  values: DocumentClient.ExpressionAttributeValueMap;
}

export class ConditionAttribute<T> {
  protected field: string;

  constructor(field: string) {
    this.field = field;
  }

  public eq(value: T): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new Condition(`#${this.field} = :${this.field}`, attr, values);
  }

  public gt(value: T): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new Condition(`#${this.field} > :${this.field}`, attr, values);
  }

  public ge(value: T): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new Condition(`#${this.field} >= :${this.field}`, attr, values);
  }

  public lt(value: T): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new Condition(`#${this.field} < :${this.field}`, attr, values);
  }

  public le(value: T): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, value);
    return new Condition(`#${this.field} <= :${this.field}`, attr, values);
  }

  public between(lower: Key, upper: Key): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}-lower`, (lower as any) as T);
    values.set(`:${this.field}-upper`, (upper as any) as T);
    return new Condition(`#${this.field} BETWEEEN :${this.field}-lower AND ${this.field}-upper`, attr, values);
  }

  public beginsWith(value: string): Condition<T> {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${this.field}`, this.field);
    values.set(`:${this.field}`, (value as any) as T);
    return new Condition(`begins_with(#${this.field}, :${this.field}`, attr, values);
  }
}

export class Condition<T> {
  protected expression: string;
  protected attributes: Map<string, string>;
  protected values: Map<string, T>;

  constructor(expression: string, attr: Map<string, string>, values: Map<string, T>) {
    this.expression = expression;
    this.attributes = attr;
    this.values = values;
  }

  public and(condition: Condition<T>): Condition<T> {
    condition.attributes.forEach((value, key) => {
      this.attributes.set(key, value);
    });
    condition.values.forEach((value, key) => {
      this.values.set(key, value);
    });
    this.expression = `${this.expression} AND (${condition.expression})`;
    return this;
  }

  public build(): IBuiltConditions {
    const attributes: DocumentClient.ExpressionAttributeNameMap = {};
    const values: DocumentClient.ExpressionAttributeValueMap = {};
    this.attributes.forEach((value, key) => {
      attributes[key] = value;
    });
    this.values.forEach((value, key) => {
      values[key] = value;
    });
    return {
      expression: this.expression,
      attributes,
      values,
    };
  }
}
