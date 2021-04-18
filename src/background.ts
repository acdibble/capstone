/* eslint-disable no-var */
declare var tf: typeof import('@tensorflow/tfjs') | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare var toxicity: typeof import('@tensorflow-models/toxicity') | undefined;
/* eslint-enable no-var */

type ToxicityClassifier = import('@tensorflow-models/toxicity').ToxicityClassifier

let model: ToxicityClassifier | undefined;

const initialize = async (): Promise<ToxicityClassifier> => {
  let tox = globalThis.toxicity;
  if (globalThis.XMLHttpRequest) {
    import('@tensorflow/tfjs-backend-webgl');
    await tf!.setBackend('webgl');
  } else {
    await import('@tensorflow/tfjs-node');
    tox = (await import('@tensorflow-models/toxicity')).default;
  }
  // @ts-expect-error this is an acceptable call
  return tox.load(0.8);
};

const classify = async (tweets: string[]): Promise<('positive' | 'negative' | 'neutral')[]> => {
  if (!model) {
    model = await initialize();
  }
  const classifications = await model.classify(tweets);
  console.log(classifications);
  return classifications[classifications.length - 1]!.results.map(({ probabilities }) => {
    const probability = probabilities[0]!;
    if (probability < (1 / 3)) return 'negative';
    if (probability < (2 / 3)) return 'neutral';
    return 'positive';
  });
};

void classify(['you suck', "you're cool", 'i want to punch you']).then(console.log);
