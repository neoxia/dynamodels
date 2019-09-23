import { Key } from './base-model';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid';

export interface IBuiltConditions {
  expression: string;
  attributes: DocumentClient.ExpressionAttributeNameMap;
  values: DocumentClient.ExpressionAttributeValueMap;
}

type IArgs<T> = [string, Map<string, string>, Map<string, T>];

export abstract class ConditionAttribute<T> {
  protected field: string;

  constructor(field: string) {
    this.field = field;
  }

  protected getAttributeUniqueIdentifier(): string {
    return this.field + uuid().replace(/-/g, '');
  }

  protected fillMaps(id: string, value: T) {
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(`:${id}`, value);
    return { attr, values };
  }

  public abstract eq(value: T): Condition<T>;
  public abstract gt(value: T): Condition<T>;
  public abstract ge(value: T): Condition<T>;
  public abstract lt(value: T): Condition<T>;
  public abstract le(value: T): Condition<T>;
  public abstract between(lower: T, upper: T): Condition<T>;
  public abstract beginsWith(value: T): Condition<T>;

  protected _eq(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} = :${id}`, attr, values];
  }

  protected _gt(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} > :${id}`, attr, values];
  }

  protected _ge(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} >= :${id}`, attr, values];
  }

  protected _lt(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} < :${id}`, attr, values];
  }

  protected _le(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} <= :${id}`, attr, values];
  }

  protected _between(lower: Key, upper: Key): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(`:${id}lower`, (lower as any) as T);
    values.set(`:${id}upper`, (upper as any) as T);
    return [`#${id} BETWEEN :${id}lower AND :${id}upper`, attr, values];
  }

  protected _beginsWith(value: string): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, (value as any) as T);
    return [`begins_with(#${id}, :${id})`, attr, values];
  }
}

export abstract class Condition<T> {
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
