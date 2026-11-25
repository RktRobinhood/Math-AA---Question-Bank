/* Original AI SL/HL integration practice; keeps both functions above the x-axis. */
(function (root) {
  "use strict";
  const E=root.QBEngine;
  const {ans,fmt}=E;
  const { num, poly, sf }=fmt;
  const P=(prompt,marks,answer,working)=>({prompt,marks,answer,working});
  const reg=def=>E.registerAll({home:"ai-sl",syllabus:["5.5"],format:"value",type:"t5-ai-positive-crossing-area",
    notFor:["aa-sl","aa-hl"]},[def])[0];
  const round=x=>Number(x.toPrecision(10));
  const tex=x=>`$${num(x)}$`;
  const int=(a,b,f)=>`\\displaystyle\\int_{${num(a)}}^{${num(b)}} ${f}\\,\\mathrm{d}x`;

  reg({unknown:"line-crossing",representation:"graph",levels:[2],calculator:false,source:"ai-sl-2022-may-tz2-p1-q06.a",
       title:"Net difference or combined region area",
       skills:["SL5.5.area-expression","SL5.5.area-between-curves"],
       build({rng}){
    const a=rng.int(1,4),b=rng.int(1,4),m=rng.pick([.5,1,1.5,2]), w=a+b, h=m*a+rng.int(1,4), y0=round(h-m*a);
    const l=round(m*a*a/2),r=round(m*b*b/2),signed=round(r-l),total=round(l+r);
    const graph={x:[-1,w+1],y:[0,Math.ceil(h+m*b)+1],xStep:1,yStep:Math.ceil((h+m*b)/8),alt:"An increasing line crosses a horizontal line. Both are above the horizontal axis on the interval.",
      functions:[{fn:{type:"poly",coeffs:[y0,m]},domain:[0,w],label:"f"},{fn:{type:"poly",coeffs:[h]},domain:[0,w],label:"g"}],
      regions:[{x:[0,a],fn:0,to:1},{x:[a,w],fn:0,to:1}]};
    return {params:{a,b,m,h,y0},graph,stem:`The graph shows $f(x) = ${poly([y0,m])}$ and $g(x) = ${num(h)}$ from $x = 0$ to $x = ${w}$. The two lines meet where $x = ${a}$; the regions between them are shaded.`,parts:[
      P(`Find the difference between the areas under $f$ and $g$: $${int(0,w,"(f(x) - g(x))")}$. Give an exact answer.`,2,ans.dec(signed),[
        `The left region is a triangle of area ${tex(l)}, where $g$ is above $f$.`,
        `The right region is a triangle of area ${tex(r)}, where $f$ is above $g$.`,
        `The net difference is $${num(r)} - ${num(l)} = ${num(signed)}$.`
      ]),
      P("Find the combined geometric area of the two shaded regions. Give an exact answer.",2,ans.dec(total),[
        `Geometric area adds both positive pieces: $${num(l)} + ${num(r)} = ${num(total)}$.`
      ])
    ]};
  }});

  reg({unknown:"quadratic-crossing",representation:"equation",levels:[4],calculator:true,source:"ai-sl-2022-may-tz2-p1-q06.c",
       title:"Split the area between a parabola and a horizontal line",
       skills:["SL5.5.area-expression","SL5.5.definite-integral-gdc","SL5.5.area-between-curves"],
       build({rng}){
    const u=rng.int(9,15)/10, v=rng.int(25,34)/10, h=rng.int(4,8),
      c=round(h+u*v),d=round(-u-v),w=4;
    const F=x=>x**3/3+d*x*x/2+(c-h)*x;
    const a=F(u)-F(0),b=F(u)-F(v),z=F(w)-F(v);
    const area=a+b+z, net=F(w)-F(0);
    const S=(gg,a,b) => int(a,b,gg);
    return {params:{u,v,h,c,d,w},stem:`The graphs $f(x) = ${poly([c,d,1])}$ and $g(x) = ${num(h)}$ are both above the horizontal axis for $0 \\le x \\le ${w}$.`,parts:[
      P("Find the smaller value of $x$ where the two graphs intersect.",1,ans.sf(u),[
        "Solve $f(x) = g(x)$ graphically or numerically.",
        `The smaller intersection occurs at $x = ${num(u)}$.`
      ]),
      P("Find the larger value of $x$ where the two graphs intersect.",1,ans.sf(v),[
        `The larger intersection occurs at $x = ${num(v)}$.`
      ]),
      P(`Calculate $${S("(f(x) - g(x))",0,w)}$.`,2,ans.sf(net),[
        "Enter the difference of the two functions and integrate over the whole interval.",
        `This gives $${sf(net)}$, a net difference, not a combined geometric area.`
      ]),
      P("Find the total geometric area between the two graphs on this interval.",3,ans.sf(area),[
        "The parabola is on top on the first and last intervals. The horizontal line is on top in the middle.",
        `Calculate $${S("(f(x) - g(x))",0,u)} + ${S("(g(x) - f(x))",u,v)} + ${S("(f(x) - g(x))",v,w)}$.`,
        `The total area is $${sf(area)}$ square units.`
      ])
    ]};
  }});
})(typeof globalThis==="undefined"?this:globalThis);
