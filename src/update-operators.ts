import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export type UpdateOperators = 'ADD' | 'PUT' | 'DELETE';

interface IUpdateAction {
  action: UpdateOperators;
  value: any;
}

export interface IUpdateActions {
  [attributeName: string]: IUpdateAction;
}

export const buildUpdateActions = (updateActions: IUpdateActions): DocumentClient.AttributeUpdates => {
  const actions = {};
  Object.keys(updateActions).forEach((field) => {
    (actions as any)[field] = {
      Action: updateActions[field].action,
      Value: updateActions[field].value,
    };
  });
  return actions;
};

const _op = (op: UpdateOperators, value?: any): IUpdateAction => ({
  action: op,
  value,
});

export const add = (value: any): IUpdateAction => _op('ADD', value);
export const put = (value: any): IUpdateAction => _op('PUT', value);
export const remove = (): IUpdateAction => _op('DELETE');
