import use from '@tensorflow-models/universal-sentence-encoder';
import tf from '@tensorflow/tfjs-node-gpu';
import Database, { Sentiment, sentiments } from './database.js';

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
  intents: Record<Sentiment, [number, number][]>;
  textSentiments: string[];
}

const getDataSet = async (
  database: Database,
  limit?: number,
): Promise<DataSet> => {
  const total = limit ?? (await database.query<{total: number}>`SELECT COUNT(1) as total FROM tweets`).total;
  const texts = Array(total) as string[];
  const intents: Record<Sentiment, [number, number][]> = {
    negative: Array(total) as [number, number][],
    neutral: Array(total) as [number, number][],
    positive: Array(total) as [number, number][],
  };
  const textSentiments = Array(total) as string[];
  let count = 0;
  for await (const { text, sentiment } of database.random(limit)) {
    texts[count] = text;
    textSentiments[count] = sentiment;
    for (const s of sentiments) {
      intents[s][count] = [sentiment !== s ? 1 : 0, sentiment === s ? 1 : 0];
    }
    count += 1;
  }
  return { texts, intents, textSentiments };
};

const is = ([, match]: [number, number], label: string): Record<string, boolean> => ({ [label]: match > 0.9 });

const evaluate = async (models: tf.Sequential[], dataSet: DataSet, testData: tf.Tensor2D): Promise<void> => {
  const { texts, textSentiments } = dataSet;
  const results = models.map((model) => model.predict(testData));
  // @ts-expect-error test
  const numberResults = await Promise.all(results.map((result) => result.array() as Promise<[number, number][]>));
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < texts.length; i++) {
    console.log('%o', {
      text: texts[i],
      sentiment: textSentiments[i],
      ...numberResults.reduce((acc, result, j) => ({ ...acc, ...is(result[i], sentiments[j]) }), {}),
    });
  }
};

const main = async (): Promise<void> => {
  const database = await Database.for('train');
  const [encoder, training, testing] = await Promise.all([
    use.load(),
    getDataSet(database, 10000),
    getDataSet(database, 100),
  ]);
  console.log('embedding training data');
  const [trainingData, testData] = await Promise.all([
    encoder.embed(training.texts),
    encoder.embed(testing.texts),
  ]);
  const outputData = sentiments.map((sentiment) => tf.tensor2d(training.intents[sentiment]));
  const models = sentiments.map(() => getModel());
  console.log('fitting model');
  await Promise.all(models.map((model, i) => model.fit(trainingData, outputData[i], { epochs: 200 })));
  await evaluate(models, testing, testData);
};

void main();
