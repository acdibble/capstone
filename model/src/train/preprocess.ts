const preprocess = (text: string): string => text
  .replace(/https?:\/\/[^ ]+/g, '')
  .replace(/#\w+/g, '')
  .replace(/[^a-z ]/gi, '')
  .replace(/(\w)\1(\1)+/g, '$1$1')
  .trim();

export default preprocess;
