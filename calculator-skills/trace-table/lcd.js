(function(global){'use strict';
const {displayExpr,windowFor,pretty,prettyX,clamp,evaluate}=global.CT09Math;
const W=320,H=240;
const graphRows=['1: Actions','2: View','3: Graph Entry/Edit','4: Window/Zoom','5: Trace','6: Analyze Graph','7: Table','8: Geometry','9: Settings…'];
const panel=(x,y,w,rows,active,expand=false)=>({x,y,w,h:15,rows,active,expand});
const PANELS={
 main:panel(8,24,121,graphRows,4,true),
 traceMenu:panel(8,24,121,graphRows,4,true),
 openMenu:panel(8,24,121,graphRows,6,true),
 trace:panel(130,83,151,['1: Graph Trace','2: Trace All','3: Trace Step'],0),
 open:panel(130,112,165,['1: Split-screen Table','2: Remove Table'],0),
 tableRoot:panel(155,24,155,['1: Actions','2: Table','3: Data','4: Statistics'],1,true),
 table:panel(42,51,169,['1: Remove Table','2: Delete Column','3: Choose…','4: Edit Expression','5: Edit Table Settings'],4),
};
const grid={top:44,rowHeight:22,visible:8,x:158};
const rowStart=(ask,row)=>ask?Math.max(0,row-6):Math.min(93,row<0?row:Math.max(0,row-6));
const SCREEN_X={l:9,r:310};
const pointAt=(w,p)=>w.x0+(p-SCREEN_X.l)/(SCREEN_X.r-SCREEN_X.l)*(w.x1-w.x0);
const screenY=(w,y)=>219-(y-w.y0)/(w.y1-w.y0)*185;
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
      txt(rows[i],x+5,ry+(a?11:10),a&&!dim?'#fff':'#151b22',a?12:9.6,a?'bold':'normal');
      if(p.expand)txt('›',x+w-8,ry+10,a&&!dim?'#fff':'#383d45',11);
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
    const {state,q,raw,buffer,cursor,ask,rows,row,dropdown,setting,pane}=data;
    const table=data.tableOpen||['table','tableRoot','tableMenu','settings'].includes(state);
    const trace=state==='trace';
    const body=c.createLinearGradient(0,0,0,21);body.addColorStop(0,'#24313a');body.addColorStop(1,'#101820');
    rect(0,0,W,H,'#fff');rect(0,0,W,20,body);
    rect(3,4,25,15,'#eef5fa');rect(4,5,23,13,'#d4e5f0');txt('1.1',9,15,'#0b223a',10,'bold');txt('RAD',276,14,'#edf5f6',8,'bold');
    rect(303,7,12,7,'#254057');rect(304,8,10,5,'#9dd55e');rect(315,9,2,3,'#254057');
    line(0,19,320,19,'#349eb1',1);
    const pf=data.w||windowFor(q), left=SCREEN_X.l,right=table?150:SCREEN_X.r,top=34,bottom=219;
    const ux=x=>left+(x-pf.x0)/(pf.x1-pf.x0)*(right-left);
    const uy=y=>screenY(pf,y);
    const zeroY=pf.y0<=0&&pf.y1>=0,zeroX=pf.x0<=0&&pf.x1>=0;
    const ax=zeroY?uy(0):bottom-8,ay=zeroX?ux(0):left+13;
    c.save();c.beginPath();c.rect(left,top,right-left,bottom-top+1);c.clip();
    line(left,ax,right-1,ax,zeroY?'#54585e':'#a4abb0',zeroY?.8:.5);line(ay,bottom,ay,top+1,zeroX?'#54585e':'#a4abb0',zeroX?.8:.5);
    if(zeroY){line(right-5,ax-2.5,right-1,ax,'#54585e',.8);line(right-5,ax+2.5,right-1,ax,'#54585e',.8)}
    if(zeroX){line(ay-2.5,top+6,ay,top+1,'#54585e',.8);line(ay+2.5,top+6,ay,top+1,'#54585e',.8)}
    const density=table?5:8;
    for(const t of ticks(pf.x0,pf.x1,density)){let x=ux(t);if((zeroX&&Math.abs(x-ay)<8)||x<left+6||x>right-11)continue;line(x,ax-2,x,ax+2,'#55595e',.75);txt(pretty(t),x,ax>bottom-12?ax-5:ax+10,'#444b55',7.5,'normal','center')}
    for(const t of ticks(pf.y0,pf.y1,6)){let y=uy(t);if(Math.abs(y-ax)<9||y<top+8||y>bottom-2)continue;line(ay-2,y,ay+2,y,'#55595e',.75);txt(pretty(t),ay-4,y+2.5,'#444b55',7.5,'normal','right')}
    if(zeroY)txt('x',right-9,ax-6,'#333941',9);if(zeroX)txt('y',ay+5,top+9,'#333941',9);
    if(q){
      c.beginPath();c.lineWidth=1.65;c.strokeStyle='#1c55b4';
      for(let px=left;px<=right;px++){const x=pf.x0+(px-left)/(right-left)*(pf.x1-pf.x0),y=clamp(uy(q.f(x)),-4000,4000);if(px===left)c.moveTo(px,y);else c.lineTo(px,y);}
      c.stroke();
    }
    const v=trace&&evaluate(q,cursor);
    if(v){
      const x=ux(v.x),y=uy(v.y);
      if(y>=top&&y<=bottom){
        const r=4.2;
        dot(x,y,'#1a3657',2.5);line(x-r,y,x+r,y,'#172638',1.5);line(x,y-r,x,y+r,'#172638',1.5);
      }
    }
    c.restore();
    if(q){
      const formula='f₁(x)='+displayExpr(q.raw),limit=table?18:42;
      txt(formula.length>limit?formula.slice(0,limit-1)+'…':formula,right-4,31,'#174d99',table?9:11.5,'normal','right');
    }
    if(state==='entry'){
      rect(0,20,320,24,'#e5ebf0');line(0,44,320,44,'#8298ab',.6);
      const s=displayExpr(raw);txt('f₁(x)='+ (s.length>32?'…'+s.slice(-31):s),5,36,'#111a24',14,'bold');
    }
    if(v){
      rect(4,23,30,18,'#e8f0f7');txt('Trace',7,36,'#245387',9,'bold');
      rect(2,220,316,20,'#ecf3fa');line(2,220,318,220,'#a4b9ce',.7);
      if(buffer)txt('x = '+buffer,9,234.5,'#152b45',13,'bold');
      const value='f₁: ('+prettyX(v.x)+', '+pretty(v.y)+')';
      txt(value,309,234.5,'#152b45',buffer&&value.length>21?10:15,'bold','right');
    }
    if(table&&q){
      rect(155,20,165,220,'#f8fafb');line(155,20,155,239,'#1c2733',pane==='table'?2:1);
      if(pane==='graph')line(1,20,153,20,'#1c2733',2);
      rect(157,22,161,22,'#d6e7f5');
      txt('x',188,37,'#142d48',13,'bold','center');txt('f₁(x)',269,37,'#142d48',13,'bold','center');
      const first=rowStart(ask,row);
      line(222,22,222,220,'#98a9b9',.8);
      for(let i=0;i<grid.visible;i++){
        const index=first+i, y=grid.top+i*grid.rowHeight;
        const n=ask?rows[index]:Math.abs(index)<=100?index:undefined;
        if(index===row&&pane==='table')rect(158,y+1,63,grid.rowHeight-1,'#d5e9fa');
        line(157,y,318,y,'#a7b2be',.7);
        const num=index===row&&buffer?buffer:n===undefined?'':prettyX(n);
        const v=n===undefined?null:evaluate(q,n);
        txt(num,216,y+15,'#152b45',num.length>9?Math.max(6,98/num.length):12,'bold','right');
        if(v&&!(index===row&&buffer))txt(pretty(v.y),312,y+15,'#152b45',12,'bold','right');
      }
      rect(157,221,161,17,'#e7eef2');txt(ask?'Independent: Ask':'Independent: Auto',162,233,'#36546b',9,'bold');
    }
    if(state==='main'||state==='traceMenu'||state==='openMenu'){
      const key=state==='openMenu'?'openMenu':'main';panel(PANELS[key],state!=='main');
      if(state==='traceMenu')panel(PANELS.trace);
      if(state==='openMenu')panel(PANELS.open);
    }
    if(state==='tableRoot'||state==='tableMenu'){panel(PANELS.tableRoot,state==='tableMenu');if(state==='tableMenu')panel(PANELS.table);}
    if(state==='settings'){
      rect(36,47,250,151,'#0004');rect(33,44,250,151,'#294963');rect(34,45,248,149,'#f5f7f5');
      rect(34,45,248,24,'#d6e6f6');txt('Edit Table Settings',43,61,'#132f4b',14,'bold');
      const labels=['Table Start','Table Step','Independent','Dependent'], values=['0','1',data.askDraft?'Ask':'Auto','Auto'];
      for(let i=0;i<labels.length;i++){
        const y=77+i*24;
        txt(labels[i]+':',45,y+14,'#172b3b',12);
        rect(151,y,108,20,i===setting?'#4079a8':'#9aa9a7');rect(152,y+1,106,18,i===setting?'#e0effa':'#fff');
        txt(values[i],158,y+14,'#19324c',12,i===setting?'bold':'normal');
        if(i>=2)txt('▾',242,y+14,'#34536e',12,'bold');
      }
      rect(148,172,51,17,setting===4?'#2868a2':'#dde6e6');txt('OK',173,185,setting===4?'#fff':'#152b44',11,'bold','center');
      rect(206,172,54,17,'#dde6e6');txt('Cancel',233,185,'#152b44',11,'bold','center');
      if(dropdown){
        rect(151,145,108,42,'#45678a');rect(152,146,106,40,'#fff');
        rect(152,data.askDraft?166:146,106,20,'#c4dcef');
        txt('Auto',158,160,'#19324c',12,'bold');txt('Ask',158,180,'#19324c',12,'bold');
      }
    }
    display.getContext('2d',{alpha:false}).drawImage(off,0,0);
  }
  return {draw};
}
global.CT09Screen=Object.freeze({screen,pointAt,screenY,PANELS,SCREEN_X,grid,rowStart});
})(globalThis);
