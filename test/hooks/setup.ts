import { createTables } from './create-tables';

export default async (): Promise<void> => {
  try {
    await createTables();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
