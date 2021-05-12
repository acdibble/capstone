import type { CountsObject } from './background.js';

export const entries = Object.entries as <T>(obj: T) => [keyof T, T[keyof T]][];

const values = Object.values as <T>(obj: T) => T[keyof T][];

export function* iterateCountsObject<T>(counts: CountsObject<T>): Iterable<T> {
  for (const obj of values(counts)) {
    yield* values(obj);
  }
}
