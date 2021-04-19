import * as fs from 'fs';
import csvParser from 'csv-parser';
import { getAsset } from './utils.js';
import Database from './database.js';

const main = async (): Promise<void> => {
  const dbName = process.argv[2];
  const stream = fs.createReadStream(getAsset(`${dbName}.csv`), 'utf8')
    .pipe(csvParser());

  const database = await Database.for(dbName);

  for await (const obj of stream) {
    // console.log(obj);
    await database.insert(obj);
  }
};

void main();
