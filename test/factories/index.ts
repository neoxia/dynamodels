/* eslint-disable import/no-unresolved,no-unused-vars */
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Model from '../../src/base-model';
/* eslint-enable import/no-unresolved,no-unused-vars */

const generateBool = (i: number) => {
  if (i % 3 === 0) {
    return true;
  }
  return i % 3 === 1 ? false : null;
};

const generatePartial = (i: number, numericalKeys?: boolean): any => ({
  rangekey: numericalKeys ? i : `rangekey-${i}`,
  number: i % 2 === 0 ? i : null,
  bool: generateBool(i),
  string: i % 2 === 0 ? `string-${i}` : null,
  stringset: i % 2 === 0 ? [`string-${i}-0`, `string-${i}-1`, `string-${i}-2`] : null,
  list: i % 2 === 0 ? [i, `item-${i}`] : null,
  stringmap: i % 2 === 0 ? { [`key${i}`]: `value-${i}` } : null,
  optionalNumber: i % 2 === 0 ? i : undefined,
  optionalBool: i % 2 === 0 ? true : undefined,
  optionalString: i % 2 === 0 ? `string-${i}` : undefined,
  optionalStringset: i % 2 === 0 ? [`string-${i}-0`, `string-${i}-1`, `string-${i}-2`] : undefined,
  optionalList: i % 2 === 0 ? [i, `item-${i}`] : undefined,
  optionalStringmap: i % 2 === 0 ? { [`key-${i}`]: `value-${i}` } : undefined,
});

const save = async (
  model: Model<any>,
  hk: number,
  i: number,
  numericalKeys?: boolean,
): Promise<Partial<DocumentClient.PutItemInput>> => {
  const entity = {
    hashkey: numericalKeys ? hk : `hashkey-${hk}`,
    ...generatePartial(i, numericalKeys),
  };
  try {
    const res = await model.save(entity);
    return res;
  } catch (e) {
    throw Error(`Could not save entity ${JSON.stringify(entity)}. Reason ${e.message}`);
  }
};

export default async (
  model: Model<any>,
  nbEntries: number,
  numericalKeys?: boolean,
): Promise<any> => {
  const promises: Array<Promise<Partial<DocumentClient.PutItemInput>>> = [];
  for (let i = 0; i < Math.floor(nbEntries / 2); i += 1) {
    promises.push(save(model, 1, i, numericalKeys));
  }
  for (let i = Math.floor(nbEntries / 2); i < nbEntries; i += 1) {
    promises.push(save(model, 2, i, numericalKeys));
  }
  return Promise.all(promises);
};
