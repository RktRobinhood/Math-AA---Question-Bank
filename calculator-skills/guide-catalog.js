(() => {
  'use strict';
  const inventory=Array.isArray(window.CALCULATOR_INVENTORY)?window.CALCULATOR_INVENTORY:[];
  const guides=Array.isArray(window.CALCULATOR_LESSONS)?window.CALCULATOR_LESSONS:[];
  const staged=window.HANDHELD_CATALOG_ROUTES??{skills:{},companions:{}};
  const safeRoute=path=>typeof path==='string'&&/^(?:[a-z][a-z0-9-]*\/)?index\.html$/.test(path)?path:null;
  const launch=window.CALCULATOR_LAUNCH_SCOPE??{};
  const byId=new Map(guides.map(l=>[l.id,l]));
  const search=document.getElementById('search'),topic=document.getElementById('topic'),
        results=document.getElementById('results'),count=document.getElementById('count');
  function el(tag,text,cls){
    const item=document.createElement(tag);
    if(text!==null && text!==undefined)item.textContent=String(text);
    if(cls)item.className=cls;
    return item;
  }
  function caseLabel(value){
    const s=String(value||'').trim().toLowerCase();
    return s.slice(0,1).toUpperCase()+s.slice(1);
  }
  function ref(r){
    if(!r || !r.year || !r.course || !r.paper || !r.questionNumber)return '';
    const question='Q'+r.questionNumber+(r.partLabel||'');
    return (r.relationship==='related'?'Related exam reference: ':'Exam reference: ')+[r.course.toUpperCase().replace('-',' '),caseLabel(r.session),r.year,r.tz,r.paper,question].filter(Boolean).join(' ');
  }
  const rows=inventory.map(row=>{
    const id=CalculatorLessonLinks.skillId(row.id);
    if(!id)return null;
    const family=caseLabel(row.family);
    const title=launch[id]?.title||row.title||byId.get(id)?.title||id;
    const scopeNote=launch[id]?.scopeNote||'';
    const dedicated=CalculatorLessonLinks.isDedicated(id);
    const recording=window.CALCULATOR_AUDIO?.lessons?.[id];
    const route=staged.skills?.[id], simulator=safeRoute(route?.path);
    const companions=(staged.companions?.[id]??[]).filter(x=>safeRoute(x.path));
    return {id,family,title,scopeNote,href:simulator||CalculatorLessonLinks.lessonHref(id),dedicated:!!simulator||dedicated,
      narrated:simulator?route.narrated===true:!!recording,companions,reference:simulator&&route.reference===true,ref:ref(row.sourceReference)};
  }).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id));
  [...new Set(rows.map(r=>r.family).filter(Boolean))].forEach(s=>{
    const opt=el('option',s);opt.value=s;topic.append(opt);
  });
  function makeRow(r){
    const card=el('article',null,'catalog-row');
    const record=el('div',null,'catalog-record'),label=el('h2'),link=el('a',r.title);
    link.href=r.href;label.append(link);record.append(label);
    if(r.scopeNote)record.append(el('p',r.scopeNote,'catalog-scope'));
    if(r.ref)record.append(el('p',r.ref));
    if(r.reference){
      const p=el('p'), guide=el('a','Reference guide');guide.href='lesson.html?id='+r.id;
      p.append(guide);record.append(p);
    }
    for(const c of r.companions){
      const p=el('p'), companion=el('a',c.label);
      companion.href=c.path;
      p.append(companion);record.append(p);
    }
    const type=el('div',null,'catalog-type');
    type.append(el('strong',r.dedicated?(r.narrated?'Simulator · narrated':'Simulator · captions'):r.narrated?'Narrated guide':'Captioned guide'),el('div',r.family));
    card.append(el('span',r.id,'catalog-id'),record,type);
    return card;
  }
  function render(){
    const bits=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const found=rows.filter(r=>(!topic.value||topic.value===r.family)&&bits.every(b=>[r.id,r.family,r.title,r.scopeNote,r.ref].join(' ').toLowerCase().includes(b)));
    count.textContent=found.length+' '+(found.length===1?'skill':'skills');
    results.replaceChildren(...found.map(makeRow));
    if(!found.length)results.append(el('p',rows.length?'No matches. Try a different search or topic.':'The skill library didn’t load.'));
  }
  search.addEventListener('input',render);
  topic.addEventListener('change',render);
  render();
})();
