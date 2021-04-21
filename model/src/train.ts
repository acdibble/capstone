import url from 'url';
import use from '@tensorflow-models/universal-sentence-encoder';
import tf from '@tensorflow/tfjs-node-gpu';
import Database from './database.js';
import { getAsset } from './utils.js';

const getModel = (): tf.Sequential => {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [512],
    activation: 'sigmoid',
    units: 2,
  }));

  model.add(tf.layers.dense({
    inputShape: [2],
    activation: 'sigmoid',
    units: 2,
  }));

  model.add(tf.layers.dense({
    inputShape: [2],
    activation: 'sigmoid',
    units: 2,
  }));

  model.compile({
    loss: 'meanSquaredError',
    optimizer: tf.train.adam(0.06), // This is a standard compile config
  });

  return model;
};

interface DataSet {
  texts: string[];
  textSentiments: string[];
}

interface DataSetWithIntents extends DataSet {
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
    texts[i] = text.replace(/[^a-z ]/gi, '');
    textSentiments[i] = sentiment;
    if (returnIntents) intents[i] = [sentiment !== 'negative' ? 1 : 0, sentiment === 'negative' ? 1 : 0];
  }
  return returnIntents ? { texts, intents, textSentiments } : { texts, textSentiments };
}

const evaluate = async (model: tf.Sequential, dataSet: DataSet, testData: tf.Tensor2D): Promise<void> => {
  const { texts, textSentiments } = dataSet;
  // @ts-expect-error another bad typing
  const results = await model.predict(testData).array() as [number, number][];
  for (let i = 0; i < texts.length; i++) {
    console.log('%o', {
      text: texts[i],
      sentiment: textSentiments[i],
      result: results[i],
      success: textSentiments[i] === 'negative' ? results[i][1] > 0.9 : results[i][1] < 0.9,
    });
  }
};

const main = async (): Promise<void> => {
  const trainingDb = await Database.for('train');
  const encoder = await use.load();
  let training: DataSetWithIntents | null = await getDataSet(trainingDb, true);
  console.log('embedding training data');
  let trainingData: tf.Tensor2D | null = null;
  for (let i = 0; i < training.texts.length; i += 100) {
    const tempData = await encoder.embed(training.texts.slice(i, i + 100));
    trainingData = trainingData?.concat(tempData) ?? tempData;
  }
  if (trainingData === null) throw new Error();
  const outputData = tf.tensor2d(training.intents);
  const model = getModel();
  console.log('fitting model');
  await model.fit(trainingData, outputData, { epochs: 300 });
  console.log('saving model');
  const modelpath = url.pathToFileURL(getAsset('trained-model'));
  await model.save(modelpath.toString());
  training = null;
  trainingData.dispose();
  outputData.dispose();
  const testingDb = await Database.for('test');
  const testing = await getDataSet(testingDb, false);
  const testData = await encoder.embed(testing.texts);
  await evaluate(model, testing, testData);
};

void main();
