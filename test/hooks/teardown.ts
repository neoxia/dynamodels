import { deleteTables } from './create-tables';

export default async (): Promise<void> => {
  console.log('Clearing database...');
  await deleteTables();
  process.exit(0);
};
