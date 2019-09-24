/* eslint-disable import/no-unresolved,no-unused-vars,no-console */
import { deleteTables } from './create-tables';
/* eslint-enable import/no-unresolved,no-unused-vars */

export default async (): Promise<void> => {
  console.log('Clearing database...');
  await deleteTables();
  process.exit(0);
};
