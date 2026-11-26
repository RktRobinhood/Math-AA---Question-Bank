"use strict";
(function(){
const $=id=>document.getElementById(id), M=CT12MaxMath,S=CT12MaxScreen,T=CT12MaxTape,H=HandheldTransport;
const stage=$("stage"),canvas=$("drawing"),lcd=$("lcd"),panel=$("hotspots"),screen=S.screen(canvas);
const expression=$("expression"),left=$("allowed-left"),right=$("allowed-right"),bound=$("bound");
const fWatch=M.parse("x^3-3x+2"), allowedWatch=[-2,3], mWatch=M.peak(fWatch,-2,0).mark, cmpWatch=M.compare(fWatch,allowedWatch), defaultTry={f:M.parse("-x^3+3x+1"),allowed:[-3,2]};
const query=new URLSearchParams(location.search);
let linked=null,badLink=false;
if(["expr","left","right"].some(k=>query.has(k))){
 try{
  if(["expr","left","right"].some(k=>query.getAll(k).length!==1))throw Error("Incomplete link.");
  linked={f:M.parse(query.get("expr")),allowed:M.interval(M.readNumber(query.get("left")),M.readNumber(query.get("right")))};
 }catch{badLink=true;}
}
const challenge=linked||defaultTry, goals=M.compare(challenge.f,challenge.allowed);
const pair=z=>"("+M.pretty(z.x)+", "+M.pretty(z.y)+")", limits=a=>"["+a.map(M.pretty).join(", ")+"]";
const taskText="Find the maximum value of f(x) = "+M.displayExpr(challenge.f.raw)+" on "+limits(challenge.allowed)+". Give an x-coordinate where it occurs.";
$("challenge").textContent=taskText;
const initial=()=>({state:"entry",raw:challenge.f.raw,q:null,allowed:challenge.allowed.slice(),low:null,high:null,cursor:null,mark:null,error:null,typed:"",checked:null});
let mode="watch",state=initial(),edited=false,fresh=true;
let watchStamp="",returnToWatch=null;
 const handheld=$("handheld-host");
 const shell=CalculatorLessonHandset.mount(handheld,{screen:lcd,label:"TI-Nspire CX II-T Graphs",onKey:physical});
 function physical(k){
  if(mode!=="try")return;
  if(!document.activeElement?.matches("input,textarea,select"))stage.focus({preventScroll:true});
  press(k);
 }
 function drawWatchFrame(beat,point,crossed,key,paint){
  const count=crossed.length,hold=point.span.end-point.span.voiceEnd;
  const current=key?.beat===beat&&!point.speaking&&(point.fraction-key.at)*hold<.66;
  const physical=current&&(T.keys[count-1]?.key||T.keys[count-1]?.[1]);
  shell.setKeys(physical?(physical==="t"&&T.keys[count-2]?.key==="ctrl"?["ctrl","t"]:[physical]):[]);
  paint(count);
 }
const hints={
 entry:"Enter a function, then plot it.",
 plotted:"Choose Menu → 6 Analyze Graph → 3 Maximum.",
 menu:"Choose 6: Analyze Graph.",
 submenu:"Choose 3: Maximum.",
 lower:"Place one bound to the left of the peak. Type an x-value or move the cursor.",
 upper:"Choose an upper bound on the other side of the same peak.",
 result:"That result concerns the search bounds. Check the separate allowed interval."
};
function tag(s){
 $("lcd-text").textContent=[
 s.q?"Graph of "+M.displayExpr(s.q.raw):"Function entry: "+M.displayExpr(s.raw),
 hints[s.state],s.low!==null?"Lower: "+M.pretty(s.low):"",s.typed?"Typed bound: "+s.typed:"",
 s.cursor!==null?"Cursor: "+M.pretty(s.cursor):"",s.mark?"Local maximum "+pair(s.mark):"",s.error||"",s.endpointMarks?.map(c=>"Endpoint "+pair(c)).join(". ")||"",
 s.checked?"Compared allowed interval "+limits(s.allowed)+". Maximum value: "+M.pretty(s.checked.maxY):""
 ].filter(Boolean).map(t=>t.replace(/[.!?]$/, "")).join(". ")+". ";
}
function snapshot(t){
 const s={...initial(),state:"plotted",raw:fWatch.raw,q:fWatch,allowed:allowedWatch.slice()};
 let key="";
 for(const [at,k,delta] of T.keys){if(at>t)break;Object.assign(s,delta);key=t<at+.31?k:"";}
 if(s.state==="result")s.mark={...mWatch};
 if(t>=30&&t<36)s.endpointMarks=cmpWatch.candidates.filter(c=>c.kind==="left"||(t>=33&&c.kind==="right"));
 if(t>=36)s.checked=cmpWatch;
 return {key,s};
}

 function renderWatch(device,{beat,point,crossed,key}){
  if(handheld.parentElement!==device)device.append(handheld);
  drawWatchFrame(beat,point,crossed,key,count=>{
   const compareStep=beat>=4?beat-(point.speaking||point.fraction<.30?1:0):3;
   const nextStamp=count+":"+compareStep;
   if(watchStamp===nextStamp)return;watchStamp=nextStamp;
   const before=count?(T.keys[count-1][0]+1e-7):0;
   const editorial=compareStep>=4?30+3*(compareStep-4):before;
   const m=snapshot(editorial).s;screen.draw(m);tag(m);
  });
 }
function sync(){
 expression.value=state.raw;left.value=String(state.allowed[0]);right.value=String(state.allowed[1]);
}
function isExercise(){
 try{return M.parse(expression.value).raw===challenge.f.raw&&M.readNumber(left.value)===challenge.allowed[0]&&M.readNumber(right.value)===challenge.allowed[1];}
 catch{return false;}
}
function msg(s="",err=false){
 const p=$("keypad-result");p.textContent=s;p.hidden=!s;p.className="feedback"+(err?"is-wrong":"is-right");
}
function drawCompare(){
 const h=$("comparison"),p=state.checked;h.replaceChildren();h.hidden=!p;
 if(!p)return;
 const note=document.createElement("p");note.textContent="Lesson check: compare the allowed candidates.";
 const list=document.createElement("dl"),label={left:"Left endpoint",right:"Right endpoint",peak:"Interior peak"};
 for(const c of p.candidates){const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=label[c.kind];dd.textContent=pair(c);list.append(dt,dd);}
 const conclusion=document.createElement("strong");
 conclusion.textContent="Maximum value: "+M.pretty(p.maxY)+(p.flat?" at every allowed x.":" at x = "+p.winners.map(x=>M.pretty(x.x)).join(" or ")+".");
 h.append(note,list,conclusion);
}
function hotspot(p,i,go){
 const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",p.rows[i]);
 b.style.left=p.x/3.2+"%";b.style.top=(p.y+2+i*p.h)/2.4+"%";b.style.width=p.w/3.2+"%";b.style.height=p.h/2.4+"%";
 b.addEventListener("click",e=>{e.stopPropagation();go();});panel.append(b);
}
function paintTry(){
 if(mode!=="try")return;
 screen.draw(state);tag(state);panel.replaceChildren();
 const skill=isExercise();$("answer-form").hidden=!skill;$("exercise-inactive").hidden=skill;if(!skill)$("feedback").textContent="";
 $("keypad-problem").textContent=skill?"Find the absolute maximum on "+limits(challenge.allowed)+".":"Explore a different function or interval.";
 const placing=["lower","upper"].includes(state.state);lcd.classList.toggle("pick",placing);
 $("bound-form").hidden=!placing;$("bound-label").textContent=state.state==="lower"?"Lower search bound x":"Upper search bound x";
 $("retry-bounds").hidden=state.state!=="result";
 $("compare").hidden=!state.q||state.state!=="result";
 $("keypad-hint").textContent=hints[state.state];drawCompare();
 msg(state.error||(state.mark?"Local peak: "+pair(state.mark)+".":"")|| (badLink&&!edited?"That link could not load. An original Try question is shown instead.":""),Boolean(state.error||badLink&&!edited));
 if(state.state==="menu")hotspot(S.PANEL.main,5,()=>press("6"));
 if(state.state==="submenu")hotspot(S.PANEL.sub,2,()=>press("3"));
}
function select(w,edits={}){state={...state,state:w,error:null,typed:"",...edits};bound.value="";paintTry();}
function plot(){
 edited=true;
 try{
  const q=M.parse(expression.value),a=M.interval(M.readNumber(left.value),M.readNumber(right.value));
  state={...initial(),state:"plotted",raw:q.raw,q,allowed:a};sync();paintTry();
 }catch(e){state.error=e.message;paintTry();}
}
function analyze(){
 if(!state.q){msg("Plot a function first.",true);return;}
 const [l,r]=state.allowed;select("lower",{cursor:(l+r)/2,low:null,high:null,mark:null,checked:null});
}
const win=()=>M.windowFor(state.q,state.allowed);
function confirm(x){
 if(!["lower","upper"].includes(state.state))return;
 edited=true;
 const w=win();
 if(!Number.isFinite(x)||x<w.x0||x>w.x1){msg("Choose an x-value in the visible graph window.",true);return;}
 if(state.state==="lower"){select("upper",{cursor:x,low:x});return;}
 if(x<=state.low){msg("The upper bound must be to the right of the lower bound.",true);return;}
 const {mark,message}=M.peak(state.q,state.low,x);select("result",{cursor:x,high:x,mark:mark||null,error:message||null});
}
function editBound(k){
 let v=state.typed;
 if(k==="del")v=v.slice(0,-1);
 else if(["minus","neg","plus"].includes(k)){if(!v)v=k==="plus"?"+":"-";}
 else if(k==="dot"){if(!/[.,]/.test(v))v+=".";}
 else if(v.length<18&&/^\d$/.test(k))v+=k;
 else return;
 state.typed=v;bound.value=v;tag(state);screen.draw(state);msg();
}
function press(k){
 if(mode!=="try")return;
 const w=state.state;
 if(k==="esc"){edited=true;select(w==="submenu"?"menu":state.q?"plotted":"entry",{low:null,high:null,cursor:null,mark:null,checked:null});return;}
 if(k==="menu"){if(state.q){edited=true;select("menu",{low:null,high:null,cursor:null,mark:null,checked:null});}else msg("Plot a function first.",true);return;}
 if(w==="menu"){if(["6","enter","right","select"].includes(k)){edited=true;select("submenu");}return;}
 if(w==="submenu"){if(["3","enter","right","select"].includes(k)){edited=true;analyze();}return;}
 if(w==="lower"||w==="upper"){
  if(k==="enter"||k==="select"){confirm(state.typed?M.readNumber(state.typed):state.cursor);return;}
  if(k==="left"||k==="right"){
   edited=true;const {x0,x1}=win(),dx=(x1-x0)/64;state.typed="";bound.value="";
   state.cursor=M.clamp(state.cursor+(k==="left"?-dx:dx),x0,x1);screen.draw(state);tag(state);msg();return;
  }
  edited=true;editBound(k);return;
 }
 if(k==="enter"){plot();return;}
 if(H.character(k)!==null||k==="del"){
  edited=true;const replace=w!=="entry"||fresh;fresh=false;H.modify(expression,k,{replace});
 }
}
$("expression-form").addEventListener("submit",e=>{e.preventDefault();plot();});
for(const el of [expression,left,right])el.addEventListener("input",()=>{
 if(mode!=="try")return;
 edited=true;fresh=false;state={...initial(),raw:expression.value};bound.value="";paintTry();
});
$("bound-form").addEventListener("submit",e=>{e.preventDefault();confirm(M.readNumber(bound.value));});
bound.addEventListener("input",()=>{edited=true;state.typed=bound.value;tag(state);screen.draw(state);});
$("retry-bounds").addEventListener("click",()=>{edited=true;analyze();stage.focus({preventScroll:true});});
$("compare").addEventListener("click",()=>{edited=true;state.checked=M.compare(state.q,state.allowed);paintTry();});
$("reset-keypad").addEventListener("click",()=>{edited=true;fresh=true;state=initial();sync();bound.value="";$("feedback").textContent="";paintTry();stage.focus({preventScroll:true});});
function position(e){
 const r=canvas.getBoundingClientRect(),xp=(e.clientX-r.left)*320/r.width,yp=(e.clientY-r.top)*240/r.height;
 return xp>=S.SCREEN_X.l&&xp<=S.SCREEN_X.r&&yp>=26&&yp<=226?S.pointAt(state.q,xp,null,state.allowed):null;
}
lcd.addEventListener("pointermove",e=>{
 if(mode!=="try"||!lcd.classList.contains("pick")||e.pointerType==="touch"||state.typed)return;const p=position(e);
 if(p!==null){state.cursor=p;screen.draw(state);tag(state);}
});
lcd.addEventListener("click",e=>{if(mode==="try"&&lcd.classList.contains("pick")){const p=position(e);if(p!==null)confirm(p);}});
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.append(stage);$("try-grid").prepend(handheld);stage.hidden=false;$("try").hidden=false;
 document.body.classList.add("graph-try");shell.setInteractive(true);shell.setKeys([]);
 paintTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;$("try").hidden=true;watchStamp="";
 document.body.classList.remove("graph-try");shell.setInteractive(false);shell.setKeys([]);
 $("hotspots").replaceChildren();lcd.classList.remove("pick");

}
$("return-watch").addEventListener("click",()=>returnToWatch?.());

 document.addEventListener("keydown",e=>{
  if(mode!=="try"||e.defaultPrevented||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable],.top,.tabbar"))return;
  if((!stage.contains(e.target)&&e.target!==document.body)||(e.target.closest("button")&&["Enter"," "].includes(e.key)))return;
  const keys={Escape:"esc",Enter:"enter",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",m:"menu",M:"menu",".":"dot",",":"dot","^":"power","+":"plus","-":"minus","*":"mul","/":"div","(":"lparen",")":"rparen","²":"square"};
  const k=keys[e.key]||(/^[0-9xX]$/.test(e.key)?e.key.toLowerCase():"");if(k){e.preventDefault();physical(k);}
 });
const xField=$("answer-x"),yField=$("answer-y"),feedback=$("feedback");
[xField,yField].forEach(el=>el.addEventListener("input",()=>{edited=true;feedback.textContent="";}));
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(!isExercise())return;edited=true;const x=M.readNumber(xField.value),y=M.readNumber(yField.value);
 const okX=Number.isFinite(x)&&(goals.flat?(x>=challenge.allowed[0]&&x<=challenge.allowed[1]):goals.winners.some(c=>M.matches(x,c.x)));
 const okY=M.matches(y,goals.maxY);
 feedback.className="feedback"+(okX&&okY?"is-right":"is-wrong");
 feedback.textContent=okX&&okY?"Correct. No allowed point has a larger y-value.":!Number.isFinite(x)||!Number.isFinite(y)?"Enter a numerical x-coordinate and value.":okX?"The x-coordinate is right. Check its y-value.":"Not yet. Compare the peak and both allowed endpoints.";
});
sync();
window.CalculatorLessonAdapter=Object.freeze({initialMode:query.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
