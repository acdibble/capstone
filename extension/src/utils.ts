/* eslint-disable import/prefer-default-export */

export const entries = Object.entries as <T>(obj: T) => [keyof T, T[keyof T]][];
