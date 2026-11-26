(() => {
  'use strict';
  const inventory=Array.isArray(window.CALCULATOR_INVENTORY)?window.CALCULATOR_INVENTORY:[];
  const staged=window.HANDHELD_CATALOG_ROUTES??{skills:{},companions:{}};
  const safeRoute=path=>typeof path==='string'&&/^(?:[a-z][a-z0-9-]*\/)?index\.html$/.test(path)?path:null;
  const launch=window.CALCULATOR_LAUNCH_SCOPE??{};
  const scope=window.CALCULATOR_COURSE_SCOPE,course=window.QB_COURSE;
  const companionTitles={maximum:'maximum maxima optimization',histogram:'histogram frequency bin class width'};
  const search=document.getElementById('search'),topic=document.getElementById('topic'),
        results=document.getElementById('results');
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
  const rows=inventory.map(row=>{
    const id=CalculatorLessonLinks.skillId(row.id);
    if(!id)return null;
    const family=caseLabel(row.family);
    const title=launch[id]?.title||row.title;
    const scopeNote=launch[id]?.scopeNote||'';
    const simulator=safeRoute(staged.skills?.[id]?.path);
    return title?{id,family,title,scopeNote,href:simulator||CalculatorLessonLinks.lessonHref(id)}:null;
  }).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id));
  const companionRows=rows.flatMap(parent=>(staged.companions?.[parent.id]??[]).flatMap(c=>{
    const href=safeRoute(c.path),part=href&&scope?.companions?.[href];
    if(!part||part.parent!==parent.id)return [];
    return [{id:parent.id,href,title:part.title,family:parent.family,scopeNote:part.note||'',companion:true,
      tag:part.keywords||companionTitles[href.split('/')[0]]||'',direct:part.direct}];
  }));
  const foundations=Object.entries(scope?.foundations??{}).flatMap(([route,row])=>{
    const href=safeRoute(route);
    return href?[{id:row.id,href,title:row.title,family:row.family,scopeNote:row.note,
      companion:true,direct:row.direct}]:[];
  });
  function rowsFor(id){
    const primary=rows.flatMap(r=>{
      const entry=scope?.skills?.[r.id], limited=entry?.scoped?.[id];
      if(!entry?.direct?.includes(id)&&!limited)return [];
      return [{...r,title:limited?.title||r.title,scopeNote:limited?.note||r.scopeNote,limited}];
    });
    const curriculum=[...primary,...companionRows.filter(c=>c.direct.includes(id))];
    curriculum.sort((a,b)=>a.id.localeCompare(b.id)||Number(!!a.companion)-Number(!!b.companion));
    return [...foundations.filter(c=>c.direct.includes(id)),...curriculum];
  }
  function withCourse(href,id,params={}){
    const url=new URL(href,document.baseURI);
    url.searchParams.set('course',id);
    for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
    return url.href;
  }
  function topicsFor(list){
    const names=[...new Set(list.map(r=>r.family).filter(Boolean))],prev=topic.value;
    topic.replaceChildren(el('option','All topics'),...names.map(n=>el('option',n)));
    topic.options[0].value='';
    if(names.includes(prev))topic.value=prev;
  }
  const layoutButtons=[...document.querySelectorAll('.skills-shell .vt button')];
  const viewKey='qb-calculator-skills-view';
  const validView=v=>v==='grid'||v==='list';
  let saved;
  try{saved=localStorage.getItem(viewKey);}catch{}
  const fromUrl=new URLSearchParams(location.search).get('view');
  let view=validView(fromUrl)?fromUrl:validView(saved)?saved:'grid';
  function applyView(persist=false){
    results.dataset.view=view;
    layoutButtons.forEach(button=>{
      const active=button.dataset.view===view;
      button.classList.toggle('on',active);button.setAttribute('aria-pressed',String(active));
    });
    if(persist){
      try{localStorage.setItem(viewKey,view);}catch{}
      const url=new URL(location.href);
      url.searchParams.set('view',view);
      history.replaceState(history.state,'',url);
    }
  }
  layoutButtons.forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;applyView(true);}));
  applyView();
  const sheet=document.getElementById('skills-filters'),toggle=document.getElementById('skills-filter-toggle'),
        close=document.getElementById('filters-done'),main=results.closest('main'),
        compact=matchMedia('(max-width:860px)');
  function setFilters(open,restore=false){
    open=compact.matches&&open;
    document.body.classList.toggle('sheet-open',open);
    toggle.setAttribute('aria-expanded',String(open));
    main.inert=open;sheet.inert=compact.matches&&!open;
    if(open){sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');close.focus({preventScroll:true});}
    else{sheet.removeAttribute('role');sheet.removeAttribute('aria-modal');if(restore&&compact.matches)toggle.focus();}
  }
  toggle.addEventListener('click',()=>setFilters(true));
  close.addEventListener('click',()=>setFilters(false,true));
  document.getElementById('skills-scrim').addEventListener('click',()=>setFilters(false,true));
  compact.addEventListener('change',()=>setFilters(false));setFilters(false);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.body.classList.contains('sheet-open')){e.preventDefault();setFilters(false,true);}
    if(e.key==='/'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.target.closest('input,textarea,select,[contenteditable]')){
      e.preventDefault();if(compact.matches)setFilters(true);search.focus();
    }
    if(e.key==='Tab'&&document.body.classList.contains('sheet-open')){
      if(e.shiftKey&&e.target===search){e.preventDefault();close.focus();}
      else if(!e.shiftKey&&e.target===close){e.preventDefault();search.focus();}
    }
  });

  function makeRow(r,id){
    const card=el('article',null,'card catalog-entry');
    card.dataset.skill=r.id;
    card.dataset.catalogueKind=r.companion?'companion':'skill';
    const record=el('div',null,'cb'),title=el('h2'),link=el('a',r.title);
    link.href=withCourse(r.href,id,r.limited?.params);title.append(link);record.append(title);
    if(r.scopeNote)record.append(el('p',r.scopeNote,'catalog-scope'));
    card.append(record);
    return card;
  }
  let selected='',visible=[];
  function render(){
    const bits=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const found=visible.filter(r=>(!topic.value||topic.value===r.family)&&bits.every(b=>[r.id,r.family,r.title,r.scopeNote,r.tag].join(' ').toLowerCase().includes(b)));
    results.replaceChildren(...found.map(r=>makeRow(r,selected)));
    if(!found.length){
      const empty=el('p',scope&&selected?'No matches for this course. Try another search or topic.':'The skill library didn’t load.','hint');
      empty.setAttribute('role','status');results.append(empty);
    }
    toggle.textContent=search.value.trim()||topic.value?'Filters · active':'Filters';
  }
  function change(id){selected=id;visible=rowsFor(id);topicsFor(visible);render();}
  search.addEventListener('input',render);
  topic.addEventListener('change',render);
  course?.onChange(change);
  change(course?.get()||'');
})();
