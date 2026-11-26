/* Authored reconstruction of the TI-Nspire CX II-T Exact Arithmetic OS.
   No changes are made to the student's settings or Scratchpad. */
(function(root){
"use strict";
const doc=document,mounts=new WeakMap();
const digits=["Float",...Array.from({length:12},(_,i)=>"Float "+(i+1)),...Array.from({length:13},(_,i)=>"Fix "+i)];
const labels=["Display Digits","Angle","Exponential Format","Real or Complex","Calculation Mode","Exact Arithmetic"];
const angles=["Radian","Degree","Gradian"];
const initial=()=>({screen:"calc",focus:0,drop:null,choice:0,digit:6,angle:0,appliedAngle:0,expr:"",rows:[],control:false,template:false});
function apply(s,type){
 switch(type){
  case "home":s.screen="home";break;
  case "menu":s.screen="settings";break;
  case "dialog":s.screen="dialog";s.focus=0;break;
  case "drop-digits":s.drop="digits";s.choice=s.digit;break;
  case "next-digit":s.choice++;break;
  case "select-digit":s.digit=s.choice;s.drop=null;break;
  case "angle":s.focus=1;break;
  case "drop-angle":s.drop="angle";s.choice=s.angle;break;
  case "next-angle":s.choice++;break;
  case "select-angle":s.angle=s.choice;s.drop=null;break;
  case "exp":s.focus=2;break;
  case "complex":s.focus=3;break;
  case "calc-mode":s.focus=4;break;
  case "drop-calc":s.drop="calc";s.choice=0;break;
  case "select-calc":s.drop=null;break;
  case "ok":s.appliedAngle=s.angle;s.screen="home";break;
  case "current":s.screen="calc";break;
  case "seven":s.expr+="7";break;
  case "divide":s.expr+=" ÷ ";break;
  case "three":s.expr+="3";break;
  case "auto-result":s.rows.push({expr:s.expr,numerator:7,denominator:3});s.expr="";break;
  case "control":s.control=true;break;
  case "approx-result":s.rows.push({expr:s.expr,result:(7/3).toFixed(Number(digits[s.digit].split(" ")[1]))});s.expr="";s.control=false;break;
  case "template":s.template=true;s.control=false;break;
 }
}
const el=(tag,cls,text)=>{
 const node=doc.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;
};
function image(s){
 const wrap=el("div","settings-lcd-art");
 if(s.screen==="calc"){
  const top=el("div","settings-status");top.append(el("b","","1.1"),el("span","","*Doc"),el("small","",s.appliedAngle===1?"DEG":"RAD"),el("i","settings-battery"));
  wrap.append(top);
  const results=el("div","settings-results");
  for(const row of s.rows){
   const line=el("div","settings-result-row");line.append(el("span","",row.expr));
   if(row.numerator!==undefined){const ratio=el("span","settings-ratio");ratio.append(el("span","",row.numerator),el("span","",row.denominator));line.append(ratio);}
   else line.append(el("span","",row.result));
   results.append(line);
  }
  const entry=el("div","settings-entry",s.expr);
  if(s.template){const ratio=el("span","settings-ratio settings-slot");ratio.append(el("span","","□"),el("span","","□"));entry.append(ratio);}
  else entry.append(el("b","settings-caret"));
  wrap.append(results,entry);return wrap;
 }
 if(s.screen==="home"||s.screen==="settings"){
  wrap.append(el("div","settings-home-head","TI-Nspire CX II-T"));
  const columns=el("div","settings-home-cols"),scratch=el("div"),docs=el("div");
  scratch.append(el("b","","Scratchpad"),el("p","","A  Calculate"),el("p","","B  Graph"));
  docs.append(el("b","","Documents"),...["1  New","2  Browse","3  Recent…","4  Current","5  Settings…"].map(t=>el("p","",t)));
  columns.append(scratch,docs);wrap.append(columns);
  if(s.screen==="settings"){
   const menu=el("div","settings-home-menu");
   for(const line of ["1  Change Language","2  Document Settings","3  Handheld Setup","4  Status"])menu.append(el("p","",line));
   wrap.append(menu);
  }
  return wrap;
 }
 const pane=el("div","settings-dialog");
 pane.append(el("div","settings-title","Document Settings"));
 const body=el("div","settings-fields"),values=[digits[s.digit],angles[s.angle],"Normal","Real","Auto","On"];
 for(const [i,label] of labels.entries()){
  const row=el("div","settings-field");row.append(el("span","",label));
  const val=el("span","settings-value"+(s.focus===i?" settings-selected":""),values[i]);val.append(el("i","","▾"));row.append(val);body.append(row);
 }
 const scroll=el("i","settings-scroll");body.append(scroll);pane.append(body);
 const footer=el("div","settings-footer");
 footer.append(...["?","Restore","OK","Cancel"].map(v=>el("span",v==="OK"?"settings-ok":"",v)));
 if(s.drop===null&&s.focus===4)footer.append(el("span","settings-pointer","↖"));
 pane.append(footer);
 if(s.drop){
  const opts=s.drop==="digits"?digits:s.drop==="angle"?angles:["Auto","Approximate"];
  const popup=el("div","settings-options");popup.dataset.kind=s.drop;
  const start=s.drop==="digits"?Math.max(0,Math.min(opts.length-7,s.choice-3)):0;
  opts.slice(start,start+(s.drop==="digits"?7:opts.length)).forEach((v,i)=>popup.append(el("span",i+start===s.choice?"settings-option-current":"",v)));
  pane.append(popup);
 }
 wrap.append(pane);return wrap;
}
function description(s){
 if(s.screen==="dialog"){
  const options=s.drop==="digits"?digits[s.choice]:s.drop==="angle"?angles[s.choice]:s.drop==="calc"?"Auto, Approximate":"";
  return "Document Settings: Display Digits "+digits[s.digit]+"; Angle "+angles[s.angle]+"; Calculation Mode Auto; Exact Arithmetic On. Focus: "+labels[s.focus]+(options?". Open options: "+options:"");
 }
 if(s.screen==="home")return "Home: Scratchpad, Documents. 4 Current, 5 Settings.";
 if(s.screen==="settings")return "Settings menu: 2 Document Settings.";
 return "Calculator page, "+(s.appliedAngle?"DEG":"RAD")+". "+s.rows.map(r=>r.expr+" equals "+(r.result??(r.numerator+" over "+r.denominator))).join(". ")+(s.template?". Stacked fraction template with numerator and denominator boxes.":s.expr?" Entry: "+s.expr:"");
}
function renderWatch(host,{beat,point,crossed}){
 let m=mounts.get(host);
 if(!m){
  const screen=el("div","settings-lcd");screen.setAttribute("role","img");
  const shell=root.CalculatorLessonHandset.mount(host,{screen,label:"TI-Nspire CX II-T non-CAS"});
  m={screen,shell,last:"",lights:""};mounts.set(host,m);
 }
 const last=crossed.at(-1),current=last?.beat===beat&&!point.speaking&&point.fraction-last.at<.07?last:null;
 // Ctrl is a modifier for the next actual key, not an extra automatic press.
 const preceding=current&&crossed.at(-2)?.physical==="ctrl"&&current.physical!=="ctrl";
 const lights=current?(preceding?"ctrl "+current.physical:current.physical):"";
 if(m.lights!==lights){m.lights=lights;m.shell.setKeys(lights?lights.split(" "):[]);}
 const stamp=last?.id??"initial";
 if(stamp===m.last)return;
 m.last=stamp;
 const state=initial();for(const e of crossed)apply(state,e.action);
 m.screen.replaceChildren(image(state));m.screen.setAttribute("aria-label",description(state));
 m.screen.dataset.scene=state.screen;m.screen.dataset.digits=digits[state.digit];m.screen.dataset.angle=state.appliedAngle===1?"DEG":"RAD";
}
root.CalculatorLessonAdapter=Object.freeze({renderWatch});
})(globalThis);
