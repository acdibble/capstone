const getUniqueStrings = (strings: string[]): string[] => [
  ...new Set(strings.flatMap((string) => string.split(/\s+/))),
];

export default getUniqueStrings;
