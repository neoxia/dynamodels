import { ChildProcess, spawn } from 'child_process';

export const spawnDynamoDB = async (port: number): Promise<ChildProcess> => {
  return new Promise((resolve, reject) => {
    const cmd = 'npx';
    const args = [];
    args.push('sls', 'dynamodb', 'start', '--port', port.toString());
    const localDynamo = spawn(cmd, args);
    localDynamo.stdout.on('data', (data) => {
      if (process.env.VERBOSE) {
        console.log(data.toString());
      }
      if (data.includes('Dynamodb Local Started')) {
        return resolve(localDynamo);
      }
    });
    localDynamo.stderr.on('data', (err) => {
      console.error(err.toString());
      return reject(err);
    });
    localDynamo.on('close', (code: number) => {
      return reject(`Local DynamoDB exited with code ${code} without starting`);
    });
    const timeout =
      process.env.LOCAL_DDB_TIMEOUT && Number.isInteger(Number(process.env.LOCAL_DDB_TIMEOUT))
        ? Number(process.env.LOCAL_DDB_TIMEOUT)
        : 60000;
    setTimeout(() => {
      return reject(`Local DynamoDB did not start within ${timeout} milliseconds`);
    }, timeout);
  });
};
