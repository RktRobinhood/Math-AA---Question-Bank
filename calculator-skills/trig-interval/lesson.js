"use strict";
(function(){
function lessonEnd(){return (window.visualViewport?.height||innerHeight)-(document.querySelector("body > .tabbar")?.offsetHeight||0);}
const $=id=>document.getElementById(id),M=CT14Math,T=CT14Tape,stage=$("stage"),lcd=$("lcd"),canvas=$("drawing"),ctx=canvas.getContext("2d"),seek=$("seek"),play=$("play");
const RAD="rad",DEG="deg",P=M.make("sin",".5",DEG,"30","390",true,false),Q=M.make("sin","1",DEG,"0","180",false,false);
const preset=M.make("cos","-1",RAD,"0","3pi",true,true),params=new URLSearchParams(location.search);
let exercise=preset,badLink=false;const names=["fn","level","unit","left","right","lc","rc"],hasLink=names.some(k=>params.has(k));
if(hasLink)try{
 if(names.some(k=>params.getAll(k).length>1)||names.slice(0,5).some(k=>!params.has(k)))throw Error("Incomplete link");
 const flag=k=>{const t=params.get(k);if(t!==null&&!/^[01]$/.test(t))throw Error("Invalid endpoint");return t!=="0";};
 exercise=M.make(params.get("fn"),params.get("level"),params.get("unit"),params.get("left"),params.get("right"),flag("lc"),flag("rc"));
}catch{badLink=true;}
const create=(problem,mode=RAD,plot=false)=>({problem,mode,pendingMode:mode,stage:plot?"graphs":"entry",plot,field:0,low:null,high:null,typed:"",which:"intersection",mark:null,msg:"",cursor:null,selected:false,fork:false});
let state=create(exercise),tab="watch",t=0,raf=0,stamp="",started=false,running=false,origin=0,focused=false,prevFocus=false,touched=false,forked=false;
const shell=HandheldShell.mount({host:$("handheld-host"),screen:lcd,label:"TI-Nspire CX II-T Graphs",interactive:false,onKey:k=>key(k)});
const menu=["1: Actions","2: View","3: Graph Entry/Edit","4: Window/Zoom","5: Trace","6: Analyze Graph","7: Table","8: Geometry","9: Settings…"];
const analysis=["1: Zero","2: Minimum","3: Maximum","4: Intersection","5: dy/dx","6: Integral"];
const fields=["Display Digits","Graphing Angle","Geometry Angle","Grid","Hide plot labels","Show axis end values","Show function tool tips","Find points of interest","Force integer triangle angles","Label points","OK","Cancel"];
const angleModes=["Auto","Radian","Degree","Gradian"],modeName=u=>({rad:"Radian",deg:"Degree",gra:"Gradian",auto:"Auto"})[u];
const plotUnit=s=>s.mode==="deg"?"deg":"rad";
const fmt=x=>M.fmt(x),angle=(x,u)=>M.exact(x,u);
const label=o=>o.fn+" x = "+fmt(o.c)+"; "+angle(o.l,o.unit)+(o.lc?" ≤ x ":" < x ")+(o.rc?"≤ ":"< ")+angle(o.r,o.unit)+(o.unit===RAD?" (radians)":"");
const same=(a,b)=>a.fn===b.fn&&a.c===b.c&&a.unit===b.unit&&a.l===b.l&&a.r===b.r&&a.lc===b.lc&&a.rc===b.rc;
const hints={entry:"Plot the prepared function and horizontal line.",graphs:"Check RAD or DEG at the top. Press Menu when ready.",menu:"Choose 9: Settings or 6: Analyze Graph.",analysis:"For a crossing, choose Intersection. A touch may need Maximum or Minimum.",settings:"Select Graphing Angle, then confirm with OK.",angle:"Use the arrows to choose Degree or Radian.",curve:"Select the sinusoidal curve, not the horizontal line.",lower:"Type or point to an angle left of one point, then press Enter.",upper:"Type or point to an angle right of the same point, then press Enter.",result:"Check this point’s height against the target. Decide whether the angle is in the interval."};
function selectTool(s){
 if(!s.plot){s.stage="entry";s.msg="Plot both functions before analyzing.";return;}
 s.low=s.high=s.cursor=null;s.typed="";s.mark=null;
 s.stage=s.which==="intersection"?"lower":"curve";
}
function apply(s,k){
 const w=s.stage;s.msg="";
 if(k==="esc"){s.stage=w==="angle"?"settings":w==="analysis"?"menu":s.plot?"graphs":"entry";return;}
 if(k==="menu"){s.stage="menu";return;}
 if(w==="menu"){
  if(k==="9"){s.stage="settings";s.field=0;s.pendingMode=s.mode;}
  if(k==="6")s.stage="analysis";
  return;
 }
 if(w==="settings"){
  if(k==="tab"||k==="down"||k==="up"){s.field=(s.field+fields.length+(k==="up"?-1:1))%fields.length;return;}
  if(s.field===1&&["right","enter","select"].includes(k)){s.stage="angle";return;}
  if(k==="enter"||k==="select"){
   if(s.field===10)s.mode=s.pendingMode;
   if(s.field>=10){s.mark=null;s.stage=s.plot?"graphs":"entry";}
  }
  return;
 }
 if(w==="angle"){
  const modes=["auto","rad","deg","gra"],at=modes.indexOf(s.pendingMode);
  if(k==="down"||k==="up")s.pendingMode=modes[(at+4+(k==="down"?1:-1))%4];
  if(k==="enter"||k==="select")s.stage="settings";
  return;
 }
 if(w==="analysis"&&["2","3","4"].includes(k)){s.which=k==="2"?"min":k==="3"?"max":"intersection";selectTool(s);return;}
 if(w==="curve"&&["enter","select"].includes(k)){s.stage="lower";s.selected=true;return;}
 if(w!=="lower"&&w!=="upper")return;
 if(k==="left"||k==="right"){const ww=M.windowFor(s.problem);s.cursor=Math.max(ww.x0,Math.min(ww.x1,(s.cursor??(ww.x0+ww.x1)/2)+(k==="left"?-1:1)*(ww.x1-ww.x0)/48));s.typed="";return;}
 if(k==="enter"||k==="select"){
  const v=s.typed?M.num(s.typed,plotUnit(s)):s.cursor,ww=M.windowFor(s.problem);
  if(!Number.isFinite(v)||v<ww.x0||v>ww.x1){s.msg="Enter a bound in the displayed window.";return;}
  if(w==="lower"){s.low=v;s.cursor=v;s.typed="";s.stage="upper";return;}
  if(v<=s.low){s.msg="The upper bound must be to the right of the lower bound.";return;}
  s.high=v;s.typed="";s.stage="result";
  if(s.mode==="gra"||plotUnit(s)!==s.problem.unit){s.msg="The graph’s angle unit does not match the problem. Change Graphing Angle first.";return;}
  const found=M.tool(s.problem,plotUnit(s),s.which,s.low,v);
  s.mark=found.error?null:found;s.msg=found.error||"";
  return;
 }
 if(k==="del")s.typed=s.typed.slice(0,-1);
 else if(["minus","neg"].includes(k)&&!s.typed)s.typed="-";
 else if(k==="dot"&&!s.typed.includes("."))s.typed+=".";
 else if(/^\d$/.test(k)&&s.typed.length<19)s.typed+=k;
}
const W=320,H=240,G={l:16,r:310,t:26,b:218},stroke=(x,y,v,w,c,width=.8,dash=[])=>{
 ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=c;ctx.lineWidth=width;ctx.moveTo(x,y);ctx.lineTo(v,w);ctx.stroke();ctx.setLineDash([]);
};
const block=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
const text=(s,x,y,n=10,c="#1c2a35",b=false,position="left")=>{ctx.fillStyle=c;ctx.font=(b?"bold ":"")+n+"px Arial";ctx.textAlign=position;ctx.fillText(s,x,y);};
const panel=(a,x,y,w,selected=-1)=>{block(x+2,y+2,w,a.length*15+4,"#40475088");block(x,y,w,a.length*15+2,"#173246");block(x+1,y+1,w-2,a.length*15,"#f7f8f8");a.forEach((l,i)=>{if(i===selected)block(x+1,y+1+15*i,w-2,15,"#2f6fac");text(l,x+5,y+12+15*i,10,i===selected?"white":"#17232d",i===selected);});};
const markLabel=s=>s.mark?(s.which==="max"?"Maximum":s.which==="min"?"Minimum":"Intersection")+": ("+fmt(s.mark.x)+", "+fmt(s.mark.y)+")"+(s.mark.solution?"":" · height is not the target"):"";
function draw(s){
 ctx.setTransform(2,0,0,2,0,0);block(0,0,320,240,"#fff");
 block(0,0,320,20,"#182732");block(4,4,24,14,"#dce9f1");text("1.1",8,15,10,"#102434",true);
 text((plotUnit(s)==="deg"?"DEG":s.mode==="gra"?"GRAD":"RAD"),273,14,9,"#f7fcff",true);block(303,8,12,6,"#9fd660");
 const w=M.windowFor(s.problem),xx=x=>G.l+(x-w.x0)/(w.x1-w.x0)*(G.r-G.l),yy=y=>G.b-(y-w.y0)/(w.y1-w.y0)*(G.b-G.t);
 const y0=yy(0),u=plotUnit(s),ink="#43794c",fcol="#163ba9",gcol="#b6352e";
 if(s.plot){
  ctx.save();ctx.beginPath();ctx.rect(G.l,G.t,G.r-G.l,G.b-G.t);ctx.clip();
  const end=Number.isFinite(s.high)?s.high:s.stage==="upper"?M.num(s.typed,u)||s.cursor:null;
  if(Number.isFinite(s.low)&&Number.isFinite(end)&&end>s.low)block(xx(s.low),G.t,xx(end)-xx(s.low),G.b-G.t,"#d0d8dba6");
  stroke(G.l,y0,G.r,y0,"#465260");
  if(w.x0<=0&&w.x1>=0)stroke(xx(0),G.t,xx(0),G.b,"#465260");
  for(let i=0;i<=4;i++){const x=s.problem.l+(s.problem.r-s.problem.l)*i/4,px=xx(x);stroke(px,y0-2,px,y0+2,"#465260");if(i>0&&i<4)text(fmt(x),px,y0+10,7.5,"#48515c",false,"center");}
  stroke(G.l,yy(s.problem.c),G.r,yy(s.problem.c),gcol,1.2);
  ctx.beginPath();ctx.strokeStyle=fcol;ctx.lineWidth=1.4;
  const unit=s.mode==="gra"?"rad":u,f=x=>M.val(s.problem.fn,s.mode==="gra"?x*Math.PI/200:x,unit);
  for(let i=0;i<=1200;i++){const x=w.x0+(w.x1-w.x0)*i/1200,y=yy(f(x));if(i)ctx.lineTo(xx(x),y);else ctx.moveTo(xx(x),y);}ctx.stroke();
  for(const x of [s.low,s.high,["lower","upper"].includes(s.stage)?(s.typed?M.num(s.typed,u):s.cursor):null])if(Number.isFinite(x))stroke(xx(x),G.t,xx(x),G.b,ink,.95,[3,3]);
  if(s.stage==="curve"){const mid=(s.problem.l+s.problem.r)/2,x=xx(mid),y=yy(f(mid));stroke(x-4,y,x+4,y,ink,1.25);stroke(x,y-4,x,y+4,ink,1.25);}
  if(s.mark){
   const x=xx(s.mark.x),y=yy(s.mark.y);ctx.beginPath();ctx.arc(x,y,2.5,0,2*Math.PI);ctx.fillStyle="#142838";ctx.fill();
   const where=x>210?"right":"left",px=x+(where==="right"?-6:6),py=y<43?y+15:y-7;
   text("("+fmt(s.mark.x)+", "+fmt(s.mark.y)+")",px,py,13,"#12293b",true,where);
  }
  ctx.restore();
  if(["graphs","menu","analysis"].includes(s.stage)){text("f₁(x)="+s.problem.fn+"(x)",305,34,9,fcol,true,"right");text("f₂(x)="+fmt(s.problem.c),305,46,9,gcol,true,"right");}
 }else{
  stroke(25,150,303,150,"#82929c");stroke(49,37,49,208,"#82929c");
  if(s.stage==="entry"){block(0,219,320,21,"#e6edf4");text("f₁(x) = ",7,233,12);}
 }
 if(s.stage==="menu"||s.stage==="analysis")panel(menu,8,24,119,s.stage==="analysis"?5:-1);
 if(s.stage==="analysis")panel(analysis,126,99,107);
 if(s.stage==="settings"||s.stage==="angle"){
  block(27,22,269,210,"#617186");block(29,24,265,206,"#f0f2f7");block(29,24,265,20,"#c9d9ef");
  text("Graphs & Geometry Settings",38,38,11,"#173453",true);
  const values=["Float 6",modeName(s.pendingMode),"Degree","No Grid"];
  fields.forEach((e,i)=>{
   if(i>=10)return;
   const y=57+i*15;
   if(s.field===i)block(36,y-11,249,14,"#cfdeef");
   text(i>=4?(i===5?"☑ ":"☐ ")+e:e,40,y,9);
   if(i<4){block(167,y-10,118,13,"#e6ebf3");text(values[i],174,y,9);text("▸",271,y,9);}
  });
  for(const [i,x] of [[10,168],[11,228]]){
   block(x,208,52,17,s.field===i?"#356caa":"#d7e2ed");text(fields[i],x+26,220,10,s.field===i?"#fff":"#18334d",true,"center");
  }
  if(s.stage==="angle")panel(angleModes,166,73,112,angleModes.indexOf(modeName(s.pendingMode)));
 }
 if(["curve","lower","upper","result"].includes(s.stage)){
  const txt=s.stage==="curve"?"Select function":s.stage==="lower"?"lower bound?":s.stage==="upper"?"upper bound?":({max:"maximum",min:"minimum",intersection:"intersection"})[s.which];
  block(5,220,176,17,"#e5e8eb");text(txt+(s.typed?"  "+s.typed:""),9,232,10);
 }
 const screen=[(s.mode==="gra"?"GRAD":plotUnit(s).toUpperCase()),s.plot?s.problem.fn+"(x), horizontal target "+fmt(s.problem.c):"Empty Graphs",s.stage==="settings"?fields[s.field]+" "+modeName(s.pendingMode):"",s.stage==="angle"?"Graphing Angle list: "+modeName(s.pendingMode):"",hints[s.stage],Number.isFinite(s.low)?"Lower bound "+fmt(s.low):"",s.typed?"Typed "+s.typed:"",markLabel(s),s.msg];
 $("lcd-text").textContent=screen.filter(Boolean).join(". ");
}
const snapshot=sec=>{
 const second=sec>=30;
 const s=create(second?Q:P,second?DEG:RAD,second);
 let lit="";
 for(const e of T.keys){
  if(e.t>sec)break;
  if(second!==(e.t>=30))continue;
  if(!second&&e.t>=10&&!s.plot){s.plot=true;s.stage="graphs";}
  apply(s,e.key);lit=sec<e.t+.245?e.key:"";
 }
 if(!second&&sec>=10&&!s.plot){s.plot=true;s.stage="graphs";}
 return{s,lit};
};
function htmlHot(x,y,w,h,label,fn){
 const b=document.createElement("button");b.type="button";b.setAttribute("aria-label",label);
 Object.assign(b.style,{left:x/W*100+"%",top:y/H*100+"%",width:w/W*100+"%",height:h/H*100+"%"});
 b.addEventListener("click",fn);$("hotspots").append(b);
}
function watchRender(){
 if(tab!=="watch")return;
 const {s,lit}=snapshot(t),i=T.captions.findLastIndex(row=>row[0]<=t),phase=String(i),key=[i,t>=37.3,s.stage,s.field,s.mode,s.low,s.high,s.typed,s.pendingMode,s.mark?.x].join("|");
 shell.setKeys(lit?[lit]:[]);seek.value=t;$("clock").textContent="0:"+String(Math.floor(t)).padStart(2,"0")+" / 0:41";
 $("stage-play").hidden=started||t>0;
 $("take-over").textContent=t>=T.duration-.01?"Open Try":"Take over";
 if(stamp===key)return;stamp=key;draw(s);
 const row=T.captions[i];$("caption").textContent=t>=37.3?"The maximum is (90°, 1). It touches the target, so count 90° once.":i===5?"Enter the upper bound, then compare the maximum height with the target.":row[2];
 const eq=$("watch-equation");eq.textContent=t>=37.3?"Touch: 90° only · no sign change":t>=30?"New example: sin x = 1 · 0° < x < 180°":t>=23?"Include 30°, 150° · exclude 390°":t>=19.77?"Interior intersection: 150° · endpoints still to check":"sin x = 0.5 · 30° ≤ x < 390°";
 [...$("steps").children].forEach((b,j)=>b.firstElementChild.setAttribute("aria-current",String(j===+phase)));fit();
}
function syncFields(){$("function").value=state.problem.fn;$("level").value=String(state.problem.c);$("bound").value=state.typed;}
function eligible(){return !state.fork&&same(state.problem,exercise);}
function tryRender(){
 if(tab!=="try")return;
 draw(state);$("hotspots").replaceChildren();
 $("keypad-problem").textContent=label(state.problem);
 $("keypad-hint").textContent=hints[state.stage];
 $("answer-form").hidden=!eligible();$("checker-context").hidden=eligible();
 $("checker-context").textContent="Exploration only. Reset to return to the set exercise.";
 if(!eligible())$("feedback").textContent="";
 const out=$("keypad-result"),msg=state.msg||markLabel(state)||(!touched&&badLink?"Invalid linked trig prompt. The original exercise is shown.":"");
 out.hidden=!msg;out.textContent=msg;out.className="feedback"+(state.msg?"is-wrong":"is-right");
 const b=state.stage==="lower"||state.stage==="upper";$("bound-form").hidden=!b;$("retry-bounds").hidden=state.stage!=="result";
 $("bound-label").textContent=(state.stage==="lower"?"Lower":"Upper")+" bound ("+plotUnit(state)+")";
 lcd.classList.toggle("pick",b||state.stage==="curve");
 if(state.stage==="menu"){htmlHot(8,24+15*5,119,15,menu[5],()=>key("6"));htmlHot(8,24+15*8,119,15,menu[8],()=>key("9"));}
 if(state.stage==="analysis")for(const i of [1,2,3])htmlHot(126,99+15*i,107,15,analysis[i],()=>key(String(i+1)));
 if(state.stage==="settings"){
  htmlHot(160,61,127,16,"Graphing Angle",()=>{state.field=1;key("right");});
  htmlHot(167,207,53,18,"OK",()=>{state.field=10;key("enter");});
  htmlHot(227,207,53,18,"Cancel",()=>{state.field=11;key("enter");});
 }
 if(state.stage==="angle")angleModes.forEach((n,i)=>htmlHot(166,73+15*i,112,15,n,()=>{state.pendingMode=["auto","rad","deg","gra"][i];key("enter");}));
}
function key(k){if(tab!=="try")return;touched=true;apply(state,k);$("bound").value=state.typed;tryRender();}
function reset(){state=create(exercise);touched=true;syncFields();$("answer").value="";$("feedback").textContent="";tryRender();}
$("reset-keypad").onclick=()=>{reset();stage.focus({preventScroll:true});};
$("expression-form").onsubmit=e=>{
 e.preventDefault();touched=true;
 try{const q=state.problem,model=M.make($("function").value,$("level").value,q.unit,q.l,q.r,q.lc,q.rc);const old=state;state=create(model,old.mode,true);state.fork=old.fork;syncFields();}
 catch(err){state.msg=err.message;}tryRender();
};
$("bound-form").onsubmit=e=>{e.preventDefault();state.typed=$("bound").value;key("enter");};
$("bound").oninput=()=>{state.typed=$("bound").value;draw(state);};
$("retry-bounds").onclick=()=>{selectTool(state);tryRender();stage.focus({preventScroll:true});};
lcd.onclick=e=>{
 if(tab!=="try"||!lcd.classList.contains("pick")||e.target.closest("button"))return;
 if(state.stage==="curve"){key("select");return;}
 const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,py=(e.clientY-r.top)*H/r.height,w=M.windowFor(state.problem);
 if(px<G.l||px>G.r||py<G.t||py>G.b)return;
 state.typed="";state.cursor=w.x0+(px-G.l)/(G.r-G.l)*(w.x1-w.x0);key("enter");
};
$("answer-form").onsubmit=e=>{
 e.preventDefault();if(!eligible())return;touched=true;
 const ok=M.assess($("answer").value,exercise),out=$("feedback");
 out.className="feedback"+(ok?"is-right":"is-wrong");
 out.textContent=ok?"Correct. Those are all the distinct solutions in the stated interval.":"Check the angle units, every crossing or touch, and which endpoints count. List each angle once.";
};
$("answer").oninput=()=>{$("feedback").textContent="";touched=true;};
function fit(){
 if(tab!=="watch")return;
 const h=lessonEnd(),top=Math.max(0,stage.getBoundingClientRect().top);
 const used=$("watch-message").offsetHeight+$("watch-player").offsetHeight;
 stage.style.setProperty("--watch-fit-width",Math.max(80,Math.min(focused?338:304,Math.floor((h-top-used-24)*558/1168)))+"px");
}
function focus(f){
 focused=Boolean(f);stage.classList.toggle("ct14-focused",focused);document.body.classList.toggle("ct14-focus-open",focused);
 const b=$("focus-view");b.setAttribute("aria-pressed",String(focused));b.setAttribute("aria-label",focused?"Exit focused view":"Focused view");b.textContent=focused?"Exit":"⛶";fit();
}
function showPlay(){const label=running?"Pause":t>=T.duration-.01?"Replay":"Play";play.textContent=label;play.setAttribute("aria-label",label);play.dataset.playing=String(running);}
function seekAt(v){t=Math.max(0,Math.min(T.duration,Number(v)||0));origin=performance.now()-t*1000;watchRender();showPlay();}
function stop(sample=true){if(sample&&running)t=Math.min(T.duration,(performance.now()-origin)/1000);running=false;cancelAnimationFrame(raf);watchRender();showPlay();}
function loop(ts){if(!running)return;t=Math.max(0,Math.min(T.duration,(ts-origin)/1000));if(t>=T.duration){stop(false);return;}watchRender();raf=requestAnimationFrame(loop);}
function start(){
 if(tab!=="watch")return;
 if(!started){const actual=shell.body.getBoundingClientRect();if(!focused&&actual.width<190)focus(true);}
 if(document.activeElement===$("stage-play"))play.focus({preventScroll:true});started=true;$("stage-play").hidden=true;
 if(t>=T.duration-.01)seekAt(0);running=true;origin=performance.now()-t*1000;showPlay();raf=requestAnimationFrame(loop);
}
function toggle(){if(running)stop();else start();}
play.onclick=toggle;$("stage-play").onclick=toggle;seek.oninput=()=>seekAt(seek.value);
$("back").onclick=()=>seekAt(t-10);$("next").onclick=()=>seekAt(t+10);$("replay").onclick=()=>{stop();seekAt(0);start();};
$("focus-view").onclick=()=>focus(!focused);
const tabs=[$("watch-tab"),$("try-tab")];
function mode(next,steal=false){
 if(tab==="watch"&&next==="try"){stop();prevFocus=focused;if(focused)focus(false);}
 if(steal&&!hasLink&&!touched&&!forked){state=snapshot(t).s;state.fork=true;forked=true;}
 tab=next;stage.dataset.mode=next;stamp="";
 const w=next==="watch";
 tabs.forEach((n,i)=>{const yes=w===(i===0);n.setAttribute("aria-selected",String(yes));n.tabIndex=yes?0:-1;});
 for(const i of ["watch","watch-player","watch-message","watch-side"])$(i).hidden=!w;
 for(const i of ["try","try-player","try-side"])$(i).hidden=w;
 $("hotspots").replaceChildren();lcd.classList.remove("pick");shell.setInteractive(!w);shell.setKeys([]);
 if(w){window.scrollTo(0,0);watchRender();if(prevFocus||shell.body.getBoundingClientRect().width<156)focus(true);fit();}
 else{$("stage-play").hidden=true;syncFields();tryRender();}
}
tabs.forEach((b,i)=>{
 b.onclick=()=>{mode(i?"try":"watch");if(i)stage.focus({preventScroll:true});};
 b.onkeydown=e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const j=e.key==="Home"?0:e.key==="End"?1:1-i;mode(j?"try":"watch");tabs[j].focus();};
});
$("return-watch").onclick=()=>{mode("watch");play.focus({preventScroll:true});};
$("take-over").onclick=()=>{const done=t>=T.duration-.01;if(done&&state.fork)reset();mode("try",!done);stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{if(e.target!==document.body&&!e.target.closest?.(".qb-calculator-lesson"))return;
 if(e.key==="Escape"&&focused){e.preventDefault();focus(false);$("focus-view").focus();return;}
 if(e.metaKey||e.ctrlKey||e.altKey||e.target.closest("input,textarea,select,a,summary,[contenteditable]"))return;
 if(tab==="watch"){if(!e.target.closest("button")&&["k"," "].includes(e.key)){e.preventDefault();toggle();}return;}
 if(e.target!==document.body&&!stage.contains(e.target)||e.target.closest("button")&&["Enter"," "].includes(e.key))return;
 const keys={m:"menu",M:"menu",Enter:"enter",Escape:"esc",Tab:"tab",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",Backspace:"del",Delete:"del",".":"dot","-":"neg"};
 if(e.key==="Tab"&&!["angle","settings"].includes(state.stage))return;
 const k=keys[e.key]||(/^\d$/.test(e.key)?e.key:"");if(k){e.preventDefault();key(k);}
});
T.captions.forEach(([at,name],i)=>{
 const li=document.createElement("li"),b=document.createElement("button"),n=document.createElement("span");n.textContent="0"+(i+1);
 b.type="button";b.append(n,document.createTextNode(name));b.onclick=()=>seekAt(at);li.append(b);$("steps").append(li);
});
window.addEventListener("resize",fit);window.visualViewport?.addEventListener("resize",fit);
mode(params.get("mode")==="try"?"try":"watch");
window.QBRecordedWatch?.bind(stop);
})();
