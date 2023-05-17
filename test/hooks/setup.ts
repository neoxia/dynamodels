import { createTables } from './create-tables';

export default async (): Promise<void> => {
  try {
    await createTables();
  } catch (e) {
    console.error('Fatal: Cannot create table for tests', e);
    process.exit(1);
  }
};
