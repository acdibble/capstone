/* eslint-disable func-names */
/// <reference types="@types/chrome" />
/// <reference path="types.d.ts" />

// eslint-disable-next-line @typescript-eslint/unbound-method
const oldOpen = window.XMLHttpRequest.prototype.open;

/* eslint-disable no-param-reassign */
const modifyRequest = async (tweetsObject: Record<string, Twitter.Tweet>): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(Object.keys(tweetsObject).length);
};

interface CreateCallbackOpts {
  callback?: (this: XMLHttpRequest) => void;
}

const createCallback = (opts: CreateCallbackOpts) => async function (this: XMLHttpRequest) {
  if (this.readyState === XMLHttpRequest.DONE) {
    const { status } = this;
    if (status >= 200 && status < 300) {
      const responseBody = JSON.parse(this.responseText) as Twitter.Response;

      await modifyRequest(responseBody.globalObjects.tweets);

      Object.defineProperty(this, 'responseText', {
        get() {
          return JSON.stringify(responseBody);
        },
      });
    }
  }

  opts.callback?.call(this);
};
/* eslint-enable no-param-reassign */

window.XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: Parameters<typeof oldOpen>) {
  if (new URL(args[1]).pathname === '/i/api/2/timeline/home.json') {
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
