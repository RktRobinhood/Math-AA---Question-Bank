(function(root){"use strict";
function screen(display){
 const buf=document.createElement("canvas");buf.width=640;buf.height=480;
 const c=buf.getContext("2d",{alpha:false});c.scale(2,2);
 function rect(x,y,w,h,f){c.fillStyle=f;c.fillRect(x,y,w,h);}
 function text(t,x,y,{size=15,color="#152536",align="left",weight=500}={}){
  c.fillStyle=color;c.font=weight+" "+size+"px Arial,sans-serif";c.textAlign=align;c.fillText(t,x,y);
 }
 function draw(model){
  rect(0,0,320,240,"#fcfdfe");
  const g=c.createLinearGradient(0,0,0,23);g.addColorStop(0,"#35495c");g.addColorStop(1,"#162434");rect(0,0,320,21,g);
  rect(4,3,26,16,"#dce7ef");text("1.1",9,15,{size:11,weight:700,color:"#172839"});
  text("RAD",267,14,{size:8,color:"#dcebf4"});rect(300,6,14,8,"#385064");rect(301,7,12,6,"#a1d267");rect(314,8,2,4,"#385064");rect(0,20,320,1,"#64a6bd");
  const rows=model.history.slice(-3);
  rows.forEach((result,i)=>{
   const y=42+i*49,expression=result.expression,len=expression.length;let size=len>33?12:16;
   text(expression,10,y,{size,color:i===rows.length-1?"#1d2936":"#47616e"});
   text(root.CT42Math.fmt(result.value),308,y+20,{size:17,align:"right",weight:700});
   rect(10,y+26,298,1,"#dce4e9");
  });
  if(model.error){
   rect(7,182,306,25,"#f2e4e1");text("Check the command",13,199,{size:13,weight:700,color:"#612a1c"});
  }
  rect(0,211,320,29,"#edf2f5");rect(0,211,320,1,"#8ba9be");
  const raw=model.draft.replace(/-/g,"−"),shown=raw.length>31?"…"+raw.slice(-30):raw;
  text(shown+"▏",8,231,{size:raw.length>24?13:16,weight:600});
  display.getContext("2d",{alpha:false}).drawImage(buf,0,0);
 }
 return {draw};
}
root.CT42Screen=Object.freeze({screen});
})(globalThis);
