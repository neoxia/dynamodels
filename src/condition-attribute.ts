import { v4 as uuid } from 'uuid';
import Condition from './conditions';
import { KeyValue } from './base-model';

type IArgs<T> = [string, Map<string, string>, Map<string, T>];

type ArithmeticOperator = '=' | '>' | '<' | '<=' | '>=';

export default abstract class ConditionAttribute<T> {
  protected field: string;

  constructor(field: string) {
    this.field = field;
  }

  protected getAttributeUniqueIdentifier(): string {
    return this.field.split('.').map(key => key + uuid().replace(/-/g, '')).join('.');
  }

  protected fillMaps(value: T) {
    const { id, attr } = this.prepareAttributes();
    const values: Map<string, T> = new Map();
    values.set(`:${id.split('.').at(-1)}`, value);
    return { id, attr, values };
  }

  protected prepareAttributes(): { id: string; attr: Map<string, string> } {
    const keys = this.field.split('.');
    const id = this.getAttributeUniqueIdentifier();
    const attr: Map<string, string> = new Map();
    id.split('.').forEach((id, index) => {
      attr.set(`#${id}`, keys[index]);
    })
    return { id, attr };
  }

  public abstract eq(value: T): Condition<T>;

  public abstract gt(value: T): Condition<T>;

  public abstract ge(value: T): Condition<T>;

  public abstract lt(value: T): Condition<T>;

  public abstract le(value: T): Condition<T>;

  public abstract between(lower: T, upper: T): Condition<T>;

  public abstract beginsWith(value: T): Condition<T>;

  protected prepareOp(value: T): { id: string; attr: Map<string, string>; values: Map<string, T> } {
    const { id, attr, values } = this.fillMaps(value);
    return { id, attr, values };
  }

  private arithmeticOperation(value: T, operator: ArithmeticOperator): IArgs<T> {
    const { id, attr, values } = this.prepareOp(value);
    return [`#${id.replace(/\./g, '.#')} ${operator} :${id.split('.').at(-1)}`, attr, values];
  }

  protected prepareEq(value: T): IArgs<T> {
    return this.arithmeticOperation(value, '=');
  }

  protected prepareGt(value: T): IArgs<T> {
    return this.arithmeticOperation(value, '>');
  }

  protected prepareGe(value: T): IArgs<T> {
    return this.arithmeticOperation(value, '>=');
  }

  protected prepareLt(value: T): IArgs<T> {
    return this.arithmeticOperation(value, '<');
  }

  protected prepareLe(value: T): IArgs<T> {
    return this.arithmeticOperation(value, '<=');
  }

  protected prepareBetween(lower: KeyValue, upper: KeyValue): IArgs<T> {
    const { id, attr } = this.prepareAttributes();
    const values: Map<string, T> = new Map();
    values.set(`:${id.split('.').at(-1)}lower`, lower as T);
    values.set(`:${id.split('.').at(-1)}upper`, upper as T);
    return [`#${id.replace(/\./g, '.#')} BETWEEN :${id.split('.').at(-1)}lower AND :${id.split('.').at(-1)}upper`, attr, values];
  }

  protected prepareBeginsWith(value: string): IArgs<T> {
    const { id, attr, values } = this.fillMaps(value as T);
    return [`begins_with(#${id.replace(/\./g, '.#')}, :${id.split('.').at(-1)})`, attr, values];
  }
}
