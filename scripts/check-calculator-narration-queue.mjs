/* End-to-end negative gates for the Claude/Paperclip queue. Never mutate a checkout. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),"calculator-audio-queue-"));
const run=()=>{
 const p=spawnSync(process.execPath,[path.join(fixture,"scripts/check-calculator-narration.mjs"),"--audit"],{encoding:"utf8"});
 assert.equal(p.stderr,"");
 return {exit:p.status,...JSON.parse(p.stdout)};
};
const local=name=>path.join(fixture,name);
const checkRepair=(id,status,reason)=>{
 const audit=run();
 assert.equal(audit.exit,1);
 const row=audit.attention.find(r=>r.id===id);
 assert.equal(row?.status,status);assert.equal(row?.action,"repair");assert.match(row?.reason,reason);
 assert(!audit.generationQueue.some(r=>r.id===id));
};
const mutate=(name,replacement,check)=>{
 const f=local(name),original=fs.readFileSync(f);
 try{fs.writeFileSync(f,replacement(original));check();}
 finally{fs.writeFileSync(f,original);}
};
try{
 fs.mkdirSync(local("scripts"));
 fs.copyFileSync(path.join(root,"scripts/check-calculator-narration.mjs"),local("scripts/check-calculator-narration.mjs"));
 fs.cpSync(path.join(root,"calculator-skills"),local("calculator-skills"),{recursive:true});
 const baseline=run();
 assert.equal(baseline.exit,0);
 assert.equal(baseline.summary.routes,baseline.routes.length);
 assert.equal(new Set(baseline.routes.map(r=>r.id)).size,baseline.routes.length);
 assert.equal(new Set(baseline.routes.map(r=>r.route)).size,baseline.routes.length);
 assert.equal(baseline.summary.sharedPlayer,baseline.routes.filter(r=>r.player==="shared-watch").length);
 assert.deepEqual(baseline.generationQueue,baseline.routes.filter(r=>r.action==="generate"));
 assert(baseline.generationQueue.every(r=>r.status==="missing"&&r.player==="shared-watch"&&r.contract==="shared-watch-definition"));

 const preserved=baseline.routes.find(r=>r.contract==="already-wired-preserve");
 assert(preserved?.audio);
 const original=local(preserved.audio),aside=original+".approved";
 fs.renameSync(original,aside);
 try{
  checkRepair(preserved.id,"missing",/Missing established audio/);
  fs.writeFileSync(original,"not the approved bytes");
  checkRepair(preserved.id,"stale",/recording bytes/);
 }finally{
  fs.rmSync(original,{force:true});fs.renameSync(aside,original);
 }
 if(preserved.player==="legacy-watch")mutate(preserved.route,bytes=>String(bytes).replace(/(<audio\b[^>]*\bsrc=")[^"]+"/i,'$1invalid.mp3"'),
  ()=>checkRepair(preserved.id,"stale",/original audio tag binding/));

 const native=baseline.routes.find(r=>r.contract==="shared-watch-definition");
 assert(native);
 // If the queue is already empty, turn one signed template into a draft in the fixture only.
 const definition=JSON.parse(fs.readFileSync(local(native.attachment),"utf8"));
 if (definition.recording){
  delete definition.recording;
  fs.writeFileSync(local(native.attachment),JSON.stringify(definition));
  fs.rmSync(local(native.audio));
 }
 assert(run().generationQueue.some(r=>r.id===native.id));
 fs.copyFileSync(original,local(native.audio));
 try{checkRepair(native.id,"stale",/unexpected loose recording/);}
 finally{fs.rmSync(local(native.audio));}
 mutate(native.script,bytes=>String(bytes)+"unapproved line\n",
  ()=>checkRepair(native.id,"stale",/exact handoff digest/));
 const attached={...definition,recording:{file:path.basename(native.audio),audioSha256:"0".repeat(64),scriptSha256:native.scriptSha256}};
 mutate(native.attachment,()=>JSON.stringify(attached),
  ()=>checkRepair(native.id,"missing",/Missing established audio/));
 assert(run().generationQueue.some(r=>r.id===native.id));
 console.log("Calculator audio queue: complete distinct routes; only verified template drafts can generate; missing signed files, changed scripts, wrong bindings and loose MP3s require review.");
}finally{fs.rmSync(fixture,{recursive:true,force:true});}
