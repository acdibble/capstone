/* eslint-disable func-names */
/// <reference types="@types/chrome" />
/// <reference path="types.d.ts" />

// eslint-disable-next-line @typescript-eslint/unbound-method
const oldOpen = window.XMLHttpRequest.prototype.open;

type Classification = 'positive' | 'negative' | 'neutral'

interface IncomingMessage {
  id: number;
  classifications: Classification[];
}

let id = 1;
const callbackMap: Record<number, (payload: Classification[]) => void> = {};
const scriptTag = document.getElementById('extension-script-tag')!;

scriptTag.addEventListener('classified', ((message: CustomEvent<IncomingMessage>): void => {
  try {
    console.log('received classified event');
    console.log('message', message);
    callbackMap[message.detail.id]?.(message.detail.classifications);
    delete callbackMap[message.detail.id];
  } catch (e) {
    console.error('error in callback');
    console.error(e);
  }
}) as EventListener);

// TODO: add caching?
const getClassifications = async (tweets: string[]): Promise<Classification[]> => new Promise((resolve) => {
  const messageId = id++;
  callbackMap[messageId] = resolve;
  console.log('dispatching ping message');
  scriptTag.dispatchEvent(new CustomEvent('classify', { detail: { id: messageId, tweets } }));
});

/* eslint-disable no-param-reassign */
const filterTweets = async (tweetsObject: Record<string, Twitter.Tweet>): Promise<void> => {
  // console.log(await new Promise((resolve) => chrome.runtime.sendMessage({ message: 'ping' }, resolve)));
  const tweetIds = Object.keys(tweetsObject);
  if (tweetIds.length === 0) return;
  const tweets = tweetIds.map((tweetId) => tweetsObject[tweetId]!.full_text);
  const classifications = await getClassifications(tweets);
  for (let i = 0; i < classifications.length; i++) {
    if (classifications[i] === 'negative') {
      console.log('found negative tweet', tweets[i]);
      delete tweetsObject[tweetIds[i]!];
    }
  }
};
/* eslint-enable no-param-reassign */

interface CreateCallbackOpts {
  callback?: (this: XMLHttpRequest) => void;
}

const createCallback = (opts: CreateCallbackOpts) => async function (this: XMLHttpRequest) {
  if (this.readyState === XMLHttpRequest.DONE) {
    const { status } = this;
    if (status >= 200 && status < 300) {
      const responseBody = JSON.parse(this.responseText) as Twitter.Response;

      if ('tweets' in responseBody.globalObjects) {
        await filterTweets(responseBody.globalObjects.tweets!);
      }

      Object.defineProperty(this, 'responseText', {
        get() {
          return JSON.stringify(responseBody);
        },
      });
    }
  }

  opts.callback?.call(this);
};

const re = new RegExp(String.raw`/i/api/2/(timeline|notifications)/(profile/)?(home|all|\d+).json`);

window.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof oldOpen>) {
  const { pathname } = new URL(args[1]);
  if (re.test(pathname)) {
    const opts: CreateCallbackOpts = {};

    this.onreadystatechange = createCallback(opts);

    Object.defineProperty(this, 'onreadystatechange', {
      get() {
        return opts.callback;
      },
      set(value: ((this: XMLHttpRequest) => void)) {
        opts.callback = value;
      },
    });
  }

  return oldOpen.apply(this, args);
} as typeof oldOpen;
