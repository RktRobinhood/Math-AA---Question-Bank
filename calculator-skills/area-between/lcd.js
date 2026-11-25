(function(global){'use strict';

const {displayExpr,windowFor,pretty,clamp}=global.CT55Math;
const W=320,H=240;
const GRAPHMENU=['1: Actions','2: View','3: Graph Entry/Edit','4: Window/Zoom','5: Trace','6: Analyze Graph','7: Table','8: Geometry','9: Settings'];
const ANALYZE=['1: Zero','2: Minimum','3: Maximum','4: Intersection','5: dy/dx','6: Integral','7: Bounded Area','8: Analyze Conics'];
const PANEL={main:{x:8,y:24,w:119,h:15,rows:GRAPHMENU,active:0},sub:{x:128,y:99,w:111,h:15,rows:ANALYZE,active:6}};
const SCREEN_X={l:10,r:310};
const pointAt=(data,p)=>{const r=windowFor(data.curves,data.preset,data.low,data.high);return r.x0+(p-SCREEN_X.l)/(SCREEN_X.r-SCREEN_X.l)*(r.x1-r.x0)};

function screen(display){
  const off=document.createElement('canvas');off.width=640;off.height=480;
  const c=off.getContext('2d',{alpha:false});c.scale(2,2);
  const rect=(x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h)};
  function line(x,y,x2,y2,color='#272a2d',width=.7,dash=[]){
    c.beginPath();c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=width;c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);
  }
  function txt(t,x,y,color='#171d24',size=10,weight='normal',align='left'){
    c.fillStyle=color;c.font=weight+' '+size+'px Arial, sans-serif';c.textAlign=align;c.textBaseline='alphabetic';c.fillText(t,x,y);
  }
  function dot(x,y,fill='#1363b6',rad=2.2){c.beginPath();c.arc(x,y,rad,0,Math.PI*2);c.fillStyle=fill;c.fill()}
  function panel(p,dim=false){
    let {x,y,w,rows,active,h}=p;
    rect(x+2,y+2,w,rows.length*h+4,'#0003');rect(x,y,w,rows.length*h+4,'#0d213b');rect(x+1,y+1,w-2,rows.length*h+2,'#f7f7f7');
    for(let i=0;i<rows.length;i++){
      const a=i===active;const ry=y+2+i*h;
      if(a)rect(x+1,ry,w-2,h,dim?'#b4cbe2':'#2568ad');
      txt(rows[i],x+5,ry+10,a&&!dim?'#fff':'#151b22',9.6,a?'bold':'normal');
      if(w===PANEL.main.w)txt('›',x+w-8,ry+10,a&&!dim?'#fff':'#383d45',11);
    }
  }
  function ticks(a,b,intent=6){
    const raw=(b-a)/intent,d=10**Math.floor(Math.log10(raw)),p=raw/d;
    const step=(p<1.6?1:p<3.5?2:p<7.5?5:10)*d;
    if(!Number.isFinite(step)||step<=0)return [];
    const vs=[];for(let i=Math.ceil(a/step);i<=Math.floor(b/step)&&vs.length<22;i++)vs.push(i*step);
    return vs;
  }
  function draw(data){
    const {state,curves,raw,slot,low,high,cursor,error,regions,markCross,preset,menuIndex,subIndex,draft}=data;
    rect(0,0,W,H,'#fff');
    // TI-style document bar with page tab, angle mode and battery indicator.
    const bar=c.createLinearGradient(0,0,0,21);bar.addColorStop(0,'#24313a');bar.addColorStop(.68,'#19232c');bar.addColorStop(1,'#101820');rect(0,0,W,20,bar);
    rect(3,4,25,15,'#eef5fa');rect(4,5,23,13,'#d4e5f0');txt('1.1',9,15,'#0b223a',10,'bold');txt('RAD',276,14,'#e3eff2',8,'bold');
    rect(303,7,12,7,'#254057');rect(304,8,10,5,'#9dd55e');rect(315,9,2,3,'#254057');
    line(0,19,320,19,'#349eb1',1);
    const pf=windowFor(curves,preset,low,high), left=SCREEN_X.l,right=SCREEN_X.r,top=26,bottom=226;
    const ux=x=>left+(x-pf.x0)/(pf.x1-pf.x0)*(right-left);
    const uy=y=>bottom-(y-pf.y0)/(pf.y1-pf.y0)*(bottom-top);
    const zeroY=pf.y0<=0&&pf.y1>=0,zeroX=pf.x0<=0&&pf.x1>=0;
    const xaxis=zeroY?uy(0):bottom-11,yaxis=zeroX?ux(0):left+19;
    c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();
    const hasLow=Number.isFinite(low),hasHigh=Number.isFinite(high);
    for(const p of regions){
      c.beginPath();
      const count=Math.max(16,Math.ceil((ux(p.right)-ux(p.left))*1.35));
      for(let i=0;i<=count;i++){const x=p.left+(p.right-p.left)*i/count,y=clamp(uy(curves[0].f(x)),-4000,4000);if(i===0)c.moveTo(ux(x),y);else c.lineTo(ux(x),y);}
      for(let i=count;i>=0;i--){const x=p.left+(p.right-p.left)*i/count;c.lineTo(ux(x),clamp(uy(curves[1].f(x)),-4000,4000));}
      c.closePath();c.fillStyle='#a5bbd880';c.fill();
    }
    line(left,xaxis,right-1,xaxis,zeroY?'#54585e':'#a4abb0',zeroY?.8:.5);line(yaxis,bottom,yaxis,top+1,zeroX?'#54585e':'#a4abb0',zeroX?.8:.5);
    if(zeroY){line(right-5,xaxis-2.5,right-1,xaxis,'#54585e',.8);line(right-5,xaxis+2.5,right-1,xaxis,'#54585e',.8)}
    if(zeroX){line(yaxis-2.5,top+6,yaxis,top+1,'#54585e',.8);line(yaxis+2.5,top+6,yaxis,top+1,'#54585e',.8)}
    for(const t of ticks(pf.x0,pf.x1,9)){
      let x=ux(t);if((zeroX&&Math.abs(x-yaxis)<8)||x<left+6||x>right-11)continue;
      line(x,xaxis-2,x,xaxis+2,'#55595e',.75);txt(pretty(t),x,xaxis>bottom-12?xaxis-5:xaxis+10,'#444b55',7.5,'normal','center')
    }
    for(const t of ticks(pf.y0,pf.y1,8)){
      let y=uy(t);if(Math.abs(y-xaxis)<9||y<top+8||y>bottom-2)continue;
      line(yaxis-2,y,yaxis+2,y,'#55595e',.75);txt(pretty(t),yaxis-4,y+2.5,'#444b55',7.5,'normal','right')
    }
    if(zeroY)txt('x',right-9,xaxis-6,'#333941',9);if(zeroX)txt('y',yaxis+5,top+9,'#333941',9);
    const colors=['#1955ac','#9b3b36'];
    curves.forEach((curve,i)=>{
      if(!curve)return;
      c.beginPath();c.lineWidth=1.45;c.strokeStyle=colors[i];
      for(let px=left;px<=right;px++){
        const v=pf.x0+(px-left)/(right-left)*(pf.x1-pf.x0), y=clamp(uy(curve.f(v)),-4000,4000);
        if(px===left)c.moveTo(px,y);else c.lineTo(px,y);
      }
      c.stroke();
      if(['plotted','entry'].includes(state))txt('f'+(i?'₂':'₁')+'(x)='+displayExpr(curve.raw),right-4,top+12+i*12,colors[i],10,'bold','right');
    });
    if(markCross&&curves[0]){
      const x=ux(2),y=uy(curves[0].f(2));
      dot(x,y,'#202c39',2.9);line(x,y+4,x,xaxis,'#6c7382',.8,[2,2]);
      rect(x+5,y+4,30,13,'#ffffffdc');txt('x = 2',x+7,y+14,'#23313f',10,'bold');
    }
    if(hasLow)line(ux(low),top,ux(low),bottom,'#5a8053',1,[2,2]);
    if(hasHigh&&state==='result')line(ux(high),top,ux(high),bottom,'#5a8053',1,[2,2]);
    if(curves.length===2&&(state==='lower'||state==='upper')&&Number.isFinite(cursor)){
      const x=ux(cursor),y=clamp((uy(curves[0].f(cursor))+uy(curves[1].f(cursor)))/2,top+7,bottom-5);
      line(x,top,x,bottom,'#5a8053',1,[2,2]);line(x-4,y,x+4,y,'#192527',1);line(x,y-4,x,y+4,'#192527',1);
    }
    if(state!=='menu'&&state!=='submenu')regions.forEach((p,i)=>{
      const read=pretty(p.area),x=(p.left+p.right)/2, center=ux(x);
      const yp=clamp(i%2===0?uy(Math.max(curves[0].f(x),curves[1].f(x)))-5:uy(Math.min(curves[0].f(x),curves[1].f(x)))+14,top+20,bottom-8);
      const w=Math.max(24,8*read.length+8),xp=clamp(center,left+w/2,right-w/2);
      rect(xp-w/2,yp-12,w,15,'#f7f9fbe9');txt(read,xp,yp,'#183148',12,'bold','center');
    });
    c.restore();
    if(state==='entry'){
      rect(0,20,320,24,'#e5ebf0');line(0,44,320,44,'#8298ab',.6);
      txt('f'+(slot?'₂':'₁')+'(x)='+displayExpr(raw[slot]),5,36,'#111a24',13,'bold');
    }
    if(['lower','upper','result'].includes(state)){
      rect(5,25,23,18,'#eaedf0');line(5,43,28,43,'#85909b',.6);
      line(9,39,24,34,'#305d93',1);line(9,29,24,33,'#963f34',1);
    }
    if(state==='lower'||state==='upper'||error){
      let label=error?(state==='entry'?'check function':'check bounds'):(state==='lower'?'lower bound?':'upper bound?')+(draft?' '+draft:'');
      rect(6,214,draft?136:96,15,'#e6e6e6');rect(6,214,draft?136:96,1,'#aeb1b3');
      txt(label,10,224,'#22262b',9);
    }
    if(state==='menu'||state==='submenu')panel({...PANEL.main,active:state==='submenu'?5:menuIndex},state==='submenu');
    if(state==='submenu')panel({...PANEL.sub,active:subIndex});
    display.getContext('2d',{alpha:false}).drawImage(off,0,0);
  }
  return {draw};
}

global.CT55Screen=Object.freeze({screen,pointAt,PANEL,SCREEN_X});
})(globalThis);
