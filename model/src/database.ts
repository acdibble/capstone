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

  query<T>(parts: TemplateStringsArray, ...args: unknown[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(parts.join('?'), args, (error, result) => (error ? reject(error) : resolve(result)));
    });
  }

  all(): Promise<Tweet[]> {
    return this.query`SELECT trim(lower(text)) as text, sentiment FROM tweets ORDER BY RANDOM()`;
  }
}
