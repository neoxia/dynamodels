export type UpdateOperators = 'ADD' | 'PUT' | 'DELETE';

interface IUpdateAction {
  action: UpdateOperators;
  value: unknown;
}

export interface IUpdateActions {
  [attributeName: string]: IUpdateAction;
}

export const buildUpdateActions = (
  updateActions: IUpdateActions,
): Record<string, { Action: 'ADD' | 'PUT' | 'DELETE'; Value: unknown }> => {
  const actions: Record<string, { Action: 'ADD' | 'PUT' | 'DELETE'; Value: unknown }> = {};
  Object.keys(updateActions).forEach((field) => {
    actions[field] = {
      Action: updateActions[field].action,
      Value: updateActions[field].value,
    };
  });
  return actions;
};

const op = (operator: UpdateOperators, value?: unknown): IUpdateAction => ({
  action: operator,
  value,
});

export const add = (value: unknown): IUpdateAction => op('ADD', value);
export const put = (value: unknown): IUpdateAction => op('PUT', value);
export const remove = (): IUpdateAction => op('DELETE');
