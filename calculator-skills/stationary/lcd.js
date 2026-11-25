(function(g){'use strict';
const M=g.CT52Math,E=g.CT52Editor;
const X={l:12,r:308},Y={t:33,b:223};
function screen(display){
 const off=document.createElement("canvas");off.width=640;off.height=480;
 const c=off.getContext("2d",{alpha:false});c.scale(2,2);
 const rect=(x,y,w,h,f)=>{c.fillStyle=f;c.fillRect(x,y,w,h);};
 const line=(a,b,x,y,col="#657483",w=.8)=>{c.beginPath();c.strokeStyle=col;c.lineWidth=w;c.moveTo(a,b);c.lineTo(x,y);c.stroke();};
 function txt(t,x,y,fs=12,col="#1a2b40",bold=false,align="left"){
  c.fillStyle=col;c.font=(bold?"bold ":"")+fs+"px Arial,sans-serif";c.textBaseline="alphabetic";c.textAlign=align;c.fillText(t,x,y);
 }
 const circ=(x,y,fill,col,r=3.5)=>{c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=fill;c.fill();c.strokeStyle=col;c.lineWidth=1.75;c.stroke();};
 function tick(a,b,target=7){const raw=(b-a)/target, power=10**Math.floor(Math.log10(raw)),z=raw/power;return (z<=1?1:z<=2?2:z<=5?5:10)*power;}
 function grid(w){
  const px=x=>X.l+(x-w.x0)/(w.x1-w.x0)*(X.r-X.l),py=y=>Y.b-(y-w.y0)/(w.y1-w.y0)*(Y.b-Y.t);
  const ax=py(0),ay=px(0),dx=tick(w.x0,w.x1),dy=tick(w.y0,w.y1,6);
  c.save();c.beginPath();c.rect(X.l,Y.t,X.r-X.l,Y.b-Y.t);c.clip();
  for(let j=Math.ceil(w.x0/dx);j<=Math.floor(w.x1/dx);j++){
   const x=px(j*dx);if(x<X.l+4||x>X.r-4||j===0)continue;
   line(x,Y.t,x,Y.b,"#e9eef3",.55);line(x,ax-2,x,ax+2,"#3e4853",.9);
   if(ax<Y.b-10)txt(M.pretty(j*dx),x,ax+12,9,"#425064",false,"center");
  }
  for(let j=Math.ceil(w.y0/dy);j<=Math.floor(w.y1/dy);j++){
   const y=py(j*dy);if(y<Y.t+6||y>Y.b-8||j===0)continue;
   line(X.l,y,X.r,y,"#e9eef3",.55);line(ay-2,y,ay+2,y,"#3e4853",.9);
   if(ay>X.l+15)txt(M.pretty(j*dy),ay-5,y+3,9,"#425064",false,"right");
  }
  line(X.l,ax,X.r,ax,"#3e4853",1);line(ay,Y.t,ay,Y.b,"#3e4853",1);
  txt("x",X.r-10,ax-5,10);txt("y",ay+5,Y.t+11,10);
  c.restore();return {px,py};
 }
 const colors=["#1955a0","#a72b24"];
 function drawGraph(s,w){
  const {px,py}=grid(w);
  if(!s.q)return;
  const base=s.q.f,both=s.both?[base,x=>M.dx(s.q,x)]:[base];
  c.save();c.beginPath();c.rect(X.l,Y.t,X.r-X.l,Y.b-Y.t);c.clip();
  both.forEach((f,i)=>{
   c.beginPath();c.strokeStyle=colors[i];c.lineWidth=s.page==="curve"&&s.curve===i+1?3.2:2;
   for(let j=0;j<=200;j++){const x=w.x0+(w.x1-w.x0)*j/200,y=py(f(x));if(j===0)c.moveTo(px(x),y);else c.lineTo(px(x),y);}
   c.stroke();
  });
  if(s.page==="upper"&&s.low!==null&&s.cursor>s.low){
   rect(px(s.low),Y.t,px(s.cursor)-px(s.low),Y.b-Y.t,"#93bfd535");
  }
  if(s.page==="lower"||s.page==="upper"){
   const p=s.buf?M.readX(s.buf):s.cursor;
   c.setLineDash([3,3]);if(s.low!==null)line(px(s.low),Y.t,px(s.low),Y.b,"#49677e",1.1);
   if(p!==null)line(px(p),Y.t,px(p),Y.b,"#263b50",1.1);c.setLineDash([]);
  }
  for(const x of s.marks){circ(px(x),py(0),"#fff",colors[1],4);txt(M.pretty(x),px(x),py(0)-10,12,colors[1],true,"center");}
  if(s.probe) circ(px(s.probe.x),py(s.probe.y),"#fff",colors[0],4);
  c.restore();
  if(s.both)txt("f₂(x)",264,31,11,colors[1],true,"right");
  txt("f₁(x)",306,31,11,colors[0],true,"right");
 }
 function popup(x,y,w,h,title){
  rect(x+2,y+3,w,h,"#14263855");rect(x,y,w,h,"#233c59");rect(x+1,y+1,w-2,h-2,"#f4f8fa");
  rect(x+1,y+1,w-2,20,"#d0e3f6");txt(title,x+7,y+15,12,"#193552",true);
 }
 const panels={main:{x:8,y:29,w:127,h:14,rows:E.menu},sub:{x:136,y:98,w:162,h:14,rows:E.sub}};
 function panel(p,at,selected){
  rect(p.x,p.y,p.w,p.rows.length*p.h+3,"#274056");rect(p.x+1,p.y+1,p.w-2,p.rows.length*p.h+1,"#f9fbfc");
  p.rows.forEach((t,i)=>{const y=p.y+1+i*p.h,on=i===at;if(on)rect(p.x+1,y,p.w-2,p.h,selected?"#246db3":"#c7def1");
   txt(t,p.x+5,y+10.5,on?11:10,on&&selected?"#fff":"#21384f",on);
  });
 }
 function draw(s){
  const w=M.window(s.q,s.both);
  const bar=c.createLinearGradient(0,0,0,20);bar.addColorStop(0,"#283844");bar.addColorStop(1,"#14202b");
  rect(0,0,320,240,"#fff");rect(0,0,320,20,bar);
  rect(4,4,24,14,"#d4e5f1");txt("1.1",9,15,10,"#162c49",true);txt("RAD",277,15,8,"#f2f7f9",true);
  rect(302,7,12,6,"#a0d65f");line(0,19,320,19,"#28a1b9",1);
  drawGraph(s,w);
  if(s.page==="f1"||s.page==="f2"||s.page==="templates"){
   rect(0,20,320,24,"#eff5fa");
   const text=s.page==="f1"?"f₁(x) = "+M.displayExpr(s.raw):"f₂(x) = ";
   txt(text.length>38?text.slice(0,37)+"…":text,8,36,14,"#253b56",true);
  }
  if(s.page==="templates"){
   popup(24,53,268,71,"Math Templates");
   ["□/□","√□","∑","∫","d/dx","{⋮"].forEach((a,i)=>{const x=31+i*42,y=82;rect(x,y,39,27,i===s.select?"#246db3":"#e5eef7");
    txt(a,x+19.5,y+19,i===4?14:13,i===s.select?"#fff":"#294460",i===4,"center");});
  }
  if(s.page==="diff"){
   rect(0,20,320,54,"#eff5fa");line(0,74,320,74,"#b2c5d7");
   txt("f₂(x) =",8,52,15,"#263c55",true);
   txt("d",84,40,14,"#263c55",true);line(71,45,116,45,"#27435d",1.1);
   txt("d",74,63,14,"#263c55",true);rect(85,49,26,18,s.field===0?"#c8e1f6":"#fff");
   txt(s.var||"□",89,63,14,"#27547b",true);
   rect(127,33,132,25,s.field===1?"#c8e1f6":"#fff");txt(s.arg||"□",135,50,14,"#25476a",true);
  }
  if(s.page==="menu"||s.page==="sub"){panel(panels.main,s.page==="sub"?5:s.select,s.page==="menu");if(s.page==="sub")panel(panels.sub,s.select,true);}
  if(s.page==="curve"){
   rect(6,189,134,23,"#e9f1f6");txt("graph?  f"+(s.curve===2?"₂":"₁"),13,205,14,colors[s.curve-1],true);
  }
  if(s.page==="lower"||s.page==="upper"){
   rect(5,216,204,22,"#e9f1f6");
   txt((s.page==="lower"?"lower bound? ":"upper bound? ")+(s.buf||M.pretty(s.cursor)),10,232,13,"#2d526e",true);
  }
  if(s.error){rect(4,215,312,23,"#fbe6de");txt("Check the selection or bounds",11,231,12,"#773421",true);}
  display.getContext("2d",{alpha:false}).drawImage(off,0,0);
 }
 return {draw};
}
const fromPixel=(w,x)=>w.x0+(x-X.l)/(X.r-X.l)*(w.x1-w.x0);
g.CT52Screen=Object.freeze({screen,fromPixel,X,Y});
})(window);
