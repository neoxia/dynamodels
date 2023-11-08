export interface IBuiltConditions {
  expression?: string;
  attributes: Record<string, unknown>;
  values: Record<string, unknown>;
}

export default abstract class Condition<T> {
  protected expression: string;

  protected attributes: Map<string, string>;

  protected values: Map<string, T>;

  constructor(expression: string, attr: Map<string, string>, values: Map<string, T>) {
    this.expression = expression;
    this.attributes = attr;
    this.values = values;
  }

  protected prepareExpression(condition: Condition<T>): void {
    condition.attributes.forEach((value, key) => {
      this.attributes.set(key, value);
    });
    condition.values.forEach((value, key) => {
      this.values.set(key, value);
    });
  }

  protected combine(condition: Condition<T>, logicalOperator: 'AND' | 'OR'): this {
    this.prepareExpression(condition);
    this.expression = `${this.expression} ${logicalOperator} (${condition.expression})`;
    return this;
  }

  public and(condition: Condition<T>): Condition<T> {
    return this.combine(condition, 'AND');
  }

  public build(): IBuiltConditions {
    const attributes: Record<string, unknown> = {};
    const values: Record<string, unknown> = {};
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
