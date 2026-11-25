import {WebGLRenderer,Scene,OrthographicCamera,CanvasTexture,PlaneGeometry,Mesh,MeshBasicMaterial,LinearFilter,SRGBColorSpace} from './vendor/three.module.min.js';
export const MENUS={
 main:{x:8,y:24,w:108,rows:['1: Actions','2: Number','3: Algebra','4: Calculus','5: Probability','6: Statistics','7: Matrix & Vector','8: Finance'],active:2},
 sub:{x:117,y:54,w:166,rows:['1: Numerical Solve','2: Solve System of Linear Equations','3: Polynomial Tools'],active:0}
};
const swap=s=>String(s).replace(/-/g,'−');
export function surface(display){
 let img=document.createElement('canvas');img.width=640;img.height=480;
 const c=img.getContext('2d',{alpha:false});c.scale(2,2);
 let renderer,tex,scene,camera;
 try{
  const cv=document.createElement('canvas');cv.id=display.id;cv.setAttribute('aria-hidden','true');
  renderer=new WebGLRenderer({canvas:cv,antialias:false,alpha:false,powerPreference:'low-power'});
  renderer.setSize(640,480,false);renderer.outputColorSpace=SRGBColorSpace;
  scene=new Scene();camera=new OrthographicCamera(-1,1,1,-1,.01,8);camera.position.z=1;
  tex=new CanvasTexture(img);tex.colorSpace=SRGBColorSpace;tex.minFilter=LinearFilter;tex.magFilter=LinearFilter;tex.generateMipmaps=false;
  scene.add(new Mesh(new PlaneGeometry(2,2),new MeshBasicMaterial({map:tex,toneMapped:false})));display.replaceWith(cv);
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();cv.replaceWith(display);renderer=null;draw.last&&draw(draw.last)});
 }catch{renderer=null}
 function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
 function line(x,y,x2,y2,color='#9aabb8'){c.strokeStyle=color;c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
 function text(t,x,y,{color='#142134',size=11,weight=400,align='left',maxWidth}={}){c.fillStyle=color;c.font=weight+' '+size+'px Arial, sans-serif';c.textAlign=align;c.textBaseline='alphabetic';maxWidth?c.fillText(t,x,y,maxWidth):c.fillText(t,x,y)}
 function menu({x,y,w,rows,active},dim=false){
   rect(x+2,y+2,w,rows.length*15+4,'#0003');rect(x,y,w,rows.length*15+4,'#152938');rect(x+1,y+1,w-2,rows.length*15+2,'#f6f6f6');
   rows.forEach((row,i)=>{const yy=y+2+i*15,sel=i===active;
    if(sel)rect(x+1,yy,w-2,15,dim?'#bdcfe0':'#2568ad');
    text(row,x+5,yy+10,{color:sel&&!dim?'#fff':'#161c21',size:9.65,weight:sel?700:400});
    if(w===MENUS.main.w)text('›',x+w-7,yy+10,{color:sel&&!dim?'#fff':'#27303b',size:11});
   });
 }
 function draw(data){
   draw.last=data;
   const {state,cmd='',result='',history=[],cursor=false,cursorFromEnd=0,exponentOpen=false,historyFocus,wideNote=''}=data;
   rect(0,0,320,240,'#fff');
   const bar=c.createLinearGradient(0,0,0,20);bar.addColorStop(0,'#24313a');bar.addColorStop(.68,'#19232c');bar.addColorStop(1,'#101820');rect(0,0,320,20,bar);
   rect(3,4,25,15,'#eef5fa');rect(4,5,23,13,'#d4e5f0');text('1.1',9,15,{size:10,weight:700});
   text('RAD',276,14,{size:8,weight:700,color:'#e3eff2'});rect(303,7,12,7,'#254057');rect(304,8,10,5,'#9dd55e');rect(315,9,2,3,'#254057');line(0,19,320,19,'#349eb1');
   const view=[...history];
   if(state==='result')view.push({cmd,result});
   view.slice(-2).forEach((row,i)=>{
     const y=44+i*51;
     if(i===0&&historyFocus)rect(6,historyFocus==='input'?y-15:y+5,307,23,'#d3e7f0');
     text(swap(row.cmd),10,y,{maxWidth:300,size:14});
     text(swap(row.result),307,y+21,{align:'right',size:15});
     line(6,y+30,314,y+30,'#d6e0e8');
   });
   if(state==='entry'||state==='menu'||state==='submenu'||state==='idle'||wideNote){
      rect(5,214,310,20,'#f2f6fb');rect(5,214,310,.7,'#b2c5d4');
      text(swap(cmd),9,229,{size:13,maxWidth:300});
      if(cursor){const w=Math.min(295,Math.max(0,c.measureText(swap(cmd.slice(0,cursorFromEnd ? -cursorFromEnd : undefined))).width));line(10+w,exponentOpen?215:218,10+w,exponentOpen?223:230,'#213446')}
   }
   if(state==='menu'||state==='submenu')menu(MENUS.main,state==='submenu');
   if(state==='submenu')menu(MENUS.sub);
   if(renderer){tex.needsUpdate=true;renderer.render(scene,camera)}else display.getContext('2d',{alpha:false}).drawImage(img,0,0);
 }
 return {draw,get backend(){return renderer?'three':'canvas'}};
}
