/* eslint-disable func-names */
// eslint-disable-next-line @typescript-eslint/unbound-method
const oldOpen = window.XMLHttpRequest.prototype.open;

interface TraversalObject {
  tweets: Record<string, Twitter.Tweet>;
  tweetPaths: Record<string, (string | number)[]>;
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
/* eslint-disable guard-for-in */
function traverse(obj: Record<string, any> | Record<string, any>[]): TraversalObject
function traverse(
  obj: Record<string, any> | Record<string, any>[],
  paths: (string | number)[],
  ret: TraversalObject,
): undefined
function traverse(
  obj: Record<string, any> | Record<string, any>[],
  paths: (string | number)[] = [],
  { tweets, tweetPaths }: TraversalObject = { tweets: {}, tweetPaths: {} },
): TraversalObject | undefined {
  for (const key in obj) {
    if (key === 'tweet') {
      const tweet = obj[key as keyof typeof obj].legacy as Twitter.Tweet;
      tweets[tweet.id_str] = tweet;
      tweetPaths[tweet.id_str] = [...paths, 'tweet'];
      return;
    }
    paths.push(key);
    const value = obj[key as keyof typeof obj];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      traverse(value as Record<string, unknown>, paths, { tweetPaths, tweets });
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        paths.push(i);
        traverse(value[i], paths, { tweetPaths, tweets });
        paths.pop();
      }
    }
    paths.pop();
  }

  // eslint-disable-next-line consistent-return
  return { tweetPaths, tweets };
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable no-param-reassign */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable guard-for-in */

interface IncomingMessage {
  id: number;
  classifications: Analyzer.Result[];
}

let messageId = 1;
type Resolver = (payload: Analyzer.Result[]) => void
const callbackMap: Record<number, Resolver> = {};
const scriptTag = document.getElementById('extension-script-tag') as HTMLElement;

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
  if (!tweetsObject) return false;
  const tweetIds = Object.keys(tweetsObject);
  if (tweetIds.length === 0) return false;
  console.time('classification');
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
      delete tweetsObject[id];
      filtered = true;
    }
  }
  return filtered;
};
/* eslint-enable no-param-reassign */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
const filterGraphQLResponse = async (responseBody: Record<string, any>): Promise<boolean> => {
  const instructions = responseBody.data?.user?.result?.timeline?.timeline?.instructions;
  if (!instructions) return false;
  const { tweets, tweetPaths } = traverse(instructions);
  const filtered = await filterTweets(tweets);
  if (!filtered) return false;
  for (const [tweetId, parts] of Object.entries(tweetPaths)) {
    // eslint-disable-next-line no-continue
    if (tweetId in tweets) continue;
    const path = [];
    let numberFound = false;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!numberFound && typeof parts[i] === 'number') numberFound = true;
      if (numberFound) path.push(parts[i]);
    }
    let obj = instructions;
    while (path.length > 1) {
      obj = obj[path.pop()!];
    }
    delete obj[path[0]];
  }
  return true;
};
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-explicit-any */

interface CreateCallbackOpts {
  callback?: (this: XMLHttpRequest) => void;
}

const createCallback = (opts: CreateCallbackOpts) => async function (this: XMLHttpRequest) {
  if (this.readyState === XMLHttpRequest.DONE) {
    const { status } = this;
    if (status >= 200 && status < 300) {
      const responseBody = JSON.parse(this.responseText) as Twitter.Response;

      let filtered: boolean;

      if (/graphql\/[\w\d]+\/UserTweets/.test(this.responseURL)) {
        filtered = await filterGraphQLResponse(responseBody);
      } else {
        filtered = await filterTweets(responseBody?.globalObjects?.tweets);
      }
      if (filtered) {
        console.timeEnd('classification');
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
