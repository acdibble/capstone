import use from '@tensorflow-models/universal-sentence-encoder';
import tf from '@tensorflow/tfjs-node-gpu';
import Database from './database.js';

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

const getDataSet = async (
  database: Database,
  limit?: number,
): Promise<{ texts: string[]; expected: [number, number][] }> => {
  const total = limit ?? (await database.query<{total: number}>`SELECT COUNT(1) as total FROM tweets`).total;
  const texts = Array(total) as string[];
  const expected = Array(total) as [number, number][];
  let count = 0;
  for await (const { text, sentiment } of database.random(limit)) {
    texts[count] = text;
    expected[count] = [
      sentiment === 'negative' ? 1 : 0,
      sentiment !== 'negative' ? 1 : 0,
    ];
    count += 1;
  }
  return { texts, expected };
};

const main = async (): Promise<void> => {
  const database = await Database.for('train');
  const [encoder, training, testing] = await Promise.all([
    use.load(),
    getDataSet(database, 100),
    getDataSet(database, 10),
  ]);
  console.log('embedding training data');
  const [trainingData, testingData] = await Promise.all([
    encoder.embed(training.texts),
    encoder.embed(testing.texts),
  ]);
  const outputData = tf.tensor2d(training.expected);
  outputData.print();
  const model = getModel();
  console.log('fitting model');
  const history = await model.fit(trainingData, outputData, { epochs: 200 });
  console.log(history);
  console.log(model.predict(testingData));
};

void main();
