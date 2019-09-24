/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
/* eslint-enable import/no-unresolved,no-unused-vars */

export type UpdateOperators = 'ADD' | 'PUT' | 'DELETE';

interface IUpdateAction {
  action: UpdateOperators;
  value: any;
}

export interface IUpdateActions {
  [attributeName: string]: IUpdateAction;
}

export const buildUpdateActions = (
  updateActions: IUpdateActions,
): DocumentClient.AttributeUpdates => {
  const actions = {};
  Object.keys(updateActions).forEach((field) => {
    (actions as any)[field] = {
      Action: updateActions[field].action,
      Value: updateActions[field].value,
    };
  });
  return actions;
};

const op = (operator: UpdateOperators, value?: any): IUpdateAction => ({
  action: operator,
  value,
});

export const add = (value: any): IUpdateAction => op('ADD', value);
export const put = (value: any): IUpdateAction => op('PUT', value);
export const remove = (): IUpdateAction => op('DELETE');
