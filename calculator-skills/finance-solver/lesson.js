(function(){"use strict";
const M=window.CT05,$=id=>document.getElementById(id),stage=$("stage"),screen=$("screen");
const params=new URLSearchParams(location.search),request=M.request(params);
let mode="watch",s=M.start(),light=0,stamp=-1,returnToWatch;
const handheld=$("handheld-host");
const shell=CalculatorLessonHandset.mount(handheld,{screen:$("lcd"),interactive:false,label:"TI-Nspire CX II-T Calculator",onKey:k=>{physical(k);stage.focus({preventScroll:true});}});
const pretty=v=>String(v).replace(/-/g,"−");
const num=(n,opt={})=>new Intl.NumberFormat("en-GB",{maximumFractionDigits:6,...opt}).format(n);
const currency=n=>num(n,{minimumFractionDigits:2,maximumFractionDigits:2});
const elt=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
function label(text,action,active,watch,cls){
 const b=elt("button",text,cls);b.type="button";
 if(active)b.classList.add("calc-active");
 if(watch)b.disabled=true;else if(action)b.addEventListener("click",action);
 return b;
}
function solver(snapshot,watch){
 const dialog=elt("section",undefined,"solver");dialog.setAttribute("aria-label","Finance Solver");
 dialog.append(elt("strong","Finance Solver","solver-title"));
 const fields=elt("div",undefined,"solver-fields");
 M.fieldNames.forEach((name,i)=>{
  const row=elt("div",undefined,"solver-row");row.classList.toggle("wide",i===4&&!!snapshot.result);row.dataset.field=name;
  const value=i===4&&snapshot.result;
  let formatted=pretty(snapshot.values[i]);
  if(value)formatted=pretty(Number(value.value.toPrecision(9)).toString());
  row.append(elt("span",name+":"));
  const field=label(formatted||" ",()=>{s=M.chooseField(s,i);render(s,false);stage.focus({preventScroll:true});},i===snapshot.field,watch,"field-value");
  field.setAttribute("aria-label",name+": "+(value?pretty(value.value):snapshot.values[i]||"empty"));
  if(value){
   const short=pretty(value.value.toPrecision(6)).replace(/e\+/,"E").replace(/e-/,"E−");
   field.dataset.result=String(value.value);field.dataset.compact=short;field.dataset.label=formatted;
  }
  row.append(field);fields.append(row);
 });
 dialog.append(fields);
 const foot=elt("div",snapshot.result?"Finance Solver info stored":(snapshot.field===4?"Press ENTER to calculate":"↳ "+M.help[snapshot.field]),"solver-help");
 dialog.append(foot);
 return dialog;
}
function menu(snapshot,watch){
 const isMain=snapshot.page==="menu",block=elt("div",undefined,"lcd-modal");
 const entries=isMain?M.menu0:M.menu1,title=isMain?"Calculator menu":"Finance";
 block.setAttribute("aria-label",title);block.append(elt("strong",title,"menu-title"));
 entries.forEach(([id,name],i)=>block.append(label(id+": "+name+(id===8?" ▸":""),()=>{physical(String(id));stage.focus({preventScroll:true});},snapshot.menuIndex===i,watch,"menu-item"+(id===8?" wanted":""))));
 return block;
}
function render(snapshot,watch){
 screen.dataset.lcd=snapshot.page;screen.replaceChildren();
 if(snapshot.page==="solver")screen.append(solver(snapshot,watch));
 else{
  const line=elt("div",undefined,"calc-input");line.append(elt("i",undefined,"cursor"));screen.append(line);
  if(["menu","finance"].includes(snapshot.page))screen.append(menu(snapshot,watch));
 }
 if(snapshot.error)screen.append(elt("div",snapshot.error.split(". ")[0].replace(/\.$/,""),"lcd-error"));
 if(!watch){
  const hints={
   calc:"Open Menu, then choose Finance → Finance Solver.",
   menu:"Choose 8: Finance.",finance:"Choose 1: Finance Solver.",
   solver:"Set the known fields, then highlight FV and press Enter."
  };
  $("hint").textContent=hints[snapshot.page];
  const error=snapshot.error||request.error;$("error").textContent=error;$("error").hidden=!error;
  const p=$("progress");let feedback="";
  if(snapshot.result){
   if(M.match(snapshot.result,request.target))feedback="Correct setup. The balance is "+currency(snapshot.result.value)+" to two decimal places.";
   else if(snapshot.result.PV>0)feedback="A deposit leaves you now. Use a negative PV to find the positive amount you receive later.";
   else feedback="The solver used your inputs. Check the deposit, annual rate, compounding frequency and time in the task.";
  }
  p.textContent=feedback;p.hidden=!feedback;
 }
}
function physical(key){
 if(mode!=="try")return;
 clearTimeout(light);shell.setKeys([key==="backtab"?"tab":key]);
 light=setTimeout(()=>shell.setKeys([]),175);
 s=M.choose(s,key);render(s,false);
}
function taskMode(){
 const d=request.target, names={1:"annually",2:"semiannually",4:"quarterly",12:"monthly",365:"daily"};
 const freq=names[d.frequency]||d.frequency+" times a year";
 const y=d.years===1?"1 year":num(d.years)+" years";
 $("task").textContent="Deposit "+num(d.deposit)+" for "+y+" at "+num(d.rate)+"% nominal, compounded "+freq+". No later payments. Find FV.";
}
const tape=M.tape.map(x=>x[1]),frames=[M.start()];
for(const k of tape)frames.push(M.choose(frames.at(-1),k));
function renderWatch(device,{beat,point,crossed,key}){
 if(handheld.parentElement!==device)device.append(handheld);
 const n=crossed.length,lit=n&&!point.speaking&&key?.beat===beat&&(point.fraction-key.at)*(point.span.end-point.span.voiceEnd)<.62;
 shell.setKeys(lit?[tape[n-1]]:[]);
 if(stamp===n)return;stamp=n;render(frames[n],true);
}
function enterTry(device,actions){
 mode="try";returnToWatch=actions.returnToWatch;device.prepend(stage);$("try-deck").prepend(handheld);stage.hidden=false;
 shell.setKeys([]);shell.setInteractive(true);taskMode();render(s,false);stage.focus({preventScroll:true});
}
function exitTry(){
 mode="watch";stage.hidden=true;stamp=-1;clearTimeout(light);shell.setKeys([]);shell.setInteractive(false);
}
$("return").onclick=()=>returnToWatch?.();
$("reset").onclick=()=>{s=M.start();taskMode();render(s,false);stage.focus({preventScroll:true});};
document.addEventListener("keydown",e=>{
 if(e.defaultPrevented||e.target.closest?.(".top, .tabbar"))return;
 if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing||e.target.closest("input,select,a,summary,textarea,[contenteditable]"))return;
 const b=e.target.closest("button");
 if(mode!=="try")return;
 if((!stage.contains(e.target)&&e.target!==document.body)||(b&&["Enter"," ","Tab"].includes(e.key)))return;
 const map={m:"menu",M:"menu",Escape:"esc",Enter:"enter",ArrowDown:"down",ArrowUp:"up",ArrowLeft:"left",ArrowRight:"right",Backspace:"del",Delete:"del",b:"b",e:"e","-":"neg",".":"dot"};
 let key=map[e.key]||(/^\d$/.test(e.key)?e.key:"");
 if(e.key==="Tab"&&s.page==="solver")key=e.shiftKey?"backtab":"tab";
 if(key){e.preventDefault();if(e.target===document.body)stage.focus({preventScroll:true});physical(key);}
});
window.CalculatorLessonAdapter=Object.freeze({initialMode:params.get("mode")==="try"||request.linked?"try":"watch",renderWatch,enterTry,exitTry});
})();
