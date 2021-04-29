import type { CountsObject } from './background.js';

export const keys = Object.keys as <T>(obj: T) => (keyof T)[];

export const entries = Object.entries as <T>(obj: T) => [keyof T, T[keyof T]][];

export const values = Object.values as <T>(obj: T) => T[keyof T][];

export function* iterateCountsObject<T>(counts: CountsObject<T>): Iterable<T> {
  for (const obj of values(counts)) {
    for (const value of values(obj)) {
      yield value;
    }
  }
}
