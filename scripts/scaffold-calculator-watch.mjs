/* One route shell for new Calculator Skills explainers. Never overwrite. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {validate}=require('../calculator-skills/handheld/watch-lesson.js');

const [slug,definition,adapter,outDirectory] = process.argv.slice(2);
if(!/^[a-z][a-z0-9-]{2,47}$/.test(slug||'')||!definition||!adapter){
 console.error('Usage: node scripts/scaffold-calculator-watch.mjs <slug> <definition.json> <adapter.js> [calculator-skills directory]');
 process.exit(2);
}
const base=outDirectory?path.resolve(outDirectory):fileURLToPath(new URL('../calculator-skills/',import.meta.url));
const to=path.join(base,slug), spec=JSON.parse(fs.readFileSync(definition,'utf8')), code=fs.readFileSync(adapter,'utf8');
validate(spec);
if(!code.includes('CalculatorLessonAdapter'))throw new Error('The adapter must provide window.CalculatorLessonAdapter.');
const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Calculator Skills | IB Math Question Bank</title>
<link rel="stylesheet" href="../../assets/css/styles.css?v=theme-3">
<link rel="stylesheet" href="../../assets/css/calculator-integration.css?v=beta-fit-2">
<link rel="stylesheet" href="../handheld/shell.css">
<link rel="stylesheet" href="../handheld/watch-chapters.css?v=1">
<link rel="stylesheet" href="../handheld/watch-lesson.css?v=mode-bridge-1">
<script src="../../assets/js/courses.js" defer></script>
<script src="../../assets/js/course.js" defer></script>
<script src="../../assets/js/shell.js?v=nav-4" defer></script>
<script src="../../assets/js/basket.js" defer></script>
<script src="../../assets/js/generate.js" defer></script>
<script src="../handheld/shell.js" defer></script>
<script src="../handheld/watch-handset.js?v=1" defer></script>
<script src="../handheld/freecalc.js" defer></script>
<script src="../handheld/watch-player.js?v=solve-player-2" defer></script>
<script src="../handheld/hold-timeline.js?v=1" defer></script>
<script src="../handheld/watch-chapters.js?v=1" defer></script>
<script src="../handheld/watch-lesson.js?v=mode-bridge-1" defer></script>
<script src="adapter.js" defer></script>
<script src="../handheld/watch-bootstrap.js?v=1" defer></script>
</head>
<body data-base="../../" data-nav="calculator-skills">
<main data-calculator-watch>Loading lesson…</main>
</body>
</html>
`;
fs.mkdirSync(to);
try{
 for(const [file,data] of [['index.html',html],['definition.json',JSON.stringify(spec,null,2)+'\n'],['adapter.js',code]])
  fs.writeFileSync(path.join(to,file),data,{flag:'wx'});
}catch(err){fs.rmSync(to,{recursive:true,force:true});throw err;}
console.log('Created '+to+' using the shared Watch template.');
