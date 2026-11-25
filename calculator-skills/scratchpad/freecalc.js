(function(host){
  'use strict';

  const MAX_TEXT=160;
  const MAX_TOKENS=160;
  const MAX_DEPTH=42;
  const PAGE_KEYS=new Set(['home','menu','doc','ctrl','shift','on','on/off','catalog','trig','tab','scratchpad','var','select','templates','symbols','flag','comma']);
  const SUPER_DIGITS={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
  const fnNames=new Set(['sqrt','abs','sin','cos','tan','asin','acos','atan','arcsin','arccos','arctan','ln','log','exp']);
  const constants=new Set(['pi','e','ans']);
  class CalcError extends Error {
    constructor(message){super(message);this.name='CalcError';}
  }
  function normalized(src){
    return src.toLowerCase().replace(/(sin|cos|tan)⁻¹/g,'a$1')
      .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+)/g,(_,s)=>'^('+[...s].map(x=>SUPER_DIGITS[x]).join('')+')')
      .replace(/[−–]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/π/g,'pi').replace(/√/g,'sqrt')
      .replace(/\u00a0/g,' ').trim();
  }
  function scan(input){
    if(typeof input!=='string')throw new CalcError('Enter a calculation.');
    if(input.length>MAX_TEXT)throw new CalcError('That calculation is too long.');
    const s=normalized(input), out=[];
    for(let i=0;i<s.length;){
      const ch=s[i];
      if(/\s/.test(ch)){i++;continue;}
      const num=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if(num){
        const value=Number(num[0]);
        if(!Number.isFinite(value))throw new CalcError('The number is too large.');
        out.push({type:'num',value});i+=num[0].length;
      }else if(/[a-z]/.test(ch)){
        const name=s.slice(i).match(/^[a-z]+/)[0];
        if(!fnNames.has(name)&&!constants.has(name))throw new CalcError('Unknown function or symbol: '+name+'.');
        out.push({type:'name',value:name});i+=name.length;
      }else if('+-*/^()!%'.includes(ch)){
        out.push({type:ch});i++;
      }else{
        throw new CalcError('Unsupported character. Use numbers, operators, and the displayed functions.');
      }
      if(out.length>MAX_TOKENS)throw new CalcError('That calculation is too long.');
    }
    out.push({type:'end'});return out;
  }
  function finite(v){
    if(Number.isNaN(v))throw new CalcError('This calculation has no real result.');
    if(!Number.isFinite(v))throw new CalcError('The result is too large or undefined.');
    return Object.is(v,-0)?0:v;
  }
  const getMode=v=>String(v??'').toUpperCase()==='RAD'?'RAD':'DEG';
  function resolve(name, x, mode){
    const rad=mode==='DEG'?x*(Math.PI/180):x;
    const fromRad=v=>mode==='DEG'?v*(180/Math.PI):v;
    const quad=mode==='DEG'?x/90:x/(Math.PI/2);
    const axis=Number.isInteger(quad)&&Math.abs(quad)<=1e9?((quad%4)+4)%4:-1;
    switch(name){
      case 'sqrt':
        if(x<0)throw new CalcError('Square root is only supported for non-negative numbers.');
        return Math.sqrt(x);
      case 'abs': return Math.abs(x);
      case 'ln':case 'log':
        if(x<=0)throw new CalcError('A logarithm needs a positive input.');
        return name==='ln'?Math.log(x):Math.log10(x);
      case 'exp':return Math.exp(x);
      case 'sin':return axis>=0?[0,1,0,-1][axis]:Math.sin(rad);
      case 'cos':return axis>=0?[1,0,-1,0][axis]:Math.cos(rad);
      case 'tan':
        if(axis===1||axis===3)throw new CalcError('Tangent is undefined at this angle.');
        return axis>=0?0:Math.tan(rad);
      case 'asin':case 'arcsin':case 'acos':case 'arccos':
        if(x< -1 || x>1)throw new CalcError('Inverse sine and cosine need an input from −1 to 1.');
        return fromRad(name.includes('sin')?Math.asin(x):Math.acos(x));
      case 'atan':case 'arctan':return fromRad(Math.atan(x));
    }
    throw new CalcError('Unknown function.');
  }

  function evaluate(input,options={}){
    const tokens=scan(input),mode=getMode(options.mode),ans=Number.isFinite(options.ans)?options.ans:0;
    let i=0,depth=0;
    const peek=()=>tokens[i];
    const take=type=>peek().type===type?tokens[i++]:null;
    function nested(fn){
      depth++;
      if(depth>MAX_DEPTH)throw new CalcError('There are too many nested terms.');
      const value=fn();
      depth--;
      return value;
    }
    function atom(){
      const n=take('num');
      if(n)return n.value;
      const name=take('name');
      if(name){
        if(name.value==='pi')return Math.PI;
        if(name.value==='e')return Math.E;
        if(name.value==='ans')return ans;
        if(!take('('))throw new CalcError('Put the function input in parentheses.');
        const arg=nested(sum);
        if(!take(')'))throw new CalcError('Close the function with a right parenthesis.');
        return finite(resolve(name.value,arg,mode));
      }
      if(take('(')){
        const inside=nested(sum);
        if(!take(')'))throw new CalcError('Close the parentheses.');
        return inside;
      }
      if(peek().type===')')throw new CalcError('Check that the parentheses match.');
      throw new CalcError('Enter a number, constant, or function.');
    }
    function postfix(){
      let v=atom();
      if(take('%'))return v/100;
      if(take('!')){
        if(!Number.isInteger(v)||v<0||v>170)throw new CalcError('Factorial needs a whole number from 0 to 170.');
        let out=1;
        for(let k=2;k<=v;k++)out*=k;
        return finite(out);
      }
      return v;
    }
    function power(){
      const left=postfix();
      if(!take('^'))return left;
      const right=nested(unary);
      if(left===0&&right===0)throw new CalcError('Zero to the power of zero is undefined.');
      return finite(left**right);
    }
    function unary(){
      if(take('+'))return nested(unary);
      if(take('-'))return finite(-nested(unary));
      return power();
    }
    function product(){
      let v=unary();
      while(true){
        if(take('*'))v=finite(v*unary());
        else if(take('/')){
          const divisor=unary();
          if(divisor===0)throw new CalcError('Cannot divide by zero.');
          v=finite(v/divisor);
        }else if(peek().type==='name'||peek().type==='(')v=finite(v*unary());
        else break;
      }
      return v;
    }
    function sum(){
      let v=product();
      while(true){
        if(take('+'))v=finite(v+product());
        else if(take('-'))v=finite(v-product());
        else break;
      }
      return v;
    }
    if(peek().type==='end')throw new CalcError('Enter a calculation first.');
    const v=sum();
    if(peek().type!== 'end'){
      if(peek().type===')')throw new CalcError('Check that the parentheses match.');
      throw new CalcError('Add an operator between the terms.');
    }
    return finite(v);
  }
  function format(value){
    if(!Number.isFinite(value))return '';
    const v=Number(value.toPrecision(12));
    return Object.is(v,-0)?'0':String(v);
  }

  const aliases={
    '×':'*','multiply':'*','mult':'*','mul':'*','divide':'/','div':'/','÷':'/','−':'-','subtract':'-','minus':'-','plus':'+','add':'+',
    'power':'^','pow':'^','science':'e','scientific':'e','ee':'e','eex':'e','x10ⁿ':'e','tenpow':'10^(','lparen':'(','rparen':')','dot':'.','space':' ',
    'sqrt':'√(','√':'√(','square root':'√(','squared':'^2','square':'^2','x²':'^2','^2':'^2',
    'pi':'π','π':'π','ans':'Ans','sin':'sin(','cos':'cos(','tan':'tan(','asin':'asin(','acos':'acos(','atan':'atan(',
    'log':'log(','ln':'ln(','abs':'abs(','exp':'e^(','eˣ':'e^(','10ˣ':'10^(','sin⁻¹':'asin(','cos⁻¹':'acos(','tan⁻¹':'atan(',
    'negative':'-','neg':'-','(-)':'-','percent':'%','factorial':'!'
  };

  function create(options={}){
    const callbacks=new Set();
    let mode=getMode(options.mode), expression='', error='', value=null, ans=0,
        history=[], notice='', at=0,to=0, justEvaluated=false, historyCursor=-1;
    function getState(){
      return Object.freeze({mode,expression,error,notice,value,ans,result:value===null?'':format(value),
        selectionStart:at, selectionEnd:to, justEvaluated,
        historyIndex:historyCursor<0?-1:Math.floor(historyCursor/2),
        historyPart:historyCursor<0?null:(historyCursor%2===0?"expression":"result"),
        history:Object.freeze(history.map(entry=>Object.freeze({...entry})))});
    }
    function notify(){
      const current=getState();
      for(const cb of callbacks)cb(current);
      return current;
    }
    function resetReview(){notice='';error='';value=null;justEvaluated=false;historyCursor=-1;}
    function setText(str, from, until){
      expression=String(str??'').slice(0,MAX_TEXT);
      at=Number.isFinite(from)?Math.trunc(Math.max(0,Math.min(expression.length,from))):expression.length;
      to=Number.isFinite(until)?Math.trunc(Math.max(at,Math.min(expression.length,until))):at;
      resetReview();return notify();
    }
    function setSelection(from,until=from){
      if(Number.isFinite(from))at=Math.trunc(Math.max(0,Math.min(expression.length,from)));
      if(Number.isFinite(until))to=Math.trunc(Math.max(at,Math.min(expression.length,until)));
      else to=at;
      return getState();
    }
    function setMode(next){
      mode=getMode(next);error='';return notify();
    }
    function commit(){
      if(!expression.trim()){
        return getState();
      }
      try{
        const base=x=>evaluate(x,{mode,ans});
        const advanced=host.TICalcTools?.evaluate(expression,base,mode);
        const result=advanced?.display?null:finite(advanced?advanced.value:base(expression));
        notice=advanced?.notice||'';
        history=[...history,{expression,value:result,result:advanced?.display||format(result),mode}].slice(-16);
        value=result; if(result!==null)ans=result; error=''; justEvaluated=true; historyCursor=-1;
        expression='';at=to=0;
      }catch(err){
        notice='';error=err instanceof Error?err.message:'This calculation could not be evaluated.';
        value=null;justEvaluated=false;
      }
      return notify();
    }
    function insert(fragment){
      resetReview();
      if(expression.length-(to-at)+fragment.length>MAX_TEXT){
        error='That calculation is too long.';return notify();
      }
      expression=expression.slice(0,at)+fragment+expression.slice(to);
      at+=fragment.length;to=at;return notify();
    }
    function clear(){
      return setText('');
    }
    function clearHistory(){history=[];notice='';historyCursor=-1;return notify();}
    function recall(delta){
      if(!history.length || (historyCursor<0 && delta>0))return getState();
      const last=history.length*2-1;
      if(historyCursor<0)historyCursor=last;
      else if(historyCursor+delta>last)historyCursor=-1;
      else historyCursor=Math.max(0,historyCursor+delta);
      return notify();
    }
    function selectHistory(index,part){
      if(!Number.isInteger(index)||index<0||index>=history.length)return getState();
      historyCursor=2*index+(part==='result'?1:0);
      return notify();
    }
    function editHistory(){
      const entry=history[Math.floor(historyCursor/2)];
      if(!entry)return getState();
      if(historyCursor%2&&entry.value===null){historyCursor=-1;notice='This result is text, not a number. Recall the expression to edit the search.';return notify();}
      const fragment=historyCursor%2 ? String(entry.value) : entry.expression;
      return insert(fragment);
    }
    function backspace(forward=false){
      resetReview();
      if(at===to){if(forward)to=Math.min(expression.length,to+1);else at=Math.max(0,at-1);}
      expression=expression.slice(0,at)+expression.slice(to);to=at;return notify();
    }
    function press(key){
      const raw=String(key??''), k=raw.toLowerCase().trim();
      if(k==='enter'||k==='='||k==='eq'||k==='return'||k==='equals')return historyCursor>=0?editHistory():commit();
      if(k==='escape'||k==='esc'){if(historyCursor>=0){historyCursor=-1;return notify();}return clear();}
      if(k==='clear'||k==='ac'||k==='escape'||k==='esc')return clear();
      if(k==='del'||k==='backspace'||k==='⌫')return backspace();
      if(k==='delete')return backspace(true);
      if(k==='degree'||k==='deg')return setMode('DEG');
      if(k==='radian'||k==='rad')return setMode('RAD');
      if(k==='toggle-mode'||k==='mode')return setMode(mode==='RAD'?'DEG':'RAD');
      if(k==='arrowup'||k==='up'||k==='↑')return recall(-1);
      if(k==='arrowdown'||k==='down'||k==='↓')return recall(1);
      if(k==='arrowleft'||k==='left'||k==='←'){if(historyCursor>=0){historyCursor-=historyCursor%2;return notify();}at=to=at!==to?at:Math.max(0,at-1);return notify();}
      if(k==='arrowright'||k==='right'||k==='→'){if(historyCursor>=0){historyCursor+=1-historyCursor%2;return notify();}at=to=at!==to?to:Math.min(expression.length,to+1);return notify();}
      if(PAGE_KEYS.has(k))return getState();
      const fragment=Object.hasOwn(aliases,k)?aliases[k]:/^[0-9a-z()+*/.^!%\-]$/.test(k)?k:null;
      if(fragment===null)return getState();
      if(justEvaluated){
        expression=/^[+*/^\-%!]/.test(fragment)?'Ans':'';
        at=to=expression.length;
      }
      return insert(fragment);
    }
    function handleKey(event){
      if(!event||event.altKey||event.metaKey||event.ctrlKey||event.isComposing)return false;
      const k=String(event.key??'');
      if(!['Enter','Backspace','Delete','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','='].includes(k)&&
          !Object.hasOwn(aliases,k.toLowerCase())&&!/^[0-9a-z()+*/.^!%\-]$/i.test(k))return false;
      event.preventDefault?.();
      press(k);
      return true;
    }
    function subscribe(listener){
      if(typeof listener!=='function')throw new TypeError('A calculator listener must be a function.');
      callbacks.add(listener);
      listener(getState());
      return ()=>callbacks.delete(listener);
    }
    if(options.expression!=null)setText(options.expression);
    return Object.freeze({press,setText,setSelection,setMode,insert,clearHistory,selectHistory,getState,handleKey,subscribe,evaluate:commit,clear});
  }

  host.TIFreeCalc=Object.freeze({create,evaluate,format,CalcError,MAX_TEXT});
})(typeof window==='undefined'?globalThis:window);
