import tf from '@tensorflow/tfjs-node-gpu';

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

export default getModel;
