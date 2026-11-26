import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';

const box=createContext({});
const base=new URL('../calculator-skills/scratchpad/',import.meta.url);
for(const file of ['graph-general.js','normal-math.js','calc-tools.js','function-table.js']){
  runInContext(readFileSync(new URL(file,base),'utf8'),box,{filename:file});
}
const {parseRelation:parse}=box.NspireFunctionTable;
const near=(real,expected)=>assert.ok(Math.abs(real-expected)<=1e-12,real+' ≠ '+expected);
const term=parse('3+4(x-1)','DEG'), sum=parse('x(2*3+4(x-1))/2','DEG');
assert.deepEqual([term.evaluate(3),term.evaluate(4),sum.evaluate(4),sum.evaluate(5)],[11,15,36,55]);
near(parse('sin(x)','DEG').evaluate(30),.5);
near(parse('sin(x)','RAD').evaluate(Math.PI/6),.5);
assert.ok(Number.isNaN(parse('1/(x-2)').evaluate(2)));
const pmf=parse('binomPdf(5, .4, x)','DEG'),cdf=parse('binomCdf(5,.4,0,x)','DEG');
assert.equal(pmf.discrete,true);
near(pmf.evaluate(2),.3456);
near(cdf.evaluate(2),.68256);
near(cdf.evaluate(5),1);
for(const x of [-1,2.5,6])assert.ok(Number.isNaN(cdf.evaluate(x)));
const poiss=parse('poissPdf(2,x)','DEG');
near(poiss.evaluate(2),2*Math.exp(-2));
near(parse('poissCdf(2,0,x)','DEG').evaluate(2),5*Math.exp(-2));
assert.ok(Number.isNaN(parse('binomPdf(5,2,x)').evaluate(2)));
assert.throws(()=>parse('binomPdf(5,x)'));
assert.throws(()=>parse('binomPdf(5,.4,foo())'));
console.log('Scratchpad table: arithmetic term/sum, angle, undefined value, binomial/Poisson, and invalid input checks passed.');
