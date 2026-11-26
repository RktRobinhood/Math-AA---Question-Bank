"use strict";
(function(){
const $=id=>document.getElementById(id),M=CT28,T=CT28Tape;
const stage=$("stage"),play=$("play"),seek=$("seek"),field=$("cell-text");
const params=new URLSearchParams(location.search),tabs=[$("watch-tab"),$("try-tab")];
let problem=M.original,invalid=false;
try{const p=M.link(params);if(p)problem=p;}catch{invalid=true;}
const surface=$("watch-surface"), frameKey="qb-calculator-watch-frame";
let pref="screen";try{if(localStorage.getItem(frameKey)==="full")pref="full";}catch{}
let mode="watch",state=M.init(),worked=false,clock=0,origin=0,frame=0,playing=false,stamp="",showCC=true,scale=1,recording=null,pendingAudio=-1;
const layoutFor=cuts=>TeachingHolds.make(T.beats.map((b,i)=>[cuts[i],cuts[i+1],b.hold]),scale);
let layout=layoutFor(T.cuts);
const shell=HandheldShell.mount({host:$("handheld-host"),screen:$("lcd"),label:"TI-Nspire CX II-T Lists & Spreadsheet",interactive:false,onKey:press});
const fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x)%60).padStart(2,"0");
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
function source(el,p,caption){
 el.replaceChildren();
 if(caption)el.append(node("caption","",caption));
 const h=node("thead"),tr=node("tr"),tb=node("tbody");
 for(const x of ["Measured value",...(p.f?["Frequency"]:[])]){const e=node("th","",x);e.scope="col";tr.append(e);}
 h.append(tr);
 p.v.forEach((x,i)=>{const row=node("tr");row.append(node("td","",x));if(p.f)row.append(node("td","",p.f[i]));tb.append(row);});
 el.append(h,tb);
}
source($("source-table"),problem,problem.f?"Source frequency table":"Source readings");
function cell(s,c,r,interactive){
 const col=s.cols[c],active=s.c===c&&s.row===r,edited=active&&s.buf!==null;
 const value=edited?s.buf:r===-2?col.name:r===-1?"":col.v[r];
 const h=node(interactive?"button":"span",r===-2?"entrycell":"cell-face");
 h.classList.toggle("calc-active",active);if(r===-2)h.append(node("b","","AB"[c]));
 h.append(node("span",value===null?"blank":"",value??"_"));
 if(interactive){
  h.type="button";h.dataset.cell=M.label(c,r).replace(" ","-");h.setAttribute("aria-label",M.label(c,r)+": "+(value===""||value===null?"blank":value));h.setAttribute("aria-pressed",String(active));
  h.addEventListener("click",()=>{worked=true;state=M.select(state,c,r);recorded();paintTry();if(r!==-1)field.focus({preventScroll:true});});
 }
 return h;
}
function lcd(s,interactive=false){
 const d=$("lcd-body"),title=$("lcd-title"),rich=$("lcd-text");d.replaceChildren();
 $("lcd-entryline").hidden=s.page!=="sheet";
 if(s.page==="home"||s.page==="new"||s.page==="insert"){
  const home=s.page==="home", options=home?["1 New Document","2 Browse","3 Recent","4 Current","5 Settings"]:["1: Add Calculator","2: Add Graphs","3: Add Geometry","4: Add Lists & Spreadsheet","5: Add Data & Statistics","6: Add Notes"];
  title.textContent=home?"Home":s.page==="insert"?"Insert page":"New Document";
  const list=node("ul","home-keys");options.forEach((x,i)=>{const row=node("li",i===0?"calc-active":"",x);list.append(row);});d.append(list);
  rich.textContent=home?"Home. Choose 1: New Document.":"New Document. Choose 4: Add Lists & Spreadsheet.";return;
 }
 title.textContent="1."+s.sheet+"  Lists & Spreadsheet";
 const table=node("table","spread"),head=node("thead"),hr=node("tr"),body=node("tbody");
 hr.append(node("th","rowno",""));for(let c=0;c<2;c++){const e=node("th","headcell");e.append(cell(s,c,-2,interactive));hr.append(e);}
 head.append(hr);table.append(head);
 const row=(r)=>{
  const e=node("tr");if(r===-1)e.setAttribute("name","formula");
  e.append(node("th","rowno",r===-1?"=":r+1));
  for(let c=0;c<2;c++){const el=node("td","");el.append(cell(s,c,r,interactive));e.append(el);}return e;
 };
 body.append(row(-1));const start=Math.max(0,Math.min(M.N-5,s.row-4));
 for(let r=start;r<Math.min(M.N,start+5);r++)body.append(row(r));
 table.append(body);d.append(table);
 const current=s.buf??(s.row===-2?s.cols[s.c].name:s.row===-1?(s.cols[s.c].name?s.cols[s.c].name+":=":"="):s.cols[s.c].v[s.row])??"";
 $("selection").textContent=M.label(s.c,s.row)+":";$("lcd-value").textContent=current;$("lcd-value").hidden=interactive&&s.row!==-1;
 const coltext=s.cols.map((x,i)=>"Column "+"AB"[i]+": "+(x.name||"unnamed")+"; "+x.v.slice(0,Math.max(3,x.v.findLastIndex(y=>y!==null)+1)).map(y=>y??"blank").join(", ")).join(". ");
 rich.textContent="Selected "+M.label(s.c,s.row)+". "+coltext+(s.buf!==null?". Entering "+s.buf:"")+(s.err?". "+s.err:".");
}
function scene(point){
 const index=point.span.i,beat=T.beats[index],keys=beat.keys;
 const n=point.speaking?0:Math.min(keys.length,Math.max(0,Math.floor(point.fraction*(keys.length+1))));
 let s=M.init("home");
 for(let j=0;j<index;j++)for(const k of T.beats[j].keys)s=M.step(s,k);
 for(let j=0;j<n;j++)s=M.step(s,keys[j]);
 return {index,n,s,keys,beat};
}
const transport=CalculatorWatchPlayer.mount({player:stage,surface,play,seek,expand:$("fullscreen"),feedback:$("play-feedback"),active:()=>mode==="watch"});
function framePreference(next){
 if(next){pref=next;try{localStorage.setItem(frameKey,pref);}catch{}}
 stage.dataset.frame=mode==="watch"?pref:"full";
 for(const v of ["screen","full"])$("view-"+v).setAttribute("aria-pressed",String(pref===v));
}
$("view-screen").onclick=()=>framePreference("screen");$("view-full").onclick=()=>framePreference("full");
function subtitle(point){
 if(!showCC)return "";
 if(!recording)return point.speaking?T.beats[point.span.i].caption:"";
 const t=point.audioTime*1000;
 return point.speaking?(recording.captions.find(v=>v.startMs<=t&&t<v.endMs)?.text||""):"";
}
function paintWatch(){
 if(mode!=="watch")return;
 const point=layout.at(clock),v=scene(point),cap=$("caption");
 seek.max=layout.duration;seek.value=clock;
 seek.setAttribute("aria-valuetext",fmt(clock)+" of "+fmt(layout.duration));$("clock").textContent=fmt(clock)+" / "+fmt(layout.duration);
 const spoken=subtitle(point);
 if(cap.textContent!==spoken)cap.textContent=spoken;
 cap.hidden=!showCC;
 const next=v.index+":"+v.n;
 if(next===stamp)return;
 stamp=next;
 shell.setKeys(v.n?[v.keys[v.n-1]]:[]);
 lcd(v.s);
 $("beat-title").textContent=v.beat.title;$("takeaway").textContent=v.beat.tip;
 const groups=v.beat.groups, current=Math.max(0,v.n-1);
 let start=0,g=groups[0];
 for(const group of groups){g=group;if(current<start+g[1])break;start+=g[1];}
 $("key-group").textContent=g[0];
 const entries=v.keys.slice(start,start+g[1]).map((k,i)=>{const li=node("li",start+i<v.n?"key-complete":"",T.names[k]||k);if(start+i===v.n-1)li.setAttribute("aria-current","step");return li;});
 const strip=$("key-steps");
 strip.replaceChildren(...entries);
 strip.scrollLeft=0;
}
function recorded(){$("assess-feedback").textContent="";}
function paintTry(fromType=false){
 if(mode!=="try")return; lcd(state,true);
 $("try-context").textContent=M.context(problem);
 const visible=state.page==="sheet"&&state.row!==-1;
 $("typed").hidden=!visible;
 field.inputMode=state.row===-2?"text":"decimal";
 if(!fromType){const q=state.cols[state.c],prev=state.row===-2?q.name:q.v[state.row];field.value=visible?state.buf??prev??"":"";}
 const error=state.err||(invalid&&!worked?"That Try link could not load. The original table is shown.":"");
 $("tool-status").textContent=error;$("tool-status").dataset.error=String(Boolean(error));
}
function press(key){
 if(mode!=="try")return;
 worked=true;recorded();state=M.step(state,key);paintTry();
}
function feedback(m){$("assess-feedback").dataset.error=String(!m.ok);$("assess-feedback").textContent=m.message;}
$("assess").addEventListener("click",()=>{worked=true;feedback(M.check(state,problem));});
field.addEventListener("input",()=>{worked=true;recorded();state={...state,buf:field.value,err:""};paintTry(true);});
$("typed").addEventListener("submit",e=>{
 e.preventDefault();worked=true;recorded();state=M.typed(state,field.value);
 paintTry();if(state.err)field.select();
});
const label=()=>{
 const t=playing?"Pause":clock>=layout.duration-.007?"Replay":"Play";
 play.querySelector(".watch-play-icon").hidden=playing;play.querySelector(".watch-pause-icon").hidden=!playing;
 play.setAttribute("aria-label",t);play.title=t;
};
function pause(){
 playing=false;cancelAnimationFrame(frame);recording?.audio.pause();pendingAudio=-1;label();
}
function seekTo(t){
 clock=Math.min(layout.duration,Math.max(0,Number(t)||0));
 const p=layout.at(clock);origin=performance.now()-clock*1000;
 if(recording){recording.audio.pause();recording.audio.currentTime=p.audioTime;}
 pendingAudio=-1;paintWatch();label();
}
function failRecording(){
 if(!recording)return;
 const old=layout;recording.audio.pause();recording.audio.remove();recording.release();recording=null;
 layout=layoutFor(T.cuts);clock=layout.remap(old,clock);origin=performance.now()-clock*1000;
 $("sound").hidden=true;$("media-state").textContent="Caption rehearsal · narration unavailable";pendingAudio=-1;
 paintWatch();
}
function tick(t){
 if(!playing||mode!=="watch")return;
 if(!recording){clock=Math.min(layout.duration,Math.max(0,(t-origin)/1000));}
 else{
  const {audio}=recording,p=layout.at(clock),s=p.span;
  if(p.speaking){
   if(pendingAudio!==s.i){pendingAudio=s.i;audio.currentTime=p.audioTime;audio.playbackRate=1;audio.play().catch(()=>{if(playing&&recording?.audio===audio)failRecording();});}
   const a=audio.currentTime;
   if(a>=s.to-.015||audio.ended){audio.pause();clock=s.voiceEnd;origin=t-clock*1000;pendingAudio=-1;}
   else if(a>=s.from)clock=s.start+a-s.from;
  }else{
   audio.pause();clock=Math.min(s.end,(t-origin)/1000);
   if(clock===s.end){origin=t-clock*1000;pendingAudio=-1;}
  }
 }
 paintWatch();if(clock>=layout.duration-.0001){pause();return;}frame=requestAnimationFrame(tick);
}
function toggle(){
 if(playing){pause();transport.flash(false);return;}
 if(clock>=layout.duration-.007)seekTo(0);
 playing=true;origin=performance.now()-clock*1000;label();transport.flash(true);frame=requestAnimationFrame(tick);
}
play.addEventListener("click",toggle);
seek.addEventListener("input",()=>seekTo(seek.value));
$("pauses").addEventListener("change",()=>{
 const old=layout;scale=Number($("pauses").value);layout=layoutFor(recording?.cuts||T.cuts);seekTo(layout.remap(old,clock));
});
$("captions").onclick=()=>{showCC=!showCC;$("captions").setAttribute("aria-pressed",String(showCC));$("captions").setAttribute("aria-label",showCC?"Hide captions":"Show captions");paintWatch();};
$("sound").onclick=()=>{if(!recording)return;const a=recording.audio;a.muted=!a.muted;$("sound").textContent=a.muted?"Unmute":"Mute";$("sound").setAttribute("aria-label",a.muted?"Unmute narration":"Mute narration");};
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
function reset(){worked=true;state=M.init();field.value="";recorded();}
function switchTo(next){
 if(next===mode&&stage.dataset.mode===mode)return;
 if(next==="try"){pause();transport.clear();transport.exit();}
 mode=next;stage.dataset.mode=mode;stamp="";const watch=mode==="watch";
 for(const id of ["watch-player","watch-panel","media-state"])$(id).hidden=!watch;
 $("caption").hidden=!watch||!showCC;
 for(const id of ["try-header","try-panel"])$(id).hidden=watch;
 tabs.forEach((b,i)=>{const yes=watch===(i===0);b.tabIndex=yes?0:-1;b.setAttribute("aria-selected",String(yes));});
 shell.setKeys([]);shell.setInteractive(!watch);framePreference();
 if(watch){paintWatch();label();}else paintTry();
}
tabs.forEach((b,i)=>{
 b.addEventListener("click",()=>{switchTo(i?"try":"watch");if(i)stage.focus({preventScroll:true});});
 b.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const k=e.key==="Home"?0:e.key==="End"?1:1-i;switchTo(k?"try":"watch");tabs[k].focus();}});
});
$("return").addEventListener("click",()=>{switchTo("watch");play.focus({preventScroll:true});});
$("reset").addEventListener("click",()=>{reset();paintTry();stage.focus({preventScroll:true});});
document.addEventListener("keydown",e=>{
 const el=e.target;if(mode!=="try"||(!stage.contains(el)&&el!==document.body)||e.altKey||e.metaKey||e.ctrlKey)return;
 if(el===field){if(["ArrowUp","ArrowDown","Escape"].includes(e.key)){e.preventDefault();press(e.key==="Escape"?"esc":e.key==="ArrowUp"?"up":"down");if($("typed").hidden)stage.focus({preventScroll:true});}return;}
 if(el.closest("input,textarea,select,a,summary,[contenteditable]")||(el.closest("button")&&["Enter"," "].includes(e.key)))return;
 const keys={Home:"home",Escape:"esc",Enter:"enter",Tab:"tab",Backspace:"del",Delete:"del",ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down","-":"neg",".":"dot","+":"plus"};
 const k=keys[e.key]||(/^[a-z0-9]$/i.test(e.key)?e.key.toLowerCase():"");
 if(k&&(!(k==="tab")||el===stage)){e.preventDefault();if(el===document.body)stage.focus({preventScroll:true});press(k);}
});
switchTo(params.get("mode")==="try"?"try":"watch");
CT28Media.load().then(data=>{
 if(!data)return;
 const previous=layout;recording=data;layout=layoutFor(data.cuts);stage.append(data.audio);
 data.audio.addEventListener("error",failRecording,{once:true});$("sound").hidden=false;$("media-state").textContent="Narrated walkthrough";
 seekTo(layout.remap(previous,clock));
}).catch(()=>{$("media-state").textContent="Caption rehearsal · narration unavailable";});
})();
