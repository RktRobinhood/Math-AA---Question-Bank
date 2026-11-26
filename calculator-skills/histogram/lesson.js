(function(){
"use strict";
const M=FreqHistogram,T=HistTape,$=id=>document.getElementById(id), q=new URLSearchParams(location.search);
const stage=$("stage"),host=$("host"),lcd=$("lcd"),screen=$("screen");
const controls=["data","width","alignment","bin","cutoff"], base=M.readCase(T.practice), work=M.readCase(T.demo);
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
let state=scene(problem), mode="watch", lastVisual="", returnToWatch;
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
const shell=CalculatorLessonHandset.mount(host,{screen:lcd,label:"TI-Nspire CX II-T Data and Statistics",interactive:false,onKey:k=>{interact(k);stage.focus({preventScroll:true});}});
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
 const bars=z.map((b,i)=>'<rect data-bin-index="'+i+'" class="bin'+(b.count?"":" empty")+(s.index===i?" active":"")+(s.countThrough&&b.upper<=40000?" counted":"")+'" x="'+(x0+i*w).toFixed(2)+'" y="'+(y0-(b.count||.035)*H/max).toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+((b.count||.035)*H/max).toFixed(2)+'"/>').join("");
 const edges=[...z.map(b=>b.lower),z.at(-1).upper];const labels=edges.map((n,i)=>(i===z.length||i%stride===0&&(z.length-i>=stride||i===0))?'<text x="'+(x0+i*w).toFixed(2)+'" y="164" text-anchor="'+(i===z.length?"end":i===0?"start":"middle")+'">'+M.text(n)+'</text>':"").join("");
 const cursor=s.countThrough?'<p class="readout">Before 40: 4 + 5 + 3 = 12</p>':s.index===null?"":'<p class="readout">'+M.row(z[s.index].lower,z[s.index].upper)+' · '+z[s.index].count+' points</p>';
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
 $("screen-text").textContent=s.countThrough?"Before 40: 4 + 5 + 3 = 12; 40 is excluded.":s.menu==="dialog"?"Equal Bin Width settings. Width "+s.fields[0]+". Alignment "+s.fields[1]+".":s.menu?selected||"Select reading on the horizontal axis.":traced?M.row(traced.lower,traced.upper)+", "+traced.count+" points.":s.plot==="unbound"?"Click to add variable.":s.plot==="dot"?"Dot plot of reading.":"Frequency histogram, "+z.length+" bins.";
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
   else{renderTry();}
 }else if(i!==undefined&&state.plot==="histogram"&&!state.menu){
   const bins=M.bins(state.data,state.width,state.alignment), j=Number(i);
   state={...state,index:j,visited:[...new Set([...state.visited,bins[j].lower])]};

   renderTry();
 }else return;
 stage.focus({preventScroll:true});
});
document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
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
 $("link-notice").hidden=!invalid;
 $("try-title").textContent=linked?"Linked histogram practice":"Try a new histogram";
 $("error").textContent=state.error;
 revealMenu(true);

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
 e.preventDefault();
 try{problem=M.readCase(Object.fromEntries(controls.map(k=>[k,$(k).value])));invalid="";linked=false;state=scene(problem);fields();$("case-error").textContent="";$("custom-case").open=false;renderTry();window.scrollTo({top:0,left:0,behavior:"instant"});stage.focus({preventScroll:true});}
 catch(error){$("case-error").textContent=error.message;}
});
for(const k of ["frequency","cumulative"])$(k).addEventListener("input",()=>{$("feedback").textContent="";});
$("answer-form").addEventListener("submit",e=>{
 e.preventDefault();
 const p=problem,z=M.result(p),freq=$("frequency").value.trim(),cf=$("cumulative").value.trim();
 if(!/^\d{1,2}$/.test(freq)||!/^\d{1,2}$/.test(cf)){$("feedback").textContent="Enter two whole-number counts.";return;}
 if(state.plot!=="histogram"||!state.applied||state.width!==p.width||(state.alignment-p.alignment)%p.width!==0){$("feedback").textContent="Apply the requested width and alignment on the calculator first.";return;}
 if(!state.visited.includes(p.lower)){$("feedback").textContent="Use Graph Trace or point at the requested class before checking.";return;}
 if(+freq===z.frequency&&+cf===z.cumulative)$("feedback").textContent="Correct. The class count is "+z.frequency+". The counts of whole classes below the cutoff add to "+z.cumulative+".";
 else $("feedback").textContent=+freq===z.frequency?"The class count is right. For the cumulative count, add just the classes that end at or below the cutoff.":"Not yet. Read the half-open interval shown on the calculator, then check the cutoff.";
});

const keys=[["press-1", "tab"], ["press-2", "select"], ["press-3", "menu"], ["press-4", "1"], ["press-5", "3"], ["press-6", "menu"], ["press-7", "2"], ["press-8", "2"], ["press-9", "2"], ["press-10", "1"], ["press-11", "1"], ["press-12", "0"], ["press-13", "tab"], ["press-14", "1"], ["press-15", "0"], ["press-16", "enter"], ["press-17", "menu"], ["press-18", "4"], ["press-19", "a"], ["press-20", "right"]];
function renderWatch(device,{beat,point,key,crossed}){
 if(host.parentElement!==device)device.append(host);
 let s=scene(work);
 const past=new Set(crossed.map(x=>x.id));
 for(const [id,k] of keys)if(past.has(id))s=step(s,k);
 if(beat===6)s={...s,countThrough:true,index:null,trace:false};
 const actual=keys.find(x=>x[0]===key?.id)?.[1], hold=point.span.end-point.span.voiceEnd;
 shell.setKeys(actual&&key.beat===beat&&!point.speaking&&(point.fraction-key.at)*hold<.65?[actual]:[]);
 const signature=beat+":"+past.size;
 if(signature===lastVisual)return;
 lastVisual=signature;draw(s,false);revealMenu(false);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;
 device.prepend(stage);$("try-grid").prepend(host);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);renderTry();stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";lastVisual="";stage.hidden=true;shell.setKeys([]);shell.setInteractive(false);
}
$("return-watch").addEventListener("click",()=>returnToWatch?.());
$("reset").addEventListener("click",()=>{
 state=scene(problem);$("feedback").textContent="";renderTry();stage.focus({preventScroll:true});
});
fields();
window.CalculatorLessonAdapter=Object.freeze({initialMode:q.get("mode")==="try"?"try":"watch",renderWatch,enterTry,exitTry});
})();
