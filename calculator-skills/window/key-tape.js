(function(global){
'use strict';
const field=[ '-10','10','Auto','-6.666666666667','6.666666666667','Auto'];
const ev=(time,key,delta={})=>({time,key,delta:Object.freeze(delta)});
const keys=[];
let raw='';
[[.29,'lparen','('],[.53,'x','x'],[.77,'minus','-'],[1.02,'1','1'],[1.26,'2','2'],[1.52,'rparen',')'],[1.86,'square','^2'],[2.13,'plus','+'],[2.41,'3','3']].forEach(([t,k,c])=>{raw+=c;keys.push(ev(t,k,{raw}));});
keys.push(ev(2.88,'enter',{state:'plotted'}),ev(10.67,'menu',{state:'menu',menuIndex:3}),ev(10.96,'4',{state:'submenu',subIndex:0}),ev(11.28,'1',{state:'settings',field:0,values:[...field]}));
function set(t,k,i,v){field[i]=v;keys.push(ev(t,k,{field:i,values:[...field]}));}
function tab(t,i){keys.push(ev(t,'tab',{field:i}));}
set(11.79,'1',0,'1');set(12.03,'0',0,'10');tab(12.30,1);set(12.58,'1',1,'1');set(12.85,'4',1,'14');tab(13.13,2);tab(13.48,3);
set(13.75,'0',3,'0');tab(14.21,4);set(14.49,'8',4,'8');tab(15.18,5);tab(17.39,6);
keys.push(ev(17.98,'enter',{state:'plotted',bounds:{x0:10,x1:14,xs:'Auto',y0:0,y1:8,ys:'Auto'},reframed:true}));
global.CT08Tape=Object.freeze({duration:25.182041,keys:Object.freeze(keys),
starts:[0,4.08,10.67,17.98],
titles:['Plot the function','Spot the clipped view','Set both axis ranges','Check the new view'],
captionStarts:[0,4.08,7.5,11.48,15.2,18.16,22.36],
captions:[
'Enter the function in the Graphs application and press Enter.',
'The default window may hide the interesting feature.',
'Here the vertex lies beyond the usual central view.',
'Set the horizontal and vertical limits independently.',
'A viewing window does not change the domain.',
'This window contains the vertex with space on both sides.',
'Use your context to choose sensible bounds.'
]});
})(globalThis);
