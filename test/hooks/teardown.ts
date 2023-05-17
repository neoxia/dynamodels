import { deleteTables } from './create-tables';

export default async (): Promise<void> => {
  try {
    console.log('Clearing database...');
    await deleteTables();
  } catch (e) {
    console.error('Fatal: Error cleaning database', e);
    process.exit(1);
  }

};
