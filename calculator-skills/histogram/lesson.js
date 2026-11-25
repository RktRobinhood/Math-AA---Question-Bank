(function(){
"use strict";
const M=FreqHistogram,T=HistTape,$=id=>document.getElementById(id), q=new URLSearchParams(location.search);
const stage=$("stage"),seek=$("seek"),lcd=$("lcd"),screen=$("screen"),play=$("play");
const tabs=[$("watch-tab"),$("try-tab")], controls=["data","width","alignment","bin","cutoff"], base=M.readCase(T.practice), work=M.readCase(T.demo);
let problem=base, invalid="", linked=false;
if(q.get("mode")==="try"&&controls.some(k=>q.has(k))){
 try{if([...controls,"mode"].some(k=>q.getAll(k).length!==1))throw Error();problem=M.readCase(Object.fromEntries(controls.map(k=>[k,q.get(k)])));linked=true;}
 catch{invalid="This link does not contain a complete supported case. The original practice is ready below.";}
}
const lists={
 menu:[["1","Plot Type","type"],["2","Plot Properties","properties"],["3","Actions"],["4","Analyze","analyze"],["5","Window/Zoom"],["6","Settings…"]],
 type:[["1","Dot Plot","dot"],["2","Box Plot"],["3","Histogram","histogram"],["4","Normal Probability Plot"]],
 properties:[["1","Clear All Variables"],["2","Histogram Properties","hist-properties"]],
 "hist-properties":[["1","Histogram Scale"],["2","Bin Settings","bins"]],
 bins:[["1","Equal Bin Width","dialog"],["2","Variable Bin Width"]],
 analyze:[["1","Remove"],["2","Add Movable Line"],["3","Lock Intercept at Zero"],["4","Plot Function"],["5","Shade Under Function"],["6","Regression"],["7","Residuals"],["8","Plot Value"],["9","Show Normal PDF"],["a","Graph Trace","trace"]]
};
const parents={type:["menu",0],properties:["menu",1],"hist-properties":["properties",1],bins:["hist-properties",1],analyze:["menu",3]};
const clone=s=>({...s,fields:s.fields?.slice(),visited:s.visited.slice()});
const scene=c=>({...M.auto(c.data),data:c.data,plot:"unbound",menu:"",selected:0,field:0,fields:null,replace:true,index:null,trace:false,visited:[],applied:false,error:""});
let practice=scene(problem),state=practice,fork=null,focused=false,seenWatch=false,restoreFocus=false,mode="watch",now=0,running=false,raf=0,origin=0,lastVisual="";
const forks=new Map();
function step(s,k){
 const next=clone(s);next.error="";
 if(k==="menu"){next.menu="menu";next.selected=0;next.trace=false;next.index=null;return next;}
 if(k==="esc"){
   if(parents[s.menu]){[next.menu,next.selected]=parents[s.menu];}else next.menu="";
   next.trace=false;next.index=null;return next;
 }
 if(s.menu==="vars"){
   if(["select","enter","right"].includes(k)){next.menu="";next.plot="dot";}
   return next;
 }
 if(s.menu==="dialog"){
   if(["tab","backtab","down","up"].includes(k)){next.field=(next.field+(["backtab","up"].includes(k)?3:1))%4;next.replace=true;return next;}
   if(k==="enter"||k==="select"){
     if(s.field===3){next.menu="";return next;}
     try{
       const w=M.integer(s.fields[0]),a=M.integer(s.fields[1]);M.bins(s.data,w,a);
       next.width=w;next.alignment=a;next.plot="histogram";next.menu="";next.index=null;next.trace=false;next.applied=true;next.visited=[];
     }catch(e){next.error=e.message;}
     return next;
   }
   if(s.field>1)return next;
   if(k==="left"||k==="right")return next;
   const ch=k==="dot"?".":k==="neg"||k==="minus"?"−":/^\d$/.test(k)?k:null;
   if(ch!==null||k==="del"){const old=next.fields[s.field];next.fields[s.field]=k==="del"?(s.replace?"":old.slice(0,-1)):s.replace?ch:(old+ch).slice(0,14);next.replace=false;}
   return next;
 }
 if(s.menu){
   const a=lists[s.menu];
   if(k==="left"&&parents[s.menu]){[next.menu,next.selected]=parents[s.menu];return next;}
   if(k==="up"||k==="down"){next.selected=(s.selected+(k==="up"?a.length-1:1))%a.length;return next;}
   const row=["select","enter","right"].includes(k)?a[s.selected]:a.find(r=>r[0]===k);
   if(!row)return next;
   const to=row[2];
   if(!to){next.error="That item is outside this focused lesson.";return next;}
   if(s.plot==="unbound"&&["histogram","dot","properties","trace"].includes(to)){next.error="Select the named variable on the horizontal axis first.";return next;}
   if(["hist-properties","trace"].includes(to)&&s.plot!=="histogram"){next.error="Make a histogram before opening this command.";return next;}
   next.menu=lists[to]||to==="dialog"?to:"";next.selected=0;
   if(to==="histogram"||to==="dot"){next.plot=to;next.trace=false;next.index=null;}
   if(to==="dialog"){next.fields=[M.text(s.width),M.text(s.alignment)];next.field=0;next.replace=true;}
   if(to==="trace"){next.trace=true;next.index=0;const z=M.bins(s.data,s.width,s.alignment);next.visited=[...new Set([...s.visited,z[0].lower])];}
   return next;
 }
 if(s.plot==="unbound"&&["axis","tab","select","enter"].includes(k)){next.menu="vars";return next;}
 if(s.plot==="histogram"&&s.trace&&["left","right"].includes(k)){
   const z=M.bins(s.data,s.width,s.alignment);next.index=Math.min(z.length-1,Math.max(0,s.index+(k==="left"?-1:1)));
   next.visited=[...new Set([...s.visited,z[next.index].lower])];return next;
 }
 return next;
}
function snapshot(t){let s=scene(work),key="";for(const [at,k] of T.keys){if(at>t)break;s=step(s,k);key=t-at<.36&&k!=="axis"?k:"";}return {s,key};}
const shell=HandheldShell.mount({host:$("host"),screen:lcd,label:"TI-Nspire CX II-T teaching reconstruction",interactive:false,onKey:k=>{interact(k);stage.focus({preventScroll:true});}});
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
function chart(s,active){
 const x0=34,y0=149,W=270,H=110;
 if(s.plot==="unbound")return '<svg class="chart" viewBox="0 0 320 178" aria-hidden="true"><path class="axis" d="M34 26V149H304"/></svg><button type="button" id="axis-button" '+(active?'':'tabindex="-1"')+'>Click to add variable</button>';
 if(s.plot==="dot"){
   const xs=[...s.data].sort((a,b)=>a-b), lo=xs[0], hi=xs.at(-1), placed={};
   const dots=xs.map(n=>{placed[n]=(placed[n]??0)+1;return '<circle class="dot" cx="'+(x0+14+(n-lo)/(hi-lo)*(W-28)).toFixed(2)+'" cy="'+(y0-7-placed[n]*Math.min(22,H/(xs.length+1))).toFixed(2)+'" r="4"/>';}).join("");
   return '<svg class="chart" viewBox="0 0 320 178" aria-hidden="true"><path class="axis" d="M34 26V149H304"/>'+dots+'<text x="169" y="170" text-anchor="middle">reading</text></svg>';
 }
 const z=M.bins(s.data,s.width,s.alignment), max=Math.max(...z.map(b=>b.count)), w=W/z.length;
 const ytick=max<7?1:Math.ceil(max/4), stride=Math.max(1,Math.ceil(z.length/5));
 const lines=[];for(let n=0;n<=max;n+=ytick){const y=(y0-n*H/max).toFixed(2);lines.push('<path class="dotguide" d="M34 '+y+'H304"/><text x="29" y="'+(Number(y)+4)+'" text-anchor="end">'+n+'</text>');}
 const bars=z.map((b,i)=>'<rect data-bin-index="'+i+'" class="bin'+(b.count?"":" empty")+(s.index===i?" active":"")+'" x="'+(x0+i*w).toFixed(2)+'" y="'+(y0-(b.count||.035)*H/max).toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+((b.count||.035)*H/max).toFixed(2)+'"/>').join("");
 const edges=[...z.map(b=>b.lower),z.at(-1).upper];const labels=edges.map((n,i)=>(i===z.length||i%stride===0&&(z.length-i>=stride||i===0))?'<text x="'+(x0+i*w).toFixed(2)+'" y="164" text-anchor="'+(i===z.length?"end":i===0?"start":"middle")+'">'+M.text(n)+'</text>':"").join("");
 const cursor=s.index===null?"":'<p class="readout">'+M.row(z[s.index].lower,z[s.index].upper)+' · '+z[s.index].count+' points</p>';
 return '<svg class="chart" viewBox="0 0 320 178" aria-hidden="true">'+lines.join("")+bars+'<path class="axis" d="M34 26V149H304"/>'+labels+'<text x="37" y="27">Frequency</text><text x="169" y="177" text-anchor="middle">reading</text></svg>'+cursor;
}
const taughtTarget={properties:"2","hist-properties":"2",bins:"1",analyze:"a"};
function strip(name,current,active){
 const target=active?null:taughtTarget[name];
 return '<div class="menu-panel">'+lists[name].map(([k,label],i)=>'<button type="button" '+(active?'':'tabindex="-1" ')+'data-code="'+k+'" aria-current="'+(i===current)+'"'+(target===k?' data-watch-target="true"':'')+'>'+k.toUpperCase()+': '+escapeHtml(label)+'</button>').join("")+'</div>';
}
function draw(s,active){
 const view=chart(s,active);let overlay="", selected="";
 if(s.menu==="vars")overlay='<div class="menu-stack"><div class="menu-panel"><button type="button" data-code="enter" '+(active?'':'tabindex="-1" ')+'aria-current="true">reading</button></div></div>';
 else if(lists[s.menu]){
   const p=parents[s.menu], heading=p?lists[p[0]][p[1]][1]:null;
   overlay='<div class="menu-stack">'+(heading?'<p class="menu-crumb">'+escapeHtml(heading)+'</p>':"")+strip(s.menu,s.selected,active)+'</div>';
   selected=lists[s.menu][s.selected]?.[1]??"";
 }else if(s.menu==="dialog")overlay='<div class="lcd-dialog"><h3>Equal Bin Width Settings</h3>'+s.fields.map((v,i)=>'<button type="button" '+(active?'':'tabindex="-1" ')+'data-field="'+i+'" class="field'+(i===s.field?" selected":"")+'"><span>'+["Width","Alignment"][i]+':</span><span>'+escapeHtml(v)+'</span></button>').join("")+'<div class="actions"><button type="button" data-field="2" data-confirm="1" class="'+(s.field===2?"selected":"")+'">OK</button><button type="button" data-field="3" data-confirm="1" class="'+(s.field===3?"selected":"")+'">Cancel</button></div></div>';
 screen.innerHTML=view+overlay;lcd.dataset.plot=s.plot;lcd.dataset.menu=s.menu;
 revealMenu(active);
 const z=s.plot==="histogram"?M.bins(s.data,s.width,s.alignment):null, traced=s.index!==null&&z?z[s.index]:null;
 $("screen-text").textContent=s.menu==="dialog"?"Equal Bin Width settings. Width "+s.fields[0]+". Alignment "+s.fields[1]+".":s.menu?selected||"Select reading on the horizontal axis.":traced?M.row(traced.lower,traced.upper)+", "+traced.count+" points.":s.plot==="unbound"?"Click to add variable.":s.plot==="dot"?"Dot plot of reading.":"Frequency histogram, "+z.length+" bins.";
 if(!active)screen.querySelectorAll("button").forEach(b=>b.tabIndex=-1);
}
function revealMenu(active){
 const panel=screen.querySelector(".menu-panel"), row=panel?.querySelector(active?'[aria-current="true"]':'[data-watch-target="true"], [aria-current="true"]');
 const target=!active&&panel?.querySelector('[data-watch-target="true"]')||row;
 if(!target)return;
 const item=target.getBoundingClientRect(), view=panel.getBoundingClientRect();
 const top=item.top-view.top-panel.clientTop+panel.scrollTop, bottom=top+item.height;
 if(top<panel.scrollTop)panel.scrollTop=top;
 else if(bottom>panel.scrollTop+panel.clientHeight)panel.scrollTop=bottom-panel.clientHeight;
}
function interact(k){
 if(mode!=="try")return;
 state=step(state,k);
 if(fork===null)practice=state;else forks.set(fork,state);
 renderTry();
}
screen.addEventListener("click",e=>{
 if(mode!=="try")return;
 const b=e.target.closest("button"),i=e.target.dataset.binIndex;
 if(b?.id==="axis-button")interact("axis");
 else if(b?.dataset.code)interact(b.dataset.code);
 else if(b?.dataset.field!==undefined){
   state={...state,field:Number(b.dataset.field),replace:true};
   if(b.dataset.confirm)interact("enter");
   else{if(fork===null)practice=state;else forks.set(fork,state);renderTry();}
 }else if(i!==undefined&&state.plot==="histogram"&&!state.menu){
   const bins=M.bins(state.data,state.width,state.alignment), j=Number(i);
   state={...state,index:j,visited:[...new Set([...state.visited,bins[j].lower])]};
   if(fork===null)practice=state;else forks.set(fork,state);
   renderTry();
 }else return;
 stage.focus({preventScroll:true});
});
document.addEventListener("keydown",e=>{
 if(mode!=="try"||e.altKey||e.ctrlKey||e.metaKey||e.repeat||![document.body,stage].includes(e.target))return;
 const k=e.key==="Tab"?e.shiftKey?"backtab":"tab":e.key.toLowerCase()==="m"?"menu":HandheldShell.normalizeKey(e.key);
 if((k==="tab"||k==="backtab")&&state.menu!=="dialog"&&!(k==="tab"&&e.target===stage&&state.plot==="unbound"&&!state.menu))return;
 if(k==="backtab"&&state.field===0||k==="tab"&&state.field===3)return;
 const b=shell.getKey(k);
 if(!b&&k!=="backtab")return;
 e.preventDefault();stage.focus({preventScroll:true});if(b)b.click();else interact(k);
});
function renderTry(){
 draw(state,true);
 const assigned=fork===null;stage.dataset.lane=assigned?"practice":"watch-copy";
 $("lane").textContent=assigned?"":'Watch copy at '+clock(now);
 $("reset").textContent=assigned?"Reset calculator":"Return to your Try";
 $("return-watch").textContent=assigned?"Return to Watch":"Return to paused Watch";
 $("custom-case").hidden=!assigned;$("answer-form").hidden=!assigned;$("feedback").hidden=!assigned;$("hint").hidden=!assigned;$("prompt").hidden=!assigned;$("try-data").hidden=!assigned;$("link-notice").hidden=!assigned||!invalid;
 $("try-title").textContent=assigned?linked?"Linked histogram practice":"Try a new histogram":"Edit this Watch copy";
 $("error").textContent=state.error;
 fitTry();

 $("instruction").textContent=state.plot==="unbound"?"Select the horizontal add-variable strip and choose reading.":state.menu==="dialog"?"Type the width. Tab to Alignment. Enter to confirm.":state.plot==="dot"?"Menu → Plot Type → Histogram.":state.trace?"Use Left or Right to move between bins.":"Change Equal Bin Width settings, then choose Graph Trace under Analyze.";
}
function fields(){
 const p=problem;
 $("data").value=p.data.map(M.text).join(", ");$("width").value=M.text(p.width);$("alignment").value=M.text(p.alignment);$("bin").value=M.text(p.lower);$("cutoff").value=M.text(p.cutoff);
 $("try-data").textContent="reading: "+p.data.map(M.text).join(", ");
 $("prompt").textContent="Width "+M.text(p.width)+", alignment "+M.text(p.alignment)+". Find the frequency of "+M.row(p.lower,p.lower+p.width)+" and the count below "+M.text(p.cutoff)+".";
 $("link-notice").textContent=invalid;$("frequency").value="";$("cumulative").value="";$("feedback").textContent="";
}
$("setup").addEventListener("submit",e=>{
 e.preventDefault();if(fork!==null)return;
 try{problem=M.readCase(Object.fromEntries(controls.map(k=>[k,$(k).value])));invalid="";linked=false;practice=scene(problem);state=practice;fields();$("case-error").textContent="";$("custom-case").open=false;renderTry();window.scrollTo({top:0,left:0,behavior:"instant"});stage.focus({preventScroll:true});}
 catch(error){$("case-error").textContent=error.message;}
});
for(const k of ["frequency","cumulative"])$(k).addEventListener("input",()=>{$("feedback").textContent="";});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();if(fork!==null)return;
 const p=problem,z=M.result(p),freq=$("frequency").value.trim(),cf=$("cumulative").value.trim();
 if(!/^\d{1,2}$/.test(freq)||!/^\d{1,2}$/.test(cf)){$("feedback").textContent="Enter two whole-number counts.";return;}
 if(state.plot!=="histogram"||!state.applied||state.width!==p.width||(state.alignment-p.alignment)%p.width!==0){$("feedback").textContent="Apply the requested width and alignment on the calculator first.";return;}
 if(!state.visited.includes(p.lower)){$("feedback").textContent="Use Graph Trace or point at the requested class before checking.";return;}
 if(+freq===z.frequency&&+cf===z.cumulative)$("feedback").textContent="Correct. The class count is "+z.frequency+". The counts of whole classes below the cutoff add to "+z.cumulative+".";
 else $("feedback").textContent=+freq===z.frequency?"The class count is right. For the cumulative count, add just the classes that end at or below the cutoff.":"Not yet. Read the half-open interval shown on the calculator, then check the cutoff.";
});
const clock=t=>Math.floor(t/60)+":"+String(Math.floor(t)%60).padStart(2,"0");
const end=()=>now>=T.duration-.008;
const captionStep=[];
for(const [at,title,copy] of T.captions){
 const li=document.createElement("li"), b=document.createElement("button"), tr=document.createElement("li");
 b.type="button";b.textContent=title;b.addEventListener("click",()=>go(at));li.append(b);$("steps").append(li);captionStep.push(b);
 tr.textContent=clock(at)+" "+copy;$("transcript").append(tr);
}
$("worked-list").textContent=T.list;$("transcript-data").textContent=T.list;$("stage-play").hidden=false;
const label=()=>{
 play.textContent=running?"Pause":end()?"Replay":"Play";play.setAttribute("aria-label",play.textContent);
 $("take-over").textContent=end()?"Open Try":"Take over";
 $("take-over").setAttribute("aria-label",end()?"Open independent Try":"Take over the calculator");
 $("stage-play").hidden=running||now>=.005;
};
function renderWatch(){
 if(mode!=="watch")return;
 const {s,key}=snapshot(now), i=T.captions.findLastIndex(c=>c[0]<=now);
 seek.value=now;$("clock").textContent=clock(now)+" / "+clock(T.duration);seek.setAttribute("aria-valuetext",clock(now)+" of "+clock(T.duration));
 shell.setKeys(key?[key]:[]);
 const visual=JSON.stringify([s.plot,s.menu,s.selected,s.fields,s.field,s.index,i]);
 if(visual===lastVisual)return;
 lastVisual=visual;draw(s,false);
 $("caption").textContent=T.captions[i][2];for(const [j,el] of captionStep.entries())el.setAttribute("aria-current",String(j===i));
 const bridge=$("takeaway");
 bridge.hidden=i<5;
 bridge.textContent=i===5?"[20, 30) includes 20, excludes 30.":i===6?"Below 40: 4 + 5 + 3 = 12.":"";
 fit();
}
function go(t){
 now=Math.max(0,Math.min(T.duration,Number(t)||0));
 origin=performance.now()-now*1000;label();renderWatch();
}
function pause(){
 if(running)now=Math.max(0,Math.min(T.duration,(performance.now()-origin)/1000));
 running=false;cancelAnimationFrame(raf);label();renderWatch();
}
function tick(n){
 if(!running||mode!=="watch")return;
 now=Math.max(0,Math.min(T.duration,(n-origin)/1000));if(end()){now=T.duration;running=false;label();renderWatch();return;}
 renderWatch();raf=requestAnimationFrame(tick);
}
function start(){
 if(mode!=="watch")return;
 if(end())go(0);
 running=true;origin=performance.now()-now*1000;label();renderWatch();raf=requestAnimationFrame(tick);
}
function fitTry(){
 if(mode!=="try")return;
 const p=$("host").getBoundingClientRect(), h=window.visualViewport?.height||document.documentElement.clientHeight;
 const mobile=matchMedia("(max-width:700px)").matches;
 const width=Math.floor(Math.max(mobile?163:162,Math.min(290,(h-(p.top+window.scrollY)-(mobile&&h>=700?90:12))*558/1168)));
 stage.style.setProperty("--try-fit",width+"px");
 revealMenu(true);
}
function fit(){
 if(mode!=="watch"){fitTry();return;}
 const host=$("host").getBoundingClientRect(), h=window.visualViewport?.height||document.documentElement.clientHeight;
 if(!host.width)return;
 const phone=matchMedia("(max-width:700px)").matches,short=focused&&!phone&&h<=650;
 const top=focused?host.top:host.top+window.scrollY;
 const strip=$("watch-player").getBoundingClientRect().height;
 const reserve=short?12:strip+8;
 stage.style.setProperty("--fit",Math.floor(Math.max(140,Math.min(focused?342:300,(h-top-reserve)*558/1168)))+"px");
 revealMenu(false);
}
const covered=[document.querySelector("main>header"),document.querySelector("main>.tabs"),document.querySelector("main>.notes")];
function focus(v){
 focused=mode==="watch"&&Boolean(v);
 stage.classList.toggle("focused",focused);document.body.classList.toggle("focus-open",focused);
 covered.forEach(el=>el.inert=focused);
 const f=$("focus-view");f.setAttribute("aria-pressed",String(focused));f.setAttribute("aria-label",focused?"Exit focused view":"Focused view");f.textContent=focused?"Exit":"⛶";
 if(focused)stage.scrollTop=0;
 fit();
}
const observer=new ResizeObserver(fit);
[...covered.slice(0,2),$("watch-message"),$("watch-player"),$("try-brief")].forEach(el=>observer.observe(el));
window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
$("stage-play").addEventListener("click",()=>{play.focus({preventScroll:true});start();});
play.addEventListener("click",()=>running?pause():start());
seek.addEventListener("input",()=>go(seek.value));
$("back").addEventListener("click",()=>go(now-10));$("next").addEventListener("click",()=>go(now+10));$("replay").addEventListener("click",()=>{pause();go(0);start();});
$("focus-view").addEventListener("click",()=>focus(!focused));
document.addEventListener("keydown",e=>{
 if(mode!=="watch"||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==="Escape"&&focused){focus(false);return;}
 if(e.target!==stage&&e.target!==document.body)return;
 if([" ","k"].includes(e.key)){e.preventDefault();running?pause():start();}
 else if(e.key==="j"||e.key==="l"){e.preventDefault();go(now+(e.key==="j"?-10:10));}
});
function switchTab(to,move=true){
 if(to!=="watch"){if(running)pause();focus(false);}
 mode=to;stage.dataset.mode=mode;const watch=mode==="watch";
 for(const [i,b] of tabs.entries()){b.tabIndex=(watch?0:1)===i?0:-1;b.setAttribute("aria-selected",String(b.tabIndex===0));$(b.getAttribute("aria-controls")).hidden=b.tabIndex!==0;}
 for(const id of ["watch-message","watch-side","watch-player"])$(id).hidden=!watch;
 for(const id of ["try-brief","try-side"])$(id).hidden=watch;
 shell.setInteractive(!watch);shell.setKeys([]);
 $("stage-play").hidden=!watch;
 window.scrollTo({top:0,left:0,behavior:"instant"});
 if(watch){
  lastVisual="";go(now);
  if(restoreFocus||!seenWatch&&matchMedia("(max-height:700px), (max-width:700px) and (max-height:760px)").matches)focus(true);
  seenWatch=true;fit();
 }else renderTry();
 if(move)(watch?play:stage).focus({preventScroll:true});
}
function openTry(preserve=false,move=true){restoreFocus=preserve&&focused;fork=null;state=practice;switchTab("try",move);}
for(const [i,b] of tabs.entries()){
 b.addEventListener("click",()=>i?openTry():switchTab("watch"));
 b.addEventListener("keydown",e=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
   e.preventDefault();const pick=e.key==="Home"?0:e.key==="End"?1:1-i;
   if(pick)openTry(false,false);else switchTab("watch",false);
   tabs[pick].focus({preventScroll:true});
 });
}
$("take-over").addEventListener("click",()=>{
 if(running)pause();
 if(end()){openTry(true);return;}
 restoreFocus=focused;fork=now.toFixed(3);
 state=forks.get(fork)??snapshot(now).s;
 forks.delete(fork);forks.set(fork,state);if(forks.size>32)forks.delete(forks.keys().next().value);
 switchTab("try");
});
$("return-watch").addEventListener("click",()=>switchTab("watch"));
$("reset").addEventListener("click",()=>{
 if(fork!==null){openTry();return;}
 practice=scene(problem);state=practice;$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
});
const theme=$("theme");
try{theme.value=["light","dark"].includes(localStorage.getItem("ti-lab-theme"))?localStorage.getItem("ti-lab-theme"):"system";}catch{}
function setTheme(){document.documentElement.dataset.theme=theme.value;try{localStorage.setItem("ti-lab-theme",theme.value);}catch{}}
theme.addEventListener("change",setTheme);setTheme();
fields();
if(q.get("mode")==="try")openTry(false,false);else switchTab("watch",false);
})();
