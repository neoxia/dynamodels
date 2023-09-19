import Model from '../../src/base-model';
import { CommonFields } from '../models/common';

const generateBool = (i: number) => {
  if (i % 3 === 0) {
    return true;
  }
  return i % 3 === 1 ? false : null;
};

const generatePartial = (
  i: number,
  numericalKeys?: boolean,
): CommonFields & { rangekey: string | number } => ({
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
  model: Model<Record<string, unknown>>,
  hk: number,
  i: number,
  numericalKeys?: boolean,
) => {
  const entity: CommonFields & { rangekey: string | number } & { hashkey: string | number } = {
    hashkey: numericalKeys ? hk : `hashkey-${hk}`,
    ...generatePartial(i, numericalKeys),
  };
  try {
    await model.save(entity);
    return entity;
  } catch (e) {
    throw Error(`Could not save entity ${JSON.stringify(entity)}. Reason ${(e as Error).message}`);
  }
};

export default async (
  model: Model<Record<string, unknown>>,
  nbEntries: number,
  numericalKeys?: boolean,
): Promise<Array<CommonFields & { rangekey: string | number } & { hashkey: string | number }>> => {
  const promises: Array<
    Promise<CommonFields & { rangekey: string | number } & { hashkey: string | number }>
  > = [];
  for (let i = 0; i < Math.floor(nbEntries / 2); i += 1) {
    promises.push(save(model, 1, i, numericalKeys));
  }
  for (let i = Math.floor(nbEntries / 2); i < nbEntries; i += 1) {
    promises.push(save(model, 2, i, numericalKeys));
  }
  const results = await Promise.all(promises);
  return results.map((r) => r);
};

export const hashOnly = async (
  model: Model<Record<string, unknown>>,
  nbEntries: number,
  numericalKeys?: boolean,
): Promise<Array<CommonFields & { rangekey: string | number } & { hashkey: string | number }>> => {
  const promises: Array<
    Promise<CommonFields & { rangekey: string | number } & { hashkey: string | number }>
  > = [];
  for (let i = 0; i < Math.floor(nbEntries / 2); i += 1) {
    promises.push(save(model, i, i, numericalKeys));
  }
  for (let i = Math.floor(nbEntries / 2); i < nbEntries; i += 1) {
    promises.push(save(model, i, i, numericalKeys));
  }
  const results = await Promise.all(promises);
  return results.map((r) => r);
};
