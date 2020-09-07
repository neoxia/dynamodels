/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
/* eslint-enable import/no-unresolved,no-unused-vars */

export interface IBuiltConditions {
  expression: string;
  attributes: DocumentClient.ExpressionAttributeNameMap;
  values: DocumentClient.ExpressionAttributeValueMap;
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

  protected combine(condition: Condition<T>, logicalOperator: 'AND' | 'OR'): Condition<T> {
    this.prepareExpression(condition);
    this.expression = `${this.expression} ${logicalOperator} (${condition.expression})`;
    return this;
  }

  public and(condition: Condition<T>): Condition<T> {
    return this.combine(condition, 'AND');
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
