/* eslint-disable import/no-unresolved,no-unused-vars */
import { v4 as uuid } from 'uuid';
import Condition from './conditions';
import { Key } from './base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

type IArgs<T> = [string, Map<string, string>, Map<string, T>];

export default abstract class ConditionAttribute<T> {
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

  protected prepareEq(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} = :${id}`, attr, values];
  }

  protected prepareGt(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} > :${id}`, attr, values];
  }

  protected prepareGe(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} >= :${id}`, attr, values];
  }

  protected prepareLt(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} < :${id}`, attr, values];
  }

  protected prepareLe(value: T): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, value);
    return [`#${id} <= :${id}`, attr, values];
  }

  protected prepareBetween(lower: Key, upper: Key): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    const values: Map<string, T> = new Map();
    attr.set(`#${id}`, this.field);
    values.set(`:${id}lower`, (lower as any) as T);
    values.set(`:${id}upper`, (upper as any) as T);
    return [`#${id} BETWEEN :${id}lower AND :${id}upper`, attr, values];
  }

  protected prepareBeginsWith(value: string): IArgs<T> {
    const id = this.getAttributeUniqueIdentifier();
    const { attr, values } = this.fillMaps(id, (value as any) as T);
    return [`begins_with(#${id}, :${id})`, attr, values];
  }
}
