import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import vm from "node:vm";
const root=new URL("../calculator-skills/",import.meta.url), handoff=new URL("paperclip-audio/",root);
const require=createRequire(import.meta.url);
const {decode,requiredPoints}=require("../calculator-skills/paperclip-audio/recorded-watch.js");
const load=url=>JSON.parse(fs.readFileSync(url,"utf8"));
const at=(base,file)=>new URL(file,base);
const hash=b=>createHash("sha256").update(b).digest("hex");
const manifest=load(at(handoff,"manifest.json"));
const lessons=[...Object.values(manifest.lessons),...manifest.supplements];
assert.equal(lessons.length,61);
const config=(card,cue)=>({id:card.id,duration:cue.watch.sliderEndAtExtractionMs,transcript:card.transcriptSha256,cue:card.cueMapSha256});
if(process.argv[2]==="--draft"){
 const card=lessons.find(x=>x.id===process.argv[3]&&x.integrationStatus==="shared-measured-json");
 if(!card)throw new Error("Choose an existing lesson with the shared-measured-json adapter.");
 const cue=load(at(handoff,card.cueMap));
 console.log(JSON.stringify({version:1,lesson:card.id,status:"draft-not-measured",audio:"narration.mp3",audioSha256:null,durationMs:null,
  transcriptSha256:card.transcriptSha256,cueMapSha256:card.cueMapSha256,
  anchors:requiredPoints(cue).map(editorialMs=>({editorialMs,audioMs:null})),
  captions:cue.spokenCues.map(c=>({id:c.id,startMs:null,endMs:null}))},null,2));
 process.exit(0);
}
const decodeAudio=process.argv.includes("--decode-audio");
const args=process.argv.slice(2), json=args.includes("--queue")||args.includes("--audit");
assert(args.every(a=>["--decode-audio","--queue","--audit"].includes(a))&&!(args.includes("--queue")&&args.includes("--audit")),
 "Use --queue or --audit, optionally with --decode-audio.");
const repo=new URL("../",import.meta.url);
const printable=url=>path.relative(fileURLToPath(repo),fileURLToPath(url)).split(path.sep).join("/");
const entries=[];
const missing=(row,reason,action="repair")=>Object.assign(row,{status:"missing",action,reason});
function matched(row){return Object.assign(row,{status:"matched",action:"preserve"});}
function record(row,check){
 try{check();}
 catch(error){
  row.status=error.name==="MissingRecording"?"missing":"stale";
  row.action="repair";
  row.reason=error.message.replaceAll(fileURLToPath(repo),"").split("\n")[0];
 }
 entries.push(row);
}
function requireRecording(url){
 if(fs.existsSync(url))return;
 const error=new Error("Missing established audio: "+printable(url));
 error.name="MissingRecording";throw error;
}
function verifyBytes(url,expected,id){
 requireRecording(url);
 assert.equal(hash(fs.readFileSync(url)),expected,id+" recording bytes");
}
function player(row,html){
 row.player=html.includes("watch-bootstrap.js?")&&html.includes("data-calculator-watch")
  &&html.includes("watch-lesson.js?")?"shared-watch":"legacy-watch";
}
const probe=f=>{
 const duration=Number(execFileSync("ffprobe",["-v","error","-show_entries","format=duration","-of","csv=p=0",f],{encoding:"utf8"}));
 execFileSync("ffmpeg",["-v","error","-i",f,"-f","null","-"]);
 return duration;
};
// Native players (CT37, CT39 to CT42) read their own measured manifest. Run each route's own
// decoder on it, exactly as the page does, so a recording only counts if that page would accept it.
const routeScripts={
 CT37:{files:["key-tape.js","watch-media.js"],decode:(w,t)=>w.BinomialPdfMedia.decode(t,w.BinomialPdfTape),
  actual:(w,r,d)=>w.BinomialPdfMedia.decodedTimeline(r,d)},
 CT40:{files:["narration.js","watch-media.js"],decode:(w,t)=>w.InverseNormalMedia.decode(t,w.InverseNormalMedia.compose(w.InverseNormalRehearsal)),
  actual:(w,r,d)=>w.InverseNormalMedia.decodedTimeline(r,d)},
 CT41:{files:["narration.js","watch-media.js"],decode:(w,t)=>w.NormalParameterMedia.decode(t,w.NormalNarration),
  actual:(w,r,d)=>w.NormalParameterMedia.decodedTimeline(r,d)},
 CT42:{files:["key-tape.js","watch-media.js"],decode:(w,t)=>w.CT42Media.decode(t,w.CT42Tape),actual:(w,r,d)=>w.CT42Media.actual(r,d)}
};
function sandbox(route,files){
 const box={};box.window=box;box.globalThis=box;vm.createContext(box);
 for(const f of files)vm.runInContext(fs.readFileSync(at(route,f),"utf8"),box,{filename:f});
 return box;
}
function checkNative(x,cue,route,html){
 const ad=cue.nativeMediaAdapter;
 if(x.id==="CT39"){
  const box=sandbox(route,[path.basename(ad.file)]);
  if(box.NormalMeasuredCues===undefined)return false;
  const voice=require("../calculator-skills/normal/voice-profile.js");
  const profile=voice.validate(JSON.parse(JSON.stringify(box.NormalMeasuredCues)));
  const media=at(route,profile.file);
  verifyBytes(media,profile.sha256,x.id);
  if(decodeAudio)assert(voice.mediaDurationMatches(profile,probe(decodeURIComponent(media.pathname))),x.id+" audio duration");
  return true;
 }
 const id=ad.elementId??ad.inlineManifestId, m=html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`));
 if(!m){assert(!html.includes(`id="${id}"`),x.id+" manifest tag must be inert application/json");return false;}
 assert(!m[1].includes("<"),x.id+" inline manifest must escape <");
 const spec=routeScripts[x.id], w=sandbox(route,spec.files), recording=spec.decode(w,m[1]);
 assert(recording,x.id+" measured manifest rejected by the route's own decoder");
 const pkg=JSON.parse(m[1]), media=at(route,pkg.audio);
 verifyBytes(media,pkg.audioSha256,x.id);
 const duration=decodeAudio?probe(decodeURIComponent(media.pathname)):pkg.durationMs/1000;
 assert(spec.actual(w,recording,duration),x.id+" audio duration");
 return true;
}
const template=require("../calculator-skills/handheld/watch-lesson.js");
const counts={preserved:0,native:0,nativeRecorded:0,sharedAwaiting:0,sharedRecorded:0};
const seen=new Set();
for(const x of lessons){
 assert(!seen.has(x.id),x.id);seen.add(x.id);
 const route=at(root,x.route), transcript=at(handoff,x.transcript), cueMap=at(handoff,x.cueMap);
 const attachment=x.existingAudio?route:at(root,x.nativeMediaAdapter?.syncDestination??x.route);
 const audio=x.existingAudio?at(root,x.existingAudio.src):at(root,x.nativeMediaAdapter?.audioDestination??new URL("narration.mp3",route).href);
 const row={id:x.id,title:x.title,route:printable(route),script:printable(transcript),scriptSha256:x.transcriptSha256,
  attachment:printable(attachment),audio:printable(audio),contract:x.integrationStatus,player:"unknown"};
 record(row,()=>{
 const html=fs.readFileSync(route,"utf8");player(row,html);
 const nt=fs.readFileSync(at(handoff,x.transcript)), nc=fs.readFileSync(at(handoff,x.cueMap));
 assert.equal(hash(nt),x.transcriptSha256,x.id+" transcript hash");
 assert.equal(hash(nc),x.cueMapSha256,x.id+" cue map hash");
 const cue=JSON.parse(nc);
 if(cue.nativeMediaAdapter?.file)row.attachment=printable(at(root,cue.nativeMediaAdapter.file));
 assert.equal(cue.id,x.id);
 assert.deepEqual(nt.toString().trim().split(/\r?\n/),cue.spokenCues.map(q=>q.text),x.id+" exact spoken script lines");
 if(x.integrationStatus==="already-wired-preserve"){
   counts.preserved++;
   if(row.player==="shared-watch"){
    const definition=at(route,"definition.json"),spec=load(definition);
    template.validate(spec);assert.equal(spec.id,x.id);
    assert.equal(at(definition,spec.recording?.file??"").href,audio.href,x.id+" original recording route");
    assert.equal(spec.recording?.audioSha256,x.existingAudio.sha256,x.id+" original recording digest");
    row.attachment=printable(definition);
   }else{
    const source=html.match(/<audio\b[^>]*\bsrc="([^"]+)"/i)?.[1];
    assert(source&&at(route,source).href===audio.href,x.id+" original audio tag binding");
   }
   verifyBytes(audio,x.existingAudio.sha256,x.id);
   if(decodeAudio)assert(Math.abs(probe(fileURLToPath(audio))*1000-x.existingAudio.streamDurationMs)<=125,x.id+" original audio duration");
   return matched(row);
 }
 if(x.integrationStatus!=="shared-measured-json"){
   assert(["inline-json","strict-json-assignment"].includes(x.integrationStatus),x.id+" missing narration adapter");
   counts.native++;
   if(checkNative(x,cue,route,html)){counts.nativeRecorded++;return matched(row);}
   assert(!fs.existsSync(audio),x.id+" unexpected audio with no valid measured attachment");
   return missing(row,"No valid measured native attachment; review the legacy handoff before repair.");
 }
 const sharedTemplate=row.player==="shared-watch";
 if(sharedTemplate)row.attachment=printable(at(route,"definition.json"));
 if(!sharedTemplate)for(const p of [`data-lesson="${x.id}"`,`data-transcript-sha="${x.transcriptSha256}"`,`data-cue-sha="${x.cueMapSha256}"`])assert(html.includes(p),x.id+" route binding");
 if(sharedTemplate){
  const spec=load(at(route,"definition.json"));
  const sync=load(at(route,"narration.sync.json"));
  template.validate(spec);assert.equal(spec.id,x.id);
  assert.equal(hash(Buffer.from(spec.beats.map(b=>b.spoken).filter(Boolean).join("\n")+"\n")),x.transcriptSha256,x.id+" exact templated spoken script");
  assert.equal(spec.recording?.scriptSha256,x.transcriptSha256,x.id+" template script digest");
  assert.equal(spec.recording?.audioSha256,sync.audioSha256,x.id+" template audio digest");
  assert.equal(spec.recording?.file,sync.audio,x.id+" template audio route");
 }else if(x.id==="CT28"&&html.includes('src="watch-media.js?')){
  const media=html.indexOf('src="watch-media.js?'),lesson=html.indexOf('src="lesson.js');
  assert(media>=0&&lesson>media,x.id+" dedicated 1× transport script order");
  assert(fs.readFileSync(at(route,"lesson.js"),"utf8").includes("CT28Media.load("),x.id+" dedicated media binding");
  const loader=fs.readFileSync(at(route,"watch-media.js"),"utf8");
  for(const k of ["pack.audioSha256","cfg.transcriptSha","cfg.cueSha","pack.captions","pack.anchors"])assert(loader.includes(k),x.id+" signed media fields");
 }else{
  assert(html.indexOf("recorded-watch.js")<html.indexOf('src="lesson.js'),x.id+" script order");
  assert(fs.readFileSync(at(route,"lesson.js"),"utf8").includes("QBRecordedWatch?.bind("),x.id+" pause binding");
 }
 assert.equal(at(root,x.nativeMediaAdapter.syncDestination).href,at(route,"narration.sync.json").href,x.id);
 assert.equal(at(root,x.nativeMediaAdapter.audioDestination).href,at(route,"narration.mp3").href,x.id);
 const sync=load(at(route,"narration.sync.json"));
 if(sync.status==="awaiting-recording"){
  assert.deepEqual(sync,{version:1,lesson:x.id,status:"awaiting-recording"});
  counts.sharedAwaiting++;
  assert(!fs.existsSync(audio),x.id+" unexpected audio with an unmeasured attachment");
  return missing(row,"No reviewed measured legacy package; review the handoff before repair.");
 }
 assert(decode(sync,cue,config(x,cue)),x.id+" measured timing format");
 verifyBytes(at(route,sync.audio),sync.audioSha256,x.id);
 if(decodeAudio){
  const duration=probe(decodeURIComponent(at(route,sync.audio).pathname));
  assert(Number.isFinite(duration)&&Math.abs(1000*duration-sync.durationMs)<=120,x.id+" audio duration");
 }
 counts.sharedRecorded++;return matched(row);
 });
}

// Template-native authoring has a separate queue; the legacy manifest stays intact.
const templateQueue=at(handoff,"template-watch/manifest.json");
const fresh=load(templateQueue);
assert.equal(fresh.version,1);
let templateAwaiting=0,templateRecorded=0;
for(const item of fresh.lessons){
 assert(!seen.has(item.id),item.id);seen.add(item.id);
 const definition=at(templateQueue,item.definition), route=at(definition,"index.html");
 const transcript=at(templateQueue,item.transcript), dest=at(templateQueue,item.audioDestination);
 const row={id:item.id,route:printable(route),script:printable(transcript),scriptSha256:item.transcriptSha256,
  attachment:printable(definition),audio:printable(dest),contract:"shared-watch-definition",player:"unknown"};
 record(row,()=>{
  const html=fs.readFileSync(route,"utf8");player(row,html);
  assert.equal(row.player,"shared-watch",item.id+" template player binding");
  const spec=load(definition);assert.equal(spec.id,item.id);template.validate(spec);
  row.title=spec.title;
  const text=fs.readFileSync(transcript);
  assert.equal(hash(text),item.transcriptSha256,item.id+" exact handoff digest");
  assert.equal(text.toString(),spec.beats.filter(b=>b.spoken).map(b=>b.spoken).join("\n")+"\n",item.id+" exact template spoken lines");
  assert.equal(dest.href,at(definition,"narration.mp3").href,item.id+" audio destination");
  if(!spec.recording){
   assert(!fs.existsSync(dest),item.id+" unexpected loose recording: review it instead of generating");
   templateAwaiting++;return missing(row,"Verified signed script; no attached or loose MP3.","generate");
  }
  assert.equal(spec.recording.scriptSha256,item.transcriptSha256,item.id+" signed script");
  assert.equal(at(definition,spec.recording.file).href,dest.href,item.id+" signed recording path");
  verifyBytes(dest,spec.recording.audioSha256,item.id);
  if(decodeAudio)assert(Math.abs(probe(fileURLToPath(dest))-spec.beats.at(-1).end)<=.12,item.id+" template audio duration");
  templateRecorded++;return matched(row);
 });
}
assert.equal(entries.length,lessons.length+fresh.lessons.length);
assert.equal(new Set(entries.map(r=>r.route)).size,entries.length,"Audio queue routes must be unique.");
const summary={routes:entries.length,matched:0,missing:0,stale:0,generate:0,repair:0,sharedPlayer:0};
for(const row of entries){
 summary[row.status]++;
 if(row.action!=="preserve")summary[row.action]++;
 if(row.player==="shared-watch")summary.sharedPlayer++;
}
const generationQueue=entries.filter(row=>row.action==="generate"), attention=entries.filter(row=>row.action==="repair");
if(json)console.log(JSON.stringify({version:1,audioCheck:decodeAudio?"sha256-decode-duration":"sha256",
 summary,generationQueue,attention,...(args.includes("--audit")?{routes:entries}:{})},null,2));
else{
 console.log("Calculator narration: "+lessons.length+" legacy-manifest routes checked",counts);
 console.log("Template-native narration:",{templateAwaiting,templateRecorded});
 console.log("Combined:",summary);
 for(const row of attention)console.error(row.id+": "+row.reason);
}
if(attention.length)process.exitCode=1;
