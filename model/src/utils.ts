import * as path from 'path';
import * as url from 'url';

const getDirectory = (fileURL: string): string => path.dirname(url.fileURLToPath(fileURL));

const ASSETS_DIR = path.resolve(getDirectory(import.meta.url), '..', 'assets');

// eslint-disable-next-line import/prefer-default-export
export const getAsset = (name: string): string => path.join(ASSETS_DIR, name);
