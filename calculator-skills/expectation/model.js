(function(root){
'use strict';
const SCALE=1000000n, DEN=SCALE*SCALE, simple='(?:\\d{1,3}(?:\\.\\d{0,6})?|\\.\\d{1,6})';
const decimal=new RegExp('^[+-]?'+simple+'$');
const worked=Object.freeze({x:Object.freeze(['-2','1','4']),p:Object.freeze(['0.25','0.35','0.4'])});
const standard=Object.freeze({x:Object.freeze(['0','3','8']),p:Object.freeze(['0.15','0.6','0.25'])});
const messageError='Use short signed decimals with up to six decimal places.';
function fixed(raw){
 if(typeof raw!=='string'&&typeof raw!=='number')throw new Error(messageError);
 const s=String(raw).trim().replaceAll('−','-');
 if(!decimal.test(s))throw new Error(messageError);
 const [whole,tail='']=s.replace(/^[+-]/,'').split('.');
 return (s.startsWith('-')?-1n:1n)*(BigInt(whole||0)*SCALE+BigInt(tail.padEnd(6,'0')));
}
function exact(value,scale=DEN){
 if(value===0n)return '0';const n=value<0n?-value:value;
 const digits=String(scale).length-1,tail=String(n%scale).padStart(digits,'0').replace(/0+$/,'');
 return (value<0n?'-':'')+String(n/scale)+(tail?'.'+tail:'');
}
function validate(ox,probs){
 if(!Array.isArray(ox)||!Array.isArray(probs)||ox.length!==probs.length||ox.length<2||ox.length>6)throw new Error('Enter two to six complete outcome–probability pairs.');
 const x=ox.map(fixed),p=probs.map(fixed);
 if(new Set(x).size!==x.length)throw new Error('Each possible outcome needs just one probability row.');
 if(p.some(v=>v<0n||v>SCALE))throw new Error('Every probability must be between zero and one.');
 if(p.reduce((a,b)=>a+b,0n)!==SCALE)throw new Error('The probabilities must add exactly to one.');
 return {x:x.map(v=>exact(v,SCALE)),p:p.map(v=>exact(v,SCALE))};
}
function request(p){
 const named=['case','example'].filter(k=>p.has(k)),any=['x','p'].some(k=>p.has(k));
 if(!any&&!named.length)return {data:standard,linked:false,error:''};
 if(!any&&named.length===1&&p.getAll(named[0]).length===1&&['demo','expectation-demo'].includes(p.get(named[0])))return {data:standard,linked:true,error:''};
 try{
  if(named.length||['x','p'].some(k=>p.getAll(k).length!==1||p.get(k).length>110))throw new Error('Supply one x list and one p list.');
  return {data:validate(p.get('x').split(','),p.get('p').split(',')),linked:true,error:''};
 }catch(e){return {data:standard,linked:true,error:'Invalid linked distribution. '+e.message+' The original Try task is ready.'};}
}
function expectation(d){const v=validate(d.x,d.p);return v.x.reduce((n,x,i)=>n+fixed(x)*fixed(v.p[i]),0n);}
function calculate(raw){
 if(typeof raw!=='string'||raw.length>155)throw new Error('Use a short weighted sum.');
 if(/[\d.]\s+[\d.]/.test(raw))throw new Error('Separate numbers with an operation.');
 const str=raw.replaceAll('−','-').replaceAll('×','*').replace(/\s/g,'');
 const tokens=str.match(new RegExp(simple+'|[+*()\\-]','g'))||[];
 if(!tokens.length||tokens.join('')!==str)throw new Error('Enter decimal numbers using +, −, × or parentheses.');
 let i=0;
 function factor(depth){
  if(depth>8)throw new Error('Use fewer nested brackets.');
  let sign=1n;if(tokens[i]==='-'||tokens[i]==='+'){if(tokens[i++]==='-')sign=-1n;}
  let n;
  if(tokens[i]==='('){i++;n=addition(depth+1);if(tokens[i++]!==')')throw new Error('Close every parenthesis.');}
  else{if(!tokens[i]||!decimal.test(tokens[i]))throw new Error('Complete the expression before pressing Enter.');n=fixed(tokens[i++])*SCALE;}
  return sign*n;
 }
 function product(depth){
  let n=factor(depth);
  while(tokens[i]==='*'){
   i++;const v=factor(depth);
   if(n*v%DEN!==0n)throw new Error('This focused rehearsal calculates to twelve exact decimal places.');
   n=n*v/DEN;
  }
  return n;
 }
 function addition(depth){
  let n=product(depth);
  while(tokens[i]==='+'||tokens[i]==='-'){const k=tokens[i++],m=product(depth);n=k==='+'?n+m:n-m;}
  return n;
 }
 const v=addition(0);if(i!==tokens.length)throw new Error('Check the operation or unmatched parenthesis.');
 return v;
}
const atom='(?:\\(('+'[+-]?'+simple+')\\)|('+'[+-]?'+simple+'))';
const pairPattern=new RegExp('^'+atom+'\\*'+atom+'$');
const atomPattern=new RegExp('^'+atom+'$');
const noSpace=s=>s.replace(/\s+/g,'').replaceAll('−','-').replaceAll('×','*');
function termParts(raw){
 // A plus inside an explicitly signed factor must not split the expression.
 let d=0,start=0,p=[];for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='(')d++;if(c===')')d--;
  if(c==='+'&&d===0&&i>start&&raw[i-1]!=='*'){p.push(raw.slice(start,i));start=i+1;}}
 p.push(raw.slice(start));return p;
}
function witness(raw,data){
 const terms=termParts(noSpace(raw));
 if(terms.length!==data.x.length)return '';
 const nums=terms.map(s=>s.match(atomPattern));
 if(nums.every(Boolean)&&nums.map(m=>fixed(m[1]??m[2]).toString()).sort().join()===data.p.map(v=>fixed(v).toString()).sort().join())return 'prob';
 const products=terms.map(s=>s.match(pairPattern));
 if(!products.every(Boolean))return '';
 const possibilities=products.map(m=>[fixed(m[1]??m[2]),fixed(m[3]??m[4])]);
 const want=data.x.map((v,i)=>[fixed(v),fixed(data.p[i])]);
 // Compare pairs, not just their products: equal incidental totals cannot complete this task.
 const matches=(j,used=0)=>{
  if(j===possibilities.length)return true;
  const [x,y]=possibilities[j];
  return want.some(([a,b],i)=>!(used&(1<<i))&&(x===a&&y===b||x===b&&y===a)&&matches(j+1,used|(1<<i)));
 };
 return matches(0)?'mean':'';
}
function start(data=standard){return {page:'calc',data,input:'',at:0,history:[],seen:{prob:false,mean:false},ctrl:false,error:''};}
function resetData(s,x,p){try{return start(validate(x,p));}catch(e){return {...s,error:e.message};}}
const digits=k=>/^[0-9]$/.test(k);
const chars={dot:'.',plus:'+',minus:'-',neg:'-',mul:'*',lparen:'(',rparen:')'};
function press(s,key){
 if(key==='ctrl')return {...s,ctrl:!s.ctrl};
 const mod=s.ctrl,b={...s,error:'',ctrl:false};
 if(key==='esc'||mod&&key==='del')return {...b,input:'',at:0};
 if(key==='left'||key==='right')return {...b,at:Math.max(0,Math.min(s.input.length,s.at+(key==='left'?-1:1)))};
 if(key==='up'&&s.history.length){const h=s.history.at(-1).raw;return {...b,input:h,at:h.length};}
 if(key==='del')return {...b,input:s.at?s.input.slice(0,s.at-1)+s.input.slice(s.at):s.input,at:Math.max(0,s.at-1)};
 if(key==='enter'||key==='select'){
  if(!s.input)return b;
  try{
   const raw=s.input,result=exact(calculate(raw)),type=witness(raw,s.data);
   return {...b,input:'',at:0,history:[...s.history,{raw,result,type}].slice(-4),seen:{...s.seen,...(type?{[type]:true}:{})}};
  }catch(e){return {...b,error:e.message};}
 }
 if((digits(key)||chars[key])&&s.input.length<155){const c=chars[key]||key;return {...b,input:s.input.slice(0,s.at)+c+s.input.slice(s.at),at:s.at+1};}
 return b;
}
function progress(s){
 if(s.seen.prob&&s.seen.mean)return 'Complete. You checked the total probability and found the weighted mean.';
 if(s.seen.prob)return 'Probabilities checked. Now multiply each outcome by its own probability and add.';
 if(s.seen.mean)return 'Weighted mean found. Check the probabilities separately by adding all of them.';
 if(s.history.length)return 'That calculation has not checked this table. Use the values from the same rows.';
 return '';
}
root.CT36=Object.freeze({worked,standard,exact,fixed,validate,expectation,calculate,witness,start,press,request,resetData,progress});
})(typeof window==='undefined'?globalThis:window);
