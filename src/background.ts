/* eslint-disable no-var */
declare var tf: typeof import('@tensorflow/tfjs') | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare var toxicity: typeof import('@tensorflow-models/toxicity') | undefined;
/* eslint-enable no-var */

type ToxicityClassifier = import('@tensorflow-models/toxicity').ToxicityClassifier

let model: ToxicityClassifier | undefined;

const initialize = async (): Promise<ToxicityClassifier> => {
  if (model) return model;
  let tox = globalThis.toxicity;
  if (globalThis.XMLHttpRequest) {
    await tf!.setBackend('webgl');
  } else {
    await import('@tensorflow/tfjs-node');
    tox = (await import('@tensorflow-models/toxicity')).default;
  }
  // @ts-expect-error this is an acceptable call
  model = await tox.load(0.8);
  return model;
};

const classify = async (tweets: string[]): Promise<Cleaner.Classification[]> => {
  if (!model) {
    model = await initialize();
  }
  const classifications = await model.classify(tweets);
  console.log(classifications);
  return classifications[classifications.length - 1].results.map(({ probabilities }) => {
    const probability = probabilities[0];
    if (probability < (1 / 3)) return 'negative';
    if (probability < (8 / 10)) return 'neutral';
    return 'positive';
  });
};

if (globalThis.XMLHttpRequest) {
  console.log('starting message handler');
  chrome.runtime.onConnect.addListener((port) => {
    console.log('got connection');
    port.onMessage.addListener(async ({ id, tweets }: { id: number; tweets: string[] }) => {
      await initialize();
      console.log('got message from port', tweets);
      port.postMessage({ id, classifications: await classify(tweets) });
    });
  });
}
