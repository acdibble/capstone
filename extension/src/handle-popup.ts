/* eslint-disable func-names */
import type { CountsObject } from './background.js';
import type Cache from './Cache.js';
import type Observable from './Observable.js';
import { iterateCountsObject } from './utils.js';

type Counts = CountsObject<Observable<number>>
type Sentiment = 'positive' | 'negative'

const reset = (counts: Counts): void => {
  for (const obs of iterateCountsObject(counts)) {
    obs.update(0);
  }
};

const updateAverageSentiment = (document: Document, neg: number, pos: number): void => {
  const el = document.getElementById('average-sentiment');
  if (el) {
    // eslint-disable-next-line no-mixed-operators
    let perc = Math.max(neg, pos) / (neg + pos) * 100;
    if (Number.isNaN(perc)) perc = 0;
    el.innerText = `${perc.toFixed(1)}% ${neg > pos ? 'negative' : 'positive'}`;
  }
};

const updateTotal = (document: Document, type: Sentiment, amount: number): void => {
  const el = document.getElementById(`${type}-total`);
  if (el) {
    el.innerText = `${amount} ${type} tweets`;
  }
};

const updateAverageReach = (document: Document, type: Sentiment, total: number, totalReach: number): void => {
  const el = document.getElementById(`${type}-reach-average`);
  if (el) {
    const average = total === 0 ? 0 : totalReach / total;
    el.innerText = `${average.toFixed(1)} engagements/${type} tweet`;
  }
};

const handleDisconnect = (callbacks: (() => void)[]) => (): void => {
  callbacks.forEach((cb) => {
    cb();
  });
};

export interface Message {
  action: 'reset';
}

const handleMessage = (counts: Counts, classificationMap: Observable<Cache>) => (message: Message): void => {
  switch (message.action) {
    case 'reset':
      classificationMap.update((cache) => cache.clear());
      reset(counts);
      return chrome.storage.local.clear();
    default:
      return console.error('got unexpected message from popup');
  }
};

const handlePopup = (counts: Counts, port: chrome.runtime.Port, classificationMap: Observable<Cache>): void => {
  const callbacks: (() => void)[] = [];
  port.onDisconnect.addListener(handleDisconnect(callbacks));
  port.onMessage.addListener(handleMessage(counts, classificationMap));

  const {
    positive: { totalTweets: positiveTotal, totalReach: positiveReach },
    negative: { totalTweets: negativeTotal, totalReach: negativeReach },
  } = counts;

  const [{ document }] = chrome.extension.getViews({ type: 'popup' });

  callbacks.push(...[negativeTotal, positiveTotal]
    .map((obs) => obs.onChange(function (this: Observable<number>) {
      // handle average
      updateAverageSentiment(document, negativeTotal.value, positiveTotal.value);
      // handle total per category
      if (this === negativeTotal) {
        updateTotal(document, 'negative', this.value);
        updateAverageReach(document, 'negative', this.value, negativeReach.value);
      } else {
        updateTotal(document, 'positive', this.value);
        updateAverageReach(document, 'positive', this.value, positiveReach.value);
      }
    })));

  callbacks.push(...[positiveReach, negativeReach].map((obs) => obs.onChange(function (this: Observable<number>) {
    if (this === positiveReach) {
      updateAverageReach(document, 'positive', positiveTotal.value, this.value);
    } else {
      updateAverageReach(document, 'negative', negativeTotal.value, this.value);
    }
  })));
};

export default handlePopup;
