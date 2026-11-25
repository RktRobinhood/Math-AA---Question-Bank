(function (host) {
  'use strict';
  // Only local known routes and this small registry can become outbound Try links.
  const registered=Object.freeze({CT06:'solve/',CT12:'./',CT38:'binomial/'});
  const skillId=code=>{
    const id=String(code ?? '').toUpperCase();
    return /^CT(?:0[1-9]|[1-5][0-9])$/.test(id)?id:null;
  };
  const isDedicated=id=>Object.hasOwn(registered,id);
  // Local extractions need explicit index files; hosted links keep compact paths.
  const route=id=>registered[id]+(host.location?.protocol==='file:'?'index.html':'');
  function lessonHref(code) {
    const id=skillId(code);
    return id?(isDedicated(id)?route(id):'lesson.html?id='+id):null;
  }
  const fixtureQueries=Object.freeze({CT06:'?mode=try&example=demo',CT12:'?mode=try&example=demo',CT38:'?case=binomial-demo&mode=try'});
  function tryHref(code, example='demo') {
    const id=skillId(code);
    if(!id || !isDedicated(id) || example!=='demo')return null;
    return route(id)+fixtureQueries[id];
  }
  host.CalculatorLessonLinks=Object.freeze({skillId,isDedicated,lessonHref,tryHref});
})(typeof window==='undefined'?globalThis:window);
