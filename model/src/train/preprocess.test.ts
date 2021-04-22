import assert from 'assert';
import preprocess from './preprocess.js';

assert.strictEqual(
  preprocess('http://www.dothebouncy.com/smf - some shameless plugging for the best Rangers forum on earth'),
  'some shameless plugging for the best Rangers forum on earth',
);

assert.strictEqual(
  preprocess('THANK YYYYYYYYYOOOOOOOOOOUUUUU!'),
  'THANK YYOOUU',
);
