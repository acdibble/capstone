/* eslint-disable func-names */
// eslint-disable-next-line @typescript-eslint/unbound-method
const oldOpen = window.XMLHttpRequest.prototype.open;

interface IncomingMessage {
  id: number;
  classifications: Analyzer.Result[];
}

let messageId = 1;
type Resolver = (payload: Analyzer.Result[]) => void
const callbackMap: Record<number, Resolver> = {};
const scriptTag = document.getElementById('extension-script-tag')!;

scriptTag.addEventListener('classified', (({ detail }: CustomEvent<IncomingMessage>): void => {
  try {
    (callbackMap[detail.id] as Resolver | undefined)?.(detail.classifications);
    delete callbackMap[detail.id];
  } catch {
    //
  }
}) as EventListener);

const getClassifications = async (tweets: Analyzer.Input[]): Promise<Analyzer.Result[]> => new Promise((resolve) => {
  const newMessageId = messageId++;
  callbackMap[newMessageId] = resolve;
  scriptTag.dispatchEvent(new CustomEvent('classify', { detail: { id: newMessageId, tweets } }));
});

/* eslint-disable no-param-reassign */
const filterTweets = async (tweetsObject: Record<string, Twitter.Tweet> | undefined): Promise<boolean> => {
  // console.log(await new Promise((resolve) => chrome.runtime.sendMessage({ message: 'ping' }, resolve)));
  if (!tweetsObject) return false;
  const tweetIds = Object.keys(tweetsObject);
  if (tweetIds.length === 0) return false;
  const tweets: Analyzer.Input[] = tweetIds.map((id) => {
    const {
      full_text: text,
      retweet_count: retweet,
      favorite_count: favorite,
      reply_count: reply,
      quote_count: quote,
    } = tweetsObject[id];
    return {
      id,
      text,
      totalReach: retweet + favorite + reply + quote,
    };
  });
  let filtered = false;
  for (const { id, result } of await getClassifications(tweets)) {
    if (result) {
      delete tweetsObject[id as string];
      filtered = true;
    }
  }
  return filtered;
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

      if ((await filterTweets(responseBody?.globalObjects?.tweets))) {
        Object.defineProperty(this, 'responseText', {
          get() {
            return JSON.stringify(responseBody);
          },
        });
      }
    }
  }

  opts.callback?.call(this);
};

window.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof oldOpen>) {
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

  return oldOpen.apply(this, args);
} as typeof oldOpen;
