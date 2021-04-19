import Database from './database.js';

const main = async (): Promise<void> => {
  const database = await Database.for('train');
  let count = 0;
  for await (const _ of database) {
    count += 1;
  }
  console.log(count);
};

void main();
