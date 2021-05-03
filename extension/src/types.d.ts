/* eslint-disable camelcase */

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  declare var tf: typeof import('@tensorflow/tfjs');

  declare namespace Twitter {
    interface Tweet {
      created_at: string;
      id_str: string;
      full_text: string;
      retweet_count: number;
      favorite_count: number;
      reply_count: number;
      quote_count: number;
    }

    interface Response {
      globalObjects: {
        tweets?: Record<string, Tweet>;
      };
    }
  }

  declare namespace Analyzer {
    interface Input {
      id: string;
      text: string;
      totalReach: number;
    }

    interface Result {
      id: string;
      result: boolean;
    }
  }
}

export {};
