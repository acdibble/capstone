import fs from 'fs';
import url from 'url';
import use from '@tensorflow-models/universal-sentence-encoder';
import tf from '@tensorflow/tfjs-node-gpu';
import Database from '../database.js';
import { getAsset } from '../utils.js';
import getModel from './getModel.js';
import getDataSet, { DataSet, DataSetWithIntents } from './getDataSet.js';

const evaluate = async (model: tf.Sequential, dataSet: DataSet, testData: tf.Tensor2D): Promise<void> => {
  const { texts, textSentiments } = dataSet;
  const results = await (model.predict(testData) as tf.Tensor).array() as [number, number][];
  const printables = texts.map((text, i) => ({
    text,
    sentiment: textSentiments[i],
    result: results[i],
    success: results[i][Number(textSentiments[i] === 'negative')] >= 0.9,
  }));
  await fs.promises.writeFile(getAsset('results.json'), JSON.stringify(printables, null, 2), 'utf8');
};

const main = async (): Promise<void> => {
  const trainingDb = await Database.for('train');
  const encoder = await use.load();
  let training: DataSetWithIntents | null = await getDataSet(trainingDb, true);
  console.log('embedding training data');
  const trainingData = await encoder.embed(training.texts);
  const outputData = tf.tensor2d(training.intents);
  const model = getModel();
  console.log('fitting model');
  await model.fit(trainingData, outputData, { epochs: 200 });
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
