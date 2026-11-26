import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
const vm=createContext({});
for(const file of ['graph-general.js','graph-mathprint.js']){
 runInContext(readFileSync(new URL('../calculator-skills/scratchpad/'+file,import.meta.url),'utf8'),vm,{filename:file});
}
const {serialize}=vm.NspireGraphMathPrint;
const t=text=>({text}),power=(...exp)=>({kind:'power',exp}),frac=(top,bottom)=>({kind:'fraction',top,bottom});
const analyze=(r,x)=>vm.TIGraphGeneral.parse(serialize(r)).evaluate(x);
assert.equal(serialize([t('x'),power(t('2'))]),'x^(2)');
assert.equal(analyze([t('x'),power(t('2')),t('+'),frac([t('x+1')],[t('2')])],3),11);
assert.equal(analyze([frac([t('x'),power(t('2'))],[t('x+1')])],3),9/4);
assert.equal(analyze([frac([frac([t('1')],[t('2')])],[t('3')]),power(t('2'))],1),1/36);
assert.throws(()=>serialize([t('x'),power(t(''))]),/exponent/i);
assert.throws(()=>serialize([frac([t('x')],[t(' ')])]),/denominator/i);
console.log('Graph MathPrint: six serialization and evaluator checks passed.');
