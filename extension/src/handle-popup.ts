/* eslint-disable func-names */
import type { CountsObject } from './background.js';
import type Observable from './Observable.js';

type Counts = CountsObject<Observable<number>>
type Sentiment = 'positive' | 'negative'

const updateAverageSentiment = (document: Document, neg: number, pos: number): void => {
  const el = document.getElementById('average-sentiment');
  if (el) {
    // eslint-disable-next-line no-mixed-operators
    const perc = (Math.max(neg, pos) / (neg + pos) * 100).toFixed(1);
    el.innerText = `${perc}% ${neg > pos ? 'negative' : 'positive'}`;
  }
};

const updateTotal = (document: Document, type: Sentiment, amount: number): void => {
  const el = document.getElementById(`${type}-total`);
  if (el) {
    el.innerText = amount.toString();
  }
};

const updateAverageReach = (document: Document, type: Sentiment, total: number, totalReach: number): void => {
  const el = document.getElementById(`${type}-reach-average`);
  if (el) {
    el.innerText = `${(totalReach / total).toFixed(1)} engagements/${type} tweet`;
  }
};

const handleDisconnect = (callbacks: (() => void)[]) => (): void => {
  callbacks.forEach((cb) => {
    cb();
  });
};

const handlePopup = (counts: Counts, port: chrome.runtime.Port): void => {
  const {
    positive: { totalTweets: positiveTotal, totalReach: positiveReach },
    negative: { totalTweets: negativeTotal, totalReach: negativeReach },
  } = counts;

  const callbacks: (() => void)[] = [];
  port.onDisconnect.addListener(handleDisconnect(callbacks));
  const [{ document }] = chrome.extension.getViews({ type: 'popup' });
  console.log('test', document.getElementById('unique'));

  [negativeTotal, positiveTotal].forEach((obs) => {
    const unsubscribe = obs.watch(function (this: Observable<number>) {
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
    });
    callbacks.push(unsubscribe);
  });

  [positiveReach, negativeReach].forEach((obs) => {
    const unsubscribe = obs.watch(function (this: Observable<number>) {
      if (this === positiveReach) {
        updateAverageReach(document, 'positive', positiveTotal.value, this.value);
      } else {
        updateAverageReach(document, 'negative', negativeTotal.value, this.value);
      }
    });
    callbacks.push(unsubscribe);
  });
};

export default handlePopup;
