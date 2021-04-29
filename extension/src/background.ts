import Analyzer from './Analyzer.js';
import { entries, iterateCountsObject } from './utils.js';
import Observable from './Observable.js';
import handlePopup from './handle-popup.js';
import Cache from './Cache.js';

let model: Analyzer;

export type CountsObject<T> = { [S in 'negative' | 'positive']: { [C in 'totalReach' | 'totalTweets']: T } }
let classificationMap: Observable<Cache>;
let counts: CountsObject<Observable<number>>;

const serializeCounts = (): CountsObject<number> => counts && entries(counts)
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
    const result = classificationMap.value.get(tweet.id);
    if (result !== undefined) {
      alreadyClassifiedTweets.push({ id: tweet.id, result });
    } else {
      tweetsToClassify.push(tweet);
    }
  }

  return { alreadyClassifiedTweets, tweetsToClassify, classifiedTweets: await model.classify(tweetsToClassify) };
};

let timeout: ReturnType<typeof setTimeout> | undefined;
const updateStore = (): void => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    timeout = undefined;
    chrome.storage.local.set({
      classifications: classificationMap.value.toJSON(),
      counts: serializeCounts(),
    });
  }, 500);
};

const onMessage = (port: chrome.runtime.Port) => async ({ id, tweets }: { id: number; tweets: Analyzer.Input[] }) => {
  const { classifiedTweets, alreadyClassifiedTweets, tweetsToClassify } = await classify(tweets);
  port.postMessage({ id, classifications: classifiedTweets.concat(alreadyClassifiedTweets) });

  for (let i = 0; i < classifiedTweets.length; i++) {
    const { id: tweetId, totalReach } = tweetsToClassify[i];
    const { result } = classifiedTweets[i];
    classificationMap.update((cache) => cache.set(tweetId, result));
    const label = result ? 'negative' : 'positive';
    counts[label].totalReach.update((current) => current + totalReach);
    counts[label].totalTweets.update((current) => current + 1);
  }
};

interface Store {
  classifications?: Record<string, boolean>;
  counts?: CountsObject<number>;
}

const initialize = async ({
  counts: pastCounts = { positive: { totalReach: 0, totalTweets: 0 }, negative: { totalReach: 0, totalTweets: 0 } },
  classifications,
}: Store = {}): Promise<void> => {
  console.log(classifications);
  classificationMap = new Observable(new Cache(classifications));
  classificationMap.watch(updateStore, false);

  counts = hydrateCounts(pastCounts);
  counts.negative.totalTweets.watch(updateBadgeText);

  for (const obs of iterateCountsObject(counts)) {
    obs.watch(updateStore, false);
  }

  await tf.setBackend('webgl');
  model = await Analyzer.load();

  chrome.runtime.onConnect.addListener((port) => {
    switch (port.name) {
      case 'popup':
        return handlePopup(counts, port, classificationMap);
      case 'inject':
        return port.onMessage.addListener(onMessage(port));
      default:
        return console.error('got unexpected connection request');
    }
  });
};

chrome.storage.local.get(initialize);
