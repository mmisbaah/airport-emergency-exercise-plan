/* Build an independent static copy without dashboard data or source documents. */
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const source=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(process.argv[2]||resolve(source,'../output/hanimaadhoo-ttx'));
if(output===source)throw new Error('Choose a separate output directory.');
await mkdir(output,{recursive:true});
for(const name of ['ttx.html','ttx-display.html','js/ttx-scenario.js','js/ttx-runner.js','js/ttx-display.js','css/ttx.css','favicon.svg','_headers']){
  await mkdir(dirname(resolve(output,name)),{recursive:true});
  await copyFile(resolve(source,name),resolve(output,name));
}
const controller=(await readFile(resolve(source,'ttx.html'),'utf8')).replace('href="index.html">← Planning dashboard','href="https://airportemergency.mellowpilot.com/" target="_blank" rel="noopener">← Planning dashboard');
await writeFile(resolve(output,'index.html'),controller);
await writeFile(resolve(output,'ttx.html'),controller);
const shell=['./','./index.html','./ttx.html','./ttx-display.html','./css/ttx.css','./js/ttx-scenario.js','./js/ttx-runner.js','./js/ttx-display.js','./favicon.svg'];
let sw=await readFile(resolve(source,'sw.js'),'utf8');
sw=sw.replace(/var SHELL = \[.*?\];/s,'var SHELL = '+JSON.stringify(shell,null,2)+';');
// Separate cache namespace; source changes still inherit the dashboard version bump.
sw=sw.replace("'eop-shell-' + VERSION","'nr-shell-' + VERSION").replace("k.indexOf('eop-shell-')","k.indexOf('nr-shell-')");
await writeFile(resolve(output,'sw.js'),sw);
console.log('Independent static TTX app: '+output);
