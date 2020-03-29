/* eslint-disable import/no-unresolved,no-unused-vars,no-console */
import { createTables } from './create-tables';
/* eslint-disable import/no-unresolved,no-unused-vars */

export default async (): Promise<void> => {
  try {
    await createTables();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
