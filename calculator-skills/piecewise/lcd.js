(function(g){'use strict';
const M=g.CT15Math,E=g.CT15Editor;
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
 function drawGraph(model,w,marked,probe){
  const {px,py}=grid(w), blue="#1959a4", endpoint=[];
  if(!model)return;
  c.save();c.beginPath();c.rect(X.l,Y.t,X.r-X.l,Y.b-Y.t);c.clip();
  model.forEach(part=>{
   const a=Math.max(part.lo,w.x0),b=Math.min(part.hi,w.x1);
   if(a<b){
    c.beginPath();c.strokeStyle=blue;c.lineWidth=2.05;
    for(let n=0;n<=150;n++){
     const x=a+(b-a)*n/150,xx=px(x),yy=py(part.expr.f(x));if(n===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    }
    c.stroke();
   }
   if(marked)for(const [x,included] of [[part.lo,part.lc],[part.hi,part.hc]])if(Number.isFinite(x))endpoint.push([x,part.expr.f(x),included]);
  });
  endpoint.sort((a,b)=>Number(a[2])-Number(b[2])).forEach(([x,y,closed])=>circ(px(x),py(y),closed?blue:"#fff",blue,4.1));
  if(probe&&probe.inside){
   const x=px(probe.x),y=py(probe.y);line(x-7,y,x+7,y,"#28334a",1);line(x,y-7,x,y+7,"#28334a",1);
   circ(x,y,"#e8f0ff","#31295d",2.1);
  }
  c.restore();txt("f₁(x)",X.r-5,Y.t-5,10,blue,true,"right");
 }
 function editor(s){
  rect(0,20,320,111,"#f0f5fa");line(0,130,320,130,"#9baece",.9);
  txt("f₁(x) =",8,49,15,"#172638",true);
  txt("{",58,93,55,"#273e61",true);
  const display=(raw,i)=>i%2?M.displayCond(raw):M.displayExpr(raw);
  for(let i=0;i<4;i++){
   const x=i%2?173:85,y=i>1?77:43,w=i%2?135:74,a=i===s.slot;
   rect(x,y,w,26,a?"#d9e9fa":"#fff");rect(x,y,w,1,a?"#2465a8":"#a6b6c6");
   const raw=s.slots[i],src=display(raw,i),n=src.length>i%2*4+12?Math.max(0,src.length-(i%2?23:13)):0;
   c.save();c.beginPath();c.rect(x+2,y+1,w-3,24);c.clip();
   const from=(n?"…":"")+src.slice(n);
   txt(raw?from:"□",x+5,y+18,13,a?"#163a5b":"#283849",a);
   if(a){
    c.font="bold 13px Arial, sans-serif";
    const width=c.measureText((n?"…":"")+display(raw.slice(0,s.caret),i).slice(n)).width;
    if(s.caret>=n)line(x+5+width,y+5,x+5+width,y+21,"#245e9d",1.2);
   }
   c.restore();
  }
 }
 function popup(x,y,w,h,title){
  rect(x+2,y+3,w,h,"#14263855");rect(x,y,w,h,"#233c59");rect(x+1,y+1,w-2,h-2,"#f4f8fa");
  rect(x+1,y+1,w-2,20,"#d0e3f6");txt(title,x+7,y+15,12,"#193552",true);
 }
 function draw(s,options={}){
  const bar=c.createLinearGradient(0,0,0,20);bar.addColorStop(0,"#283844");bar.addColorStop(1,"#14202b");
  rect(0,0,320,240,"#fff");rect(0,0,320,20,bar);
  rect(4,4,24,14,"#d4e5f1");txt("1.1",9,15,10,"#162c49",true);txt("RAD",277,15,8,"#f2f7f9",true);
  rect(302,7,12,6,"#a0d65f");line(0,19,320,19,"#28a1b9",1);
  drawGraph(s.page==="plotted"?s.model:null,M.windowFor(s.page==="plotted"?s.model:null),options.marked,s.probe);
  if(s.page==="blank"||["templates","count"].includes(s.page)){
   rect(0,20,320,22,"#e6f0fa");txt("f₁(x) = ",8,36,14,"#263745",true);line(62,24,62,37,"#255789",1);
  }
  if(s.page==="editor"||s.page==="relation")editor(s);
  if(s.page==="templates"){
   popup(10,45,300,77,"Math Templates");
   ["□/□","√□","□ⁿ","ⁿ√□","∑","∫","{□","{⋮"].forEach((t,i)=>{
    const a=14+i*36.5,active=i===s.selection;
    rect(a,72,35,30,active?"#226eb5":"#e5edf6");txt(t,a+17.5,92,15,active?"#fff":"#253f61",true,"center");
   });
   txt(s.selection===7?"n-piece piecewise function":"Move to the n-piece template",16,115,10,"#375575",true);
  }
  if(s.page==="count"){
   popup(41,57,238,98,"Create Piecewise Function");
   txt("Number of function pieces:",50,103,12);
   rect(217,87,47,22,"#2a6baa");txt(s.count||"□",241,103,14,"#fff",true,"center");
   rect(206,121,58,21,"#d9e7f2");txt("OK",235,136,12,"#193651",true,"center");
  }
  if(s.page==="relation"){
   popup(73,134,175,56,"Inequality symbols");
   E.opts.forEach((val,i)=>{const x=78+i*27.5,a=i===s.relation;rect(x,158,26,26,a?"#2672b3":"#e7eff7");txt(val,x+13,177,17,a?"#fff":"#213b59",true,"center");});
  }
  if(s.error){rect(0,217,320,23,"#f9e2d8");txt("Check the entry",9,232,12,"#742e1a",true);}
  display.getContext("2d",{alpha:false}).drawImage(off,0,0);
 }
 return {draw};
}
const fromPixel=(w,x)=>w.x0+(x-X.l)/(X.r-X.l)*(w.x1-w.x0);
g.CT15Screen=Object.freeze({screen,fromPixel,X,Y});
})(window);
