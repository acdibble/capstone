import Database from '../database.js';
import preprocess from './preprocess.js';

export interface DataSet {
  texts: string[];
  textSentiments: string[];
}

export interface DataSetWithIntents extends DataSet {
  intents: [number, number][];
}

async function getDataSet(database: Database, returnIntents: false): Promise<DataSet>
async function getDataSet(database: Database, returnIntents: true): Promise<DataSetWithIntents>
async function getDataSet(database: Database, returnIntents: boolean): Promise<DataSet | DataSetWithIntents> {
  const [{ total }] = await database.query<{ total: number }>`SELECT COUNT(1) as total FROM tweets`;
  const texts = Array(total) as string[];
  const intents = Array(returnIntents ? 0 : total) as [number, number][];
  const textSentiments = Array(total) as string[];
  const tweets = await database.all();
  for (let i = 0; i < tweets.length; i++) {
    const { text, sentiment } = tweets[i];
    texts[i] = preprocess(text);
    textSentiments[i] = sentiment;
    if (returnIntents) intents[i] = [sentiment !== 'negative' ? 1 : 0, sentiment === 'negative' ? 1 : 0];
  }
  return returnIntents ? { texts, intents, textSentiments } : { texts, textSentiments };
}

export default getDataSet;
