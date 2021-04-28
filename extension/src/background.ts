import Analyzer from './Analyzer.js';
import { entries } from './utils.js';
import Observable from './Observable.js';

let model: Analyzer;

type CountsObject<T> = { [S in 'negative' | 'positive']: { [C in 'totalReach' | 'totalTweets']: T } }
let classificationMap: Record<string, boolean>;
let counts: CountsObject<Observable<number>>;

const serializeCounts = (): CountsObject<number> => entries(counts)
  .reduce((acc, [label, totals]) => {
    acc[label] = entries(totals).reduce((acc2, [total, observable]) => {
      // eslint-disable-next-line no-param-reassign
      acc2[total] = observable.value;
      return acc2;
    }, {} as CountsObject<number>['positive' | 'negative']);
    return acc;
  }, {} as CountsObject<number>);

const hydrateCounts = (pastCounts: CountsObject<number>): CountsObject<Observable<number>> => entries(pastCounts)
  .reduce((acc, [label, totals]) => {
    acc[label] = entries(totals).reduce((acc2, [total, amount]) => {
      // eslint-disable-next-line no-param-reassign
      acc2[total] = new Observable(amount);
      return acc2;
    }, {} as CountsObject<Observable<number>>['positive' | 'negative']);
    return acc;
  }, {} as CountsObject<Observable<number>>);

const updateBadgeText = (amount: number): void => {
  const badgeText = amount > 1000 ? '999+' : amount.toString();
  chrome.browserAction.setBadgeText({ text: badgeText });
};

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

  return { alreadyClassifiedTweets, tweetsToClassify, classifiedTweets: await model.classify(tweetsToClassify) };
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
    counts[label].totalReach.update((current) => current + totalReach);
    counts[label].totalTweets.update((current) => current + 1);
  }

  chrome.storage.local.set({ classifications: classificationMap, counts: serializeCounts() });
};

interface Store {
  classifications?: Record<string, boolean>;
  counts?: CountsObject<number>;
}

const initialize = async ({
  counts: pastCounts = { positive: { totalReach: 0, totalTweets: 0 }, negative: { totalReach: 0, totalTweets: 0 } },
  classifications,
}: Store = {}): Promise<void> => {
  classificationMap = classifications ?? {};
  counts = hydrateCounts(pastCounts);

  counts.negative.totalTweets.watch(updateBadgeText);

  await tf.setBackend('webgl');
  model = await Analyzer.load();

  chrome.runtime.onConnect.addListener((port) => {
    console.log('got connection');
    port.onMessage.addListener(onMessage(port));
  });
};

chrome.storage.local.get(initialize);
