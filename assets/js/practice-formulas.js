/* References for generated Practice. Exact skill tags, never question text or answers. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(null);
  else root.QBPracticeFormulas=factory(root);
})(typeof window==='undefined'?null:window,function(win){
  'use strict';
  const R=String.raw;
  const formulas=Object.freeze({
    'arith-term':['Arithmetic sequence',R`u_n=u_1+(n-1)d`],
    'arith-sum':['Arithmetic series',R`S_n=\tfrac n2[2u_1+(n-1)d]`],
    'geo-term':['Geometric sequence',R`u_n=u_1r^{n-1}`],
    'geo-sum':['Geometric series',R`S_n=\frac{u_1(1-r^n)}{1-r}`,R`For $r\ne1$.`],
    'cosine-side':['Cosine rule',R`c^2=a^2+b^2-2ab\cos C`,'Angle C is between sides a and b, opposite c.'],
    'cosine-angle':['Cosine rule',R`\cos C=\frac{a^2+b^2-c^2}{2ab}`,'Angle C is opposite side c.'],
    'sine':['Sine rule',R`\frac{a}{\sin A}=\frac{b}{\sin B}=\frac{c}{\sin C}`,'Each side is paired with its opposite angle.'],
    'triangle-area':['Triangle area',R`\text{Area}=\tfrac12 ab\sin C`,'Angle C is between sides a and b.'],
    'arc':['Arc length',R`s=r\theta`,'Use radians for θ.'],
    'sector':['Sector area',R`\text{Area}=\tfrac12 r^2\theta`,'Use radians for θ.'],
    'distance':['Distance in 3D',R`d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}`],
    'midpoint':['Midpoint in 3D',R`\left(\frac{x_1+x_2}{2},\frac{y_1+y_2}{2},\frac{z_1+z_2}{2}\right)`],
    'discriminant':['Discriminant',R`\Delta=b^2-4ac`,R`For $ax^2+bx+c=0$, with $a\ne 0$.`],
    'conditional':['Conditional probability',R`P(A\mid B)=\frac{P(A\cap B)}{P(B)}`,R`Requires $P(B)>0$.`],
    'binomial':['Binomial probability',R`P(X=x)=\binom nx p^x(1-p)^{n-x}`,R`For $X\sim B(n,p)$.`],
    'product':['Product rule',R`(uv)'=u'v+uv'`],
    'quotient':['Quotient rule',R`\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}`,R`For $v\ne0$.`],
    'chain':['Chain rule',R`(f(g(x)))'=f'(g(x))\,g'(x)`],
  });
  const tags=new Map(Object.entries({
    'SL1.2.nth-term':'arith-term','SL1.2.sum':'arith-sum','SL1.3.nth-term':'geo-term','SL1.3.sum':'geo-sum',
    'SL3.2.cosine-rule-side':'cosine-side','SL3.2.cosine-rule-angle':'cosine-angle',
    'SL3.2.sine-rule':'sine','SL3.2.area-sine':'triangle-area',
    'SL3.1.distance-3d':'distance','SL3.1.midpoint-3d':'midpoint','AHL3.12.distance-between-points':'distance',
    'SL3.4.arc-length':'arc','SL3.4.sector-area':'sector','AHL3.7.arc-length':'arc','AHL3.7.sector-area':'sector',
    'SL2.7.discriminant':'discriminant','SL2.7.discriminant-parameter':'discriminant',
    'SL4.11.conditional-formula':'conditional','SL4.11.reverse-conditional':'conditional','SL4.6.conditional-diagram':'conditional',
    'SL4.8.binomial-in-context':'binomial','SL5.6.product-rule':'product','AHL5.9.product-rule':'product',
    'SL5.6.quotient-rule':'quotient','AHL5.9.quotient-rule':'quotient','SL5.6.chain-rule':'chain','AHL5.9.chain-rule':'chain',
  }));
  const courses=new Set(['aa-sl','aa-hl','ai-sl','ai-hl']);
  function forQuestion({item,question,course,tab='practice'}={}){
    if(item?.kind!=='generated'||question?.course!==course||!courses.has(course)||tab!=='practice')return [];
    const ids=[...new Set((question.skills||[]).map(s=>tags.get(s)).filter(Boolean))];
    return ids.map(id=>[id,...formulas[id]]);
  }
  function mount(app,format){
    const d=app.ownerDocument;
    const desktop=win.matchMedia('(min-width: 1200px)');
    const compactTouch=win.matchMedia('(any-pointer: coarse) and (max-device-width: 700px), (any-pointer: coarse) and (max-device-height: 600px)');
    const el=(tag,cls,text)=>{const n=d.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
    const panel=el('dialog','practice-formula-panel');panel.id='practice-formulas';panel.setAttribute('aria-labelledby','practice-formulas-title');
    const head=el('header','practice-formula-head'), slot=el('span','practice-formula-slot');
    const title=el('h2','','Relevant formulas');title.id='practice-formulas-title';
    const back=el('button','practice-formula-back','×');back.type='button';back.setAttribute('aria-label','Close formulas');
    const body=el('div','practice-formula-content');
    head.append(title,slot,back);panel.append(head,body);app.append(panel);
    let owner=null,trigger=null,placeholder=null;
    const wide=()=>desktop.matches&&!compactTouch.matches;
    function mark(on){
      if(!trigger)return;
      trigger.setAttribute('aria-expanded',String(on));
      trigger.setAttribute('aria-controls',panel.id);
    }
    function restore(){
      if(placeholder?.isConnected&&trigger)placeholder.replaceWith(trigger);
      else if(placeholder&&trigger)trigger.remove();
      placeholder=null;
    }
    function position(){
      if(wide()||!trigger||!trigger.isConnected||placeholder)return;
      placeholder=d.createComment('practice formula toggle');trigger.replaceWith(placeholder);slot.append(trigger);
    }
    function finish(restoreFocus){
      restore();mark(false);app.classList.remove('with-practice-formulas');
      if(restoreFocus&&trigger?.isConnected)trigger.focus({preventScroll:true});
    }
    function close(restoreFocus=true){
      if(!panel.open)return;
      panel.close();finish(restoreFocus);
    }
    panel.addEventListener('cancel',e=>{e.preventDefault();close();});
    back.addEventListener('click',()=>close());
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.matches(':modal')){e.preventDefault();close();}});
    desktop.addEventListener('change',()=>close());
    compactTouch.addEventListener('change',()=>close());
    function toggle(){
      if(panel.open){close();return;}
      if(!trigger?.isConnected||!owner)return;
      if(wide())panel.show();
      else { win.QBPracticeCalculator?.close(false);position();panel.showModal(); }
      mark(true);app.classList.add('with-practice-formulas');
      (wide()?back:trigger).focus({preventScroll:true});
    }
    function bind(next,nextTrigger,entries){
      if(next!==owner){
        close(false);owner=next;
        body.replaceChildren(...entries.map(([id,label,tex,note])=>{
          const card=el('section','practice-formula-item');card.dataset.formula=id;
          const expression=format('$'+tex+'$','div');expression.className='practice-formula-math';
          card.append(el('h3','',label),expression);
          if(note)card.append(format(note,'p'));
          return card;
        }));
      } else if(panel.open&&nextTrigger&&trigger!==nextTrigger){
        restore();trigger=nextTrigger;position();mark(true);
      }
      trigger=nextTrigger;
      mark(panel.open);
    }
    return Object.freeze({toggle,bind,close});
  }
  return Object.freeze({forQuestion,mount});
});
