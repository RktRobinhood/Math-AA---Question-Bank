(function(root){"use strict";
const M=root.CT30Math,W=320,H=240;
const PANEL={
 main:{x:7,y:25,w:105,h:17,rows:["1: Plot Type","2: Plot Properties","3: Actions","4: Analyze","5: Window/Zoom","6: Hints"]},
 type:{x:113,y:25,w:137,h:17,rows:["1: Dot Plot","2: Box Plot","3: Histogram","4: Normal Probability Plot","5: Scatter Plot","6: X-Y Line Plot","7: Dot Chart","8: Bar Chart","9: Pie Chart"]},
 props:{x:113,y:43,w:200,h:21}
};
const propName=s=>s.plot==="standard"?"Show Box Plot Outliers":"Extend Box Plot Whiskers";
function formatMark(k,value){
 const name={q1:"Q1",median:"Median",q3:"Q3",left:"Left whisker",right:"Right whisker"}[k]||(k?.startsWith("out")?"Outlier":"");
 return name?name+" = "+M.text(value):"";
}
function projection(q){
 const delta=q.max-q.min||Math.max(1,Math.abs(q.max)*.08),lo=q.min-.16*delta,hi=q.max+.16*delta;
 return {lo,hi,x:v=>22+(v-lo)*276/(hi-lo)};
}
function details(s){
 const q=s.summary;if(s.plot==="dot")return [];
 const {x}=projection(q),l=s.plot==="modified"?q.left:q.min,r=s.plot==="modified"?q.right:q.max,mark=(id,n,y=111)=>({id,n,x:x(n),y});
 return [mark("left",l),mark("q1",q.q1),mark("median",q.median),mark("q3",q.q3),mark("right",r),
   ...(s.plot==="modified"?q.outliers.map((u,i,all)=>mark("out"+i,u,111-7*(i-all.indexOf(u)))):[])];
}
function pointFor(s){return details(s).find(x=>x.id===s.mark);}
function screen(display){
 const off=document.createElement("canvas");off.width=640;off.height=480;
 const c=off.getContext("2d",{alpha:false});c.scale(2,2);
 const rect=(x,y,w,h,v)=>{c.fillStyle=v;c.fillRect(x,y,w,h);};
 function line(x,y,X,Y,v="#253447",w=1){
  c.strokeStyle=v;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();
 }
 function text(t,x,y,{color="#222e38",size=11,weight="normal",align="left"}={}){
  c.font=weight+" "+size+"px Arial, sans-serif";c.fillStyle=color;c.textAlign=align;c.textBaseline="alphabetic";c.fillText(t,x,y);
 }
 function dot(x,y,r,color,edge=false){
  c.fillStyle=edge?"#fbfcff":color;c.strokeStyle=color;c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();if(edge)c.stroke();
 }
 function menu(p,index,items=p.rows){
  rect(p.x+2,p.y+2,p.w,items.length*p.h+4,"#14274255");
  rect(p.x,p.y,p.w,items.length*p.h+4,"#253647");
  rect(p.x+1,p.y+1,p.w-2,items.length*p.h+2,"#f8f9fa");
  items.forEach((val,i)=>{
   const y=p.y+2+i*p.h,selected=i===index;
   if(selected)rect(p.x+1,y,p.w-2,p.h,"#2368ac");
   text(val,p.x+4,y+p.h*.71,{color:selected?"white":"#17212d",size:p.h===21?11:10,weight:selected?"bold":"normal"});
   if(p===PANEL.main)text("›",p.x+p.w-8,y+p.h*.71,{color:selected?"white":"#17212d"});
  });
 }
 function axisTicks(lo,hi){
  const r=(hi-lo)/7,d=10**Math.floor(Math.log10(r)),w=r/d,z=(w<1.6?1:w<3.5?2:w<7.5?5:10)*d;
  const out=[];for(let i=Math.ceil(lo/z);i<=Math.floor(hi/z)&&out.length<12;i++)out.push(i*z);
  return out;
 }
 function draw(s){
  const {summary:q,plot}=s,{lo,hi,x}=projection(q);
  rect(0,0,W,H,"#fff");const upper=c.createLinearGradient(0,0,0,18);upper.addColorStop(0,"#24313a");upper.addColorStop(1,"#111a23");rect(0,0,320,20,upper);
  rect(4,4,24,15,"#d5e2ee");text("1.2",8,15,{color:"#193048",size:10,weight:"bold"});
  text("RAD",270,14,{color:"#e3eff2",size:8,weight:"bold"});rect(300,7,13,7,"#475c68");rect(301,8,11,5,"#9dd563");rect(313,9,2,3,"#475c68");line(0,19,320,19,"#56a0b3",1);
  const ground=171,blue="#185bb4";
  line(20,ground,300,ground,"#454e56",.8);
  axisTicks(lo,hi).forEach(v=>{line(x(v),ground-3,x(v),ground+3,"#60696f",.8);text(M.text(v),x(v),ground+15,{size:9,align:"center"});});
  text("reading",160,211,{size:13,align:"center"});
  if(plot==="dot"){
   const counts=new Map();for(const v of q.sorted)counts.set(v,(counts.get(v)||0)+1);
   for(const [v,n] of counts){const space=Math.min(10,Math.max(3,110/n));for(let i=0;i<n;i++)dot(x(v),154-i*space,3.1,blue);}
  }else{
   const l=plot==="modified"?q.left:q.min,r=plot==="modified"?q.right:q.max,y=111,a=x(q.q1),b=x(q.q3);
   rect(a,85,Math.max(1,b-a),52,"#deebf887");
   for(const [v,U] of [[a,x(l)],[b,x(r)]])line(v,y,U,y,blue,1.65);
   for(const v of [x(l),x(r)])line(v,y-11,v,y+11,blue,1.65);
   for(const v of [a,x(q.median),b])line(v,85,v,137,blue,1.65);
   for(const v of [85,137])line(a,v,b,v,blue,1.65);
   if(plot==="modified")for(const p of details(s).filter(p=>p.id.startsWith("out")))dot(p.x,Math.max(31,p.y),3.3,blue,true);
  }
  const qMark=pointFor(s);
  if(qMark&&!s.menu){
   const {id,n,x:x0}=qMark,y0=Math.max(31,qMark.y),read=formatMark(id,n);
   const tx=M.clamp(x0-12,10,304-(7*read.length+12)),ty=y0>76?y0-43:y0+22;
   dot(x0,y0,3.3,"#14497f");line(x0,y0,x0,ty+2,"#385c89",.65);
   rect(tx,ty-11,Math.max(54,7*read.length+8),16,"#edf2f7");
   text(read,tx+3,ty,{size:11,weight:"bold"});
  }
  if(s.menu==="main")menu(PANEL.main,s.selection);
  if(s.menu==="type"){menu(PANEL.main,0);menu(PANEL.type,s.selection);}
  if(s.menu==="props"){menu(PANEL.main,1);menu(PANEL.props,0,[propName(s)]);}
  display.getContext("2d",{alpha:false}).drawImage(off,0,0);
 }
 return {draw};
}
root.CT30Screen=Object.freeze({screen,PANEL,propName,details,pointFor,formatMark});
})(globalThis);
