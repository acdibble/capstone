import { EventEmitter } from 'events';
import sqlite3 from 'sqlite3';
import { getAsset } from './utils.js';

interface Tweet {
  textID: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export default class Database {
  static async for(dbName: string): Promise<Database> {
    const db = new this(dbName);
    return db.initialize();
  }

  private readonly db: sqlite3.Database

  private constructor(dbName: string) {
    const assetPath = `${getAsset(dbName)}.sqlite`;
    this.db = new sqlite3.Database(assetPath);
  }

  private async runAsync(parts: TemplateStringsArray, ...args: unknown[]): Promise<void> {
    const sql = parts.join('?');
    return new Promise((resolve, reject) => {
      this.db.run(sql, args, (error) => (error ? reject(error) : resolve()));
    });
  }

  private async initialize(): Promise<this> {
    await this.runAsync`CREATE TABLE IF NOT EXISTS tweets (textID TEXT, text TEXT, sentiment TEXT)`;
    return this;
  }

  async insert({ textID, text, sentiment }: Tweet): Promise<void> {
    return this.runAsync`INSERT INTO tweets VALUES (${textID}, ${text}, ${sentiment})`;
  }

  async* [Symbol.asyncIterator](): AsyncGenerator<Tweet> {
    const emitter = new EventEmitter();

    this.db.each(
      'SELECT * FROM tweets',
      (error, result) => {
        if (error) {
          emitter.emit('error', error);
        } else {
          emitter.emit('tweet', result);
        }
      },
      (error) => {
        if (error) {
          emitter.emit('error', error);
        } else {
          emitter.emit('end', null);
        }
      },
    );

    let tweet: Tweet | null;
    const endPromise = new Promise<null>((resolve) => emitter.once('end', resolve));
    const errorPromise = new Promise<never>((_, reject) => emitter.once('error', reject));
    do {
      tweet = await Promise.race([
        new Promise<Tweet>((resolve) => emitter.once('tweet', resolve)),
        errorPromise,
        endPromise,
      ]);

      if (tweet) yield tweet;
    } while (tweet !== null);
  }
}
