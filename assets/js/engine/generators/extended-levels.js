/* Original prerequisite and synoptic families. No selection changes. */
(function (root) {
  'use strict';
  const E = root.QBEngine;
  const { ans, fmt } = E;
  const { frac, num, point, sf, deg, poly, lin, unit } = fmt;
  const M = s => '$' + s + '$';
  const P = (prompt, marks, answer, working) => ({prompt,marks,answer,working});
  const reg = (def) => E.register({calculator:false,format:'value',...def});
  const d = x => (180 / Math.PI) * x;

  reg({type:'t1-ext-rung-signed-change',unknown:'find-change',representation:'words',levels:[0],syllabus:['1.2'],skills:['SL1.2.find-u1-d'],
    title:'Find a signed change',build({rng}) {
      const before=rng.int(-45,45), after=before+rng.nonzero(-24,24), change=after-before;
      return {params:{before,after},stem:'A value changes from ' + M(before) + ' to ' + M(after) + '.',
        parts:[P('Find the signed change.',1,ans.int(change),[
          'Subtract the starting value from the final value: ' + M(after+' - '+fmt.paren(before)+' = '+change) + '.'
        ])]};
  }});
  reg({type:'t1-ext-rung-two-running-totals',unknown:'compare-term-and-total-crossings',representation:'words',levels:[5],
    syllabus:['1.2','1.3'],skills:['SL1.2.nth-term','SL1.2.sum','SL1.3.nth-term','SL1.3.sum'],
    title:'When daily and cumulative outputs overtake',build({rng}) {
      let a,h,b,ratio,first,totalFirst;
      const A=n=>a+(n-1)*h, B=n=>b*ratio**(n-1), SA=n=>n*(a+A(n))/2, SB=n=>b*(ratio**n-1)/(ratio-1);
      do {
        a=rng.int(16,34); h=rng.int(2,7); b=rng.int(2,7); ratio=rng.pick([2,3]);
        first=1; while(B(first)<=A(first)) first++;
      } while (SA(first)<=SB(first));
      totalFirst=first+1; while(SB(totalFirst)<=SA(totalFirst)) totalFirst++;
      return {params:{a,h,b,ratio},stem:'Two workshops keep daily records. The first completes '+M(a)+' items on day one, then completes '+M(h)+' more each day than on the previous day. The second completes '+M(b)+' items on day one, then multiplies its previous daily output by '+M(ratio)+'.',
        parts:[
          P('Find the first day when the second workshop completes more items that day.',2,ans.int(first),[
            'For day '+M('n')+', compare '+M('A_{n} = '+lin(h,a-h,'n'))+' with '+M('B_{n} = '+b+'\\times '+ratio+'^{n - 1}')+'.',
            M('B_{'+(first-1)+'} = '+B(first-1)+' \\le '+A(first-1)+' = A_{'+(first-1)+'}')+' but '+M('B_{'+first+'} = '+B(first)+' > '+A(first)+' = A_{'+first+'}')+'.',
            'The daily difference has increasing increments: the geometric daily gain increases while the arithmetic daily gain is constant. Starting below zero, the difference can cross above zero only once.'
          ]),
          P('By how many items is the first workshop still ahead in total at the end of that day?',3,ans.int(SA(first)-SB(first)),[
            'Use the arithmetic and geometric sums up to '+M('n = '+first)+'.',
            M('S_{A} = \\dfrac{'+first+'}{2}\\left('+a+' + '+A(first)+'\\right) = '+SA(first)),
            M('S_{B} = \\dfrac{'+b+'\\left('+ratio+'^{'+first+'} - 1\\right)}{'+(ratio-1)+'} = '+SB(first)),
            'The total lead is '+M(SA(first)+' - '+SB(first)+' = '+(SA(first)-SB(first)))+'.'
          ]),
          P('Find the first day when the second workshop is ahead in cumulative output.',3,ans.int(totalFirst),[
            'Before the daily crossing, the first workshop is never losing items from its lead. After it, the second workshop gains each day.',
            'At the end of day '+M(totalFirst-1)+', the cumulative totals are '+M(SA(totalFirst-1))+' and '+M(SB(totalFirst-1))+' respectively.',
            'At the end of day '+M(totalFirst)+', they are '+M(SA(totalFirst))+' and '+M(SB(totalFirst))+' respectively. This is the first time the cumulative lead changes.'
          ])
        ]};
  }});
  reg({type:'fn-ext-rung-horizontal-change',unknown:'find-input-change',representation:'equation',levels:[0],syllabus:['2.1'],skills:['SL2.1.gradient'],
    title:'Find the horizontal change between points',build({rng}) {
      const x1=rng.int(-20,20), x2=x1+rng.nonzero(-13,13), y1=rng.int(-10,10), y2=y1+rng.nonzero(-8,8);
      return {params:{x1,x2},stem:'Move from '+M('\\mathrm{A}'+point(x1,y1))+' to '+M('\\mathrm{B}'+point(x2,y2))+'.',
        parts:[P('Find the signed change in the horizontal coordinate.',1,ans.int(x2-x1),[
          'Use the first coordinates: '+M('\\Delta x = '+x2+' - '+fmt.paren(x1)+' = '+(x2-x1))+'.'
        ])]};
  }});
  reg({type:'fn-ext-rung-tariff-lower-envelope',unknown:'maximise-affordable-use',representation:'words',levels:[5],
    syllabus:['2.1','2.2','2.4'],skills:['SL2.1.line-model','SL2.2.domain','SL2.4.intersection'],
    title:'Compare two tariffs and maximise affordable use',build({rng}) {
      const s=rng.int(2,6), t=s+rng.int(2,6), meet=rng.int(7,15), q=rng.int(3,22), p=q+(t-s)*meet;
      const cross=p+s*meet, extra=rng.pick([-1,1])*rng.int(4,12), budget=cross+extra;
      const a=Math.floor((budget-p)/s), b=Math.floor((budget-q)/t), max=Math.max(a,b);
      return {params:{s,t,p,q,budget},stem:'A venue charges for whole hours only. Offer A has a booking fee of '+M(p)+' euros and '+M(s)+' euros per hour. Offer B charges '+M(q)+' euros plus '+M(t)+' euros per hour.',
        parts:[
          P('Find the number of hours for which the offers cost the same.',3,ans.int(meet),[
            'For '+M('x')+' hours the costs are '+M(lin(s,p))+' and '+M(lin(t,q))+' euros.',
            'Equate the costs: '+M((t-s)+'x = '+(p-q))+'; hence '+M('x = '+meet)+'.'
          ]),
          P('Find the least whole number of hours for which offer A is strictly cheaper.',2,ans.int(meet+1),[
            'Offer A has a smaller hourly charge, so beyond the crossing its cost is lower.',
            'The crossing itself gives equal costs; the first strictly cheaper whole-hour booking is '+M(meet+1)+'.'
          ]),
          P('A group can spend at most '+M(budget)+' euros. Find the greatest whole number of hours it can book using either offer.',3,ans.int(max),[
            'Solve both affordability inequalities '+M(lin(s,p)+' \\le '+budget)+' and '+M(lin(t,q)+' \\le '+budget)+'.',
            'For offer A the upper bound is '+M(frac(budget-p,s))+' hours; for offer B it is '+M(frac(budget-q,t))+' hours.',
            'Round both bounds down because the group cannot overspend. Compare '+M(a)+' and '+M(b)+'; the answer is '+M(max)+' hours.'
          ])
        ]};
  }});
  reg({type:'t3-ext-rung-right-triangle-length',unknown:'find-hypotenuse',representation:'words',levels:[0],syllabus:['3.2'],skills:['SL3.2.right-side'],
    title:'Recognise and find the hypotenuse',build({rng}) {
      const m=rng.int(2,4), n=rng.int(1,m-1), k=rng.int(1,3);
      const a=k*(m*m-n*n), b=k*2*m*n, c=k*(m*m+n*n);
      return {params:{a,b},stem:'The two sides meeting at the right angle of a triangle have lengths '+M(unit(a,'cm'))+' and '+M(unit(b,'cm'))+'.',
        parts:[P('Find the length of the hypotenuse, in centimetres.',2,ans.int(c),[
          'The hypotenuse is opposite the right angle.',
          M('c = \\sqrt{'+a+'^{2} + '+b+'^{2}} = '+c)
        ])]};
  }});
  reg({type:'t3-ext-rung-drone-lines-of-sight',unknown:'connect-bearing-elevation-and-space-angle',representation:'words',levels:[5],calculator:true,
    syllabus:['3.3','3.2','3.1'],skills:['SL3.3.bearings','SL3.3.elevation-depression','SL3.1.distance-3d','SL3.2.cosine-rule-angle'],
    title:'A drone: bearing, elevation and sight-line angle',build({rng}) {
      const a=rng.int(21,63), b=rng.int(19,62), h=rng.int(24,79), run=Math.hypot(a,b);
      const od=Math.hypot(a,b,h), ad=Math.hypot(b,h), bearing=d(Math.atan(a/b)), elevation=d(Math.atan(h/run));
      const gamma=d(Math.acos((od*od+ad*ad-a*a)/(2*od*ad)));
      return {params:{a,b,h},stem:'From '+M('\\mathrm{O}')+', a surveyor walks '+M(unit(a,'m'))+' due east to '+M('\\mathrm{A}')+' and then '+M(unit(b,'m'))+' due north to '+M('\\mathrm{B}')+'. A drone is hovering vertically above '+M('\\mathrm{B}')+' at a point '+M('\\mathrm{D}')+', '+M(unit(h,'m'))+' above the level ground. Give angles to three significant figures.',
        parts:[
          P('Find the bearing of '+M('\\mathrm{B}')+' from '+M('\\mathrm{O}')+'. Give the angle in degrees clockwise from north.',2,ans.sf(bearing),[
            'The displacement east is '+M(a)+' and north is '+M(b)+'.',
            M('\\beta = \\tan^{-1}\\left('+frac(a,b)+'\\right) \\approx '+deg(sf(bearing)))
          ]),
          P('Find the angle of elevation of the drone from '+M('\\mathrm{O}')+'.',2,ans.sf(elevation),[
            'The horizontal distance is '+M('\\mathrm{OB} = \\sqrt{'+num(a*a+b*b)+'}')+'.',
            M('\\alpha = \\tan^{-1}\\left(\\dfrac{'+h+'}{\\sqrt{'+num(a*a+b*b)+'}}\\right) \\approx '+deg(sf(elevation)))
          ]),
          P('Find the angle at the drone between the sight lines to '+M('\\mathrm{O}')+' and '+M('\\mathrm{A}')+'.',4,ans.sf(gamma),[
            'Use the spatial lengths '+M('\\mathrm{OD} = \\sqrt{'+num(a*a+b*b+h*h)+'}')+' and '+M('\\mathrm{AD} = \\sqrt{'+num(b*b+h*h)+'}')+'.',
            'Apply the cosine rule in triangle '+M('\\mathrm{ODA}')+', where '+M('\\mathrm{OA} = '+a)+'.',
            M('\\cos \\angle \\mathrm{ODA} = \\dfrac{\\mathrm{OD}^{2} + \\mathrm{AD}^{2} - \\mathrm{OA}^{2}}{2\\,\\mathrm{OD}\\,\\mathrm{AD}}'),
            M('\\angle \\mathrm{ODA} \\approx '+deg(sf(gamma)))
          ])
        ]};
  }});
  reg({type:'t4-ext-rung-whole-from-groups',unknown:'find-fraction-of-whole',representation:'words',levels:[0],syllabus:['4.5'],skills:['SL4.5.equally-likely'],
    title:'Express a group as a fraction of the whole',build({rng}) {
      const a=rng.int(3,24), b=rng.int(4,28), c=rng.int(3,22), n=a+b+c;
      return {params:{counts:[a,b,c]},stem:'A drawer has '+M(a)+' blue clips, '+M(b)+' green clips and '+M(c)+' silver clips, and no others.',
        parts:[P('What fraction of all the clips is blue?',2,ans.frac(a,n),[
          'Count all the clips: '+M(a+' + '+b+' + '+c+' = '+n)+'.',
          'The numerator counts the blue clips; the denominator counts all clips, giving '+M(frac(a,n))+'.'
        ])]};
  }});
  reg({type:'t4-ext-rung-hidden-machine',unknown:'update-and-predict-a-batch',representation:'words',levels:[5],calculator:true,
    syllabus:['4.6','4.8'],skills:['SL4.6.conditional-diagram','SL4.6.tree','SL4.8.cumulative-probability','SL4.8.binomial-in-context'],
    title:'Update the hidden source and predict a batch',build({rng}) {
      const w=rng.int(3,7)/10, pa=rng.int(13,18)/20, pb=rng.int(3,11)/20, n=rng.int(3,7);
      const failA=w*(1-pa), failB=(1-w)*(1-pb), fail=failA+failB, post=failA/fail;
      const tail= p=>1-(1-p)**n-n*p*(1-p)**(n-1);
      const future=post*tail(pa)+(1-post)*tail(pb);
      return {params:{w,pa,pb,n},stem:'A lab randomly selects one machine for an entire trial. The probability the machine is A is '+M(num(w))+'. The other possible machine is B. On each inspection, A passes with probability '+M(num(pa))+' and B with probability '+M(num(pb))+'. Conditional on the selected machine, all inspections are independent. Give numerical probabilities to three significant figures.',
        parts:[
          P('Find the probability that the first inspection fails.',2,ans.sf(fail),[
            'A first failure can come from either machine.',
            M('\\mathrm{P}(F) = '+num(w)+'\\left(1 - '+num(pa)+'\\right) + '+num(1-w)+'\\left(1 - '+num(pb)+'\\right) \\approx '+sf(fail))
          ]),
          P('Given that the first inspection failed, find the probability that machine A was selected.',3,ans.sf(post),[
            'The numerator must represent selecting A and failing on the first inspection.',
            M('\\mathrm{P}(A \\mid F) = \\dfrac{\\mathrm{P}(A \\cap F)}{\\mathrm{P}(F)}'),
            M('\\mathrm{P}(A \\mid F) \\approx '+sf(post))
          ]),
          P('The same machine is used for a further '+M(n)+' inspections. Given the first failure, find the probability of at least two passes in these further inspections.',4,ans.sf(future),[
            'For a fixed machine with pass probability '+M('p')+', the further pass count '+M('X')+' is binomial.',
            M('\\mathrm{P}(X \\ge 2) = 1 - (1 - p)^{'+n+'} - '+n+'p(1 - p)^{'+(n-1)+'}'),
            'Evaluate this tail separately for A and B; the machine is not chosen again between inspections.',
            'Weight the tails by the two probabilities after the failure, keeping full precision: '+M('\\mathrm{P}(X \\ge 2 \\mid F) \\approx '+sf(future))+'.'
          ])
        ]};
  }});
  reg({type:'t5-ext-rung-line-rise-over-run',unknown:'find-gradient',representation:'equation',levels:[0],
    syllabus:['5.1'],skills:['SL5.1.gradient-from-graph'],
    title:'Find a line gradient from two coordinates',build({rng}) {
      const x=rng.int(-10,10), y=rng.int(-8,8), run=rng.int(2,12), rise=rng.nonzero(-14,14);
      return {params:{x,y,x2:x+run,y2:y+rise},stem:'A straight line passes through '+M(point(x,y))+' and '+M(point(x+run,y+rise))+'.',
        parts:[P('Find the gradient of the line.',2,ans.frac(rise,run),[
          M('\\Delta y = '+(y+rise)+' - '+fmt.paren(y)+' = '+rise)+' and '+M('\\Delta x = '+(x+run)+' - '+fmt.paren(x)+' = '+run)+'.',
          'Divide the change in the vertical coordinate by the change in the horizontal coordinate: '+M(frac(rise,run))+'.'
        ])]};
  }});
  reg({type:'t5-ext-rung-signed-transfer',unknown:'connect-rate-volume-and-throughput',representation:'words',levels:[5],calculator:true,
    syllabus:['5.5','5.2'],skills:['SL5.5.boundary-condition','SL5.5.area-positive','SL5.5.total-change-from-rate','SL5.2.sign-at-point'],
    title:'A tank: turning point, original level and total transfer',build({rng}) {
      const h=rng.int(2,9), k=rng.int(1,8), start=k*h**3+rng.int(20,350), end=2*h;
      const V=t=>start+k*(h*h*t-t**3/3), top=V(h), early=V(h/2), reset=Math.sqrt(3)*h, total=(top-start)+(top-V(end));
      const rate=poly([-k,0,k*h*h],'t');
      return {params:{h,k,start,end},stem:'A tank starts with '+M(num(start))+' cubic metres of water. For '+M('0 \\le t \\le '+end)+', where '+M('t')+' is measured in hours, its signed flow rate is '+M('r(t) = '+rate)+' cubic metres per hour. Positive flow adds water; negative flow removes it. Give volumes and non-integer times to three significant figures.',
        parts:[
          P('Find the volume after '+M(num(h/2))+' hours.',2,ans.sf(early),[
            M('V(t) = '+num(start)+' + '+num(k*h*h)+'t - '+(k===3?'':frac(k,3))+'t^{3}'),
            'The integration constant is the starting volume. Substitute '+M('t = '+num(h/2))+' to obtain '+M(sf(early))+' cubic metres.'
          ]),
          P('Find the time at which the volume is greatest.',2,ans.int(h),[
            M('r(t) = 0')+' at '+M('t = '+h)+' in the interval.',
            'The flow is positive before that time and negative afterwards, so the volume rises and then falls.'
          ]),
          P('Find the maximum volume in cubic metres.',1,ans.sf(top),[
            'Use the volume at the sign change: '+M('V('+h+') \\approx '+sf(top))+'.'
          ]),
          P('After the start, find the time when the volume next equals its starting value.',2,ans.sf(reset),[
            'Set the net change to zero; the equation can be factored as '+M((k===1?'':k)+'t\\left('+h+'^{2} - \\dfrac{t^{2}}{3}\\right) = 0')+'.',
            'Take the positive solution '+M('t = '+h+'\\sqrt{3} \\approx '+sf(reset))+'.'
          ]),
          P('Find the total volume transferred in either direction across the entire period.',2,ans.sf(total),[
            'The total transferred is the amount added before the maximum plus the amount removed afterwards.',
            M('\\left(V('+h+') - V(0)\\right) + \\left(V('+h+') - V('+end+')\\right) \\approx '+sf(total))+' cubic metres.'
          ])
        ]};
  }});
})(typeof window !== 'undefined' ? window : globalThis);
