/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import Analyzer from './Analyzer.js';

let model: Analyzer;

type CountsObject = { [S in 'negative' | 'positive']: { [C in 'totalReach' | 'totalTweets']: number } }
let classificationMap: Record<string, boolean>;
let counts: CountsObject;

interface ClassifyResult {
  classifiedTweets: Analyzer.Result[];
  alreadyClassifiedTweets: Analyzer.Result[];
  tweetsToClassify: Analyzer.Input[];
}

const classify = async (tweets: Analyzer.Input[]): Promise<ClassifyResult> => {
  const tweetsToClassify: Analyzer.Input[] = [];
  const alreadyClassifiedTweets: Analyzer.Result[] = [];
  for (const tweet of tweets) {
    const result = classificationMap[tweet.id];
    if (result !== undefined) {
      alreadyClassifiedTweets.push({ id: tweet.id, result });
    } else {
      tweetsToClassify.push(tweet);
    }
  }

  const classifiedTweets = await model.classify(tweetsToClassify);
  return { classifiedTweets, alreadyClassifiedTweets, tweetsToClassify };
};

console.log('starting message handler');

const onMessage = (port: chrome.runtime.Port) => async ({ id, tweets }: { id: number; tweets: Analyzer.Input[] }) => {
  console.log('got message from port', tweets);
  const { classifiedTweets, alreadyClassifiedTweets, tweetsToClassify } = await classify(tweets);
  port.postMessage({ id, classifications: classifiedTweets.concat(alreadyClassifiedTweets) });

  for (let i = 0; i < classifiedTweets.length; i++) {
    const { id: tweetId, totalReach } = tweetsToClassify[i];
    const { result } = classifiedTweets[i];
    classificationMap[tweetId] = result;
    const label = result ? 'negative' : 'positive';
    counts[label].totalReach += totalReach;
    counts[label].totalTweets += 1;
  }

  console.log(classifiedTweets);
  console.log(counts);
  chrome.storage.local.set({
    classifications: classificationMap,
    counts,
  });
};

interface Store {
  classifications?: Record<string, boolean>;
  counts?: CountsObject;
}

const initialize = async ({ counts: pastCounts, classifications }: Store = {}): Promise<void> => {
  classificationMap = classifications ?? {};
  counts = pastCounts ?? { positive: { totalReach: 0, totalTweets: 0 }, negative: { totalReach: 0, totalTweets: 0 } };
  await tf.setBackend('webgl');
  model = await Analyzer.load();
  chrome.runtime.onConnect.addListener((port) => {
    console.log('got connection');
    port.onMessage.addListener(onMessage(port));
  });
};

chrome.storage.local.get(initialize);
