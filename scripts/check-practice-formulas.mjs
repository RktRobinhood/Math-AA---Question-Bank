import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { forQuestion } = require('../assets/js/practice-formulas.js');
const katex = require('../assets/vendor/katex/katex.min.js');
const ids = opts => forQuestion(opts).map(([id]) => id);
for (const course of ['aa-sl','aa-hl','ai-sl','ai-hl']) {
  const item = {kind:'generated'};
  const question = {course, calculator:false, level:3, paper:'P1',
    skills:['SL3.2.cosine-rule-angle','SL3.2.cosine-rule-angle','SL3.2.area-sine','SL3.2']};
  const test = {item, question, course};
  assert.deepEqual(ids(test), ['cosine-angle','triangle-area']);
  assert.deepEqual(ids({...test, question:{...question,calculator:true,paper:'P2'}}),ids(test));
  assert.deepEqual(ids({...test, item:{kind:'real'}}),[]);
  assert.deepEqual(ids({...test, tab:'worksheet'}),[]);
  assert.deepEqual(ids({...test, tab:'progress'}),[]);
  assert.deepEqual(ids({...test, course:'other'}),[]);
  const fixtures = [
    'SL1.2.nth-term','SL1.2.sum','SL1.3.nth-term','SL1.3.sum','SL3.2.cosine-rule-side',
    'SL3.2.cosine-rule-angle','SL3.2.sine-rule','SL3.2.area-sine','SL3.4.arc-length',
    'SL3.4.sector-area','SL3.1.distance-3d','SL3.1.midpoint-3d','SL2.7.discriminant',
    'SL4.11.conditional-formula','SL4.8.binomial-in-context','SL5.6.product-rule',
    'SL5.6.quotient-rule','SL5.6.chain-rule',
  ];
  assert.equal(ids({...test,question:{...question,skills:fixtures}}).length,18);
  for(const [, ,tex] of forQuestion({...test,question:{...question,skills:fixtures}})) {
    assert.match(katex.renderToString(tex,{throwOnError:true}), /katex/);
  }
  assert.deepEqual(ids({...test,question:{...question,skills:['SL3.2.some-other-skill'],stem:'Cosine rule'}}),[]);
}
assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/practice-formulas\.js/);
console.log('Practice references: all four courses, 18 parseable formulas, both paper styles, no archive, real fallback, worksheet, or keyword inference.');
