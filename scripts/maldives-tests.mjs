import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
export function unitTests(){
 const storage=new Map(),document={addEventListener(){}};
 const c=vm.createContext({console,Intl,Date,crypto:globalThis.crypto,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{},setTimeout});
 for(const f of ['js/data.js','js/airports.js','js/maldives.js'])vm.runInContext(readFileSync(new URL(f,root),'utf8'),c);
 assert.equal(c.TTX_MV.time(new Date('2026-10-21T20:30:00Z')),'01:30 MVT');
 assert.equal(c.TTX_MV.date(new Date('2026-10-21T20:30:00Z')),'22/10/2026');
 for(const ap of c.TTX_AIRPORTS){const units=c.TTX_MV.defaults(ap);assert.equal(units.filter(r=>r.key==='boats').length,ap.local.boats);assert(units.every(r=>r.status==='unavailable'&&!r.confirmed));}
 assert.match(c.TTX_MV.estimate({asset:'missing',patients:6}),/unconfirmed/);
 storage.set('ttx-resource-tracker',JSON.stringify([{id:'sea',key:'boats',status:'deployed',confirmed:true,stretchers:2,escort:'Clinical team',mobilisation:10,travel:20,turnaround:30}]));
 assert.match(c.TTX_MV.estimate({asset:'sea',patients:6}),/3 trip\(s\); last arrival ≈ 130 min/);
 assert.equal(c.TTX_MV.counts().boats,1);
 assert(!/media helicopter/i.test(readFileSync(new URL('js/data.js',root),'utf8')));
 const added=['VRBK','VRDA','VREI','VRAH','VRCF','VRGD'];
 for(const id of added){const ap=c.TTX_AIRPORTS.find(a=>a.id===id);assert(ap,'Missing airport '+id);assert.equal(ap.features.seaplane,false);assert(ap.sources.length);for(const end of ap.runways[0].ends){const ctx=c.TTX_SITE.context({airport:id,runway:ap.runways[0].id,end});assert(c.TTX_SITE.mapSvg(ctx,{}).svg.includes(id));for(const scenario of c.TTX_DATA.scenarios){if(c.TTX_SITE.isApplicable(scenario,ctx)){const resolved=c.TTX_SITE.resolveScenario(scenario,ctx);assert.equal(resolved.airportId,id);assert(!resolved.injects.some(t=>/\{[A-Z_]+\}/.test(t)));}}}}
 for(const ap of c.TTX_AIRPORTS){assert.equal(ap.mndf.response,'Nearest MNDF post responds.');assert(!('supportEta' in ap.mndf));assert(!/MNDF[^.]*[0-9]+\s*(min|hour)/i.test(JSON.stringify(ap)));}
 assert.equal(c.TTX_PUBLIC_SERVICES.seaAmbulances.filter(b=>b.kind==='Atoll capital').length,20);
 assert(c.TTX_PUBLIC_SERVICES.seaAmbulances.some(b=>b.island==='Hoarafushi'&&b.atollCode==='HA'));
 assert(c.TTX_PUBLIC_SERVICES.seaAmbulances.some(b=>b.island==='Makunudhoo'&&b.atollCode==='HDh'));
 assert(c.TTX_AIRPORTS.find(a=>a.id==='VRMH').mndf.locations.includes('Hanimaadhoo'));
 assert(c.TTX_PUBLIC_SERVICES.mndfLocations.some(m=>m.island==='Kadhdhoo'));
 assert.equal(c.TTX_AIRPORTS.find(a=>a.id==='VRCF').runways[0].id,'01/19');
 console.log('Maldives unit checks passed: MVT date rollover, airport rosters, capability, transfer cycles, commitments, media references.');
}
export async function browserTests({behavior,newAppPage,assert}){
 await behavior('six northern airport profiles and existing Hanimaadhoo agency migration',async()=>{
  const {ctx,p}=await newAppPage();
  await p.waitForSelector('#islandResponseBtn');
  for(const id of ['VRBK','VRDA','VREI','VRAH','VRCF','VRGD']){
   await Promise.all([p.waitForEvent('load'),p.selectOption('#airportSelect',id)]);await p.waitForSelector('#islandResponseBtn');
   const info=await p.evaluate(()=>({ap:TTX_SITE.context().airport,map:document.getElementById('mapBase').textContent,profile:document.getElementById('airportProfile').textContent}));
   assert(info.map.includes(id),'map missing '+id);assert(info.profile.includes(info.ap.mndf.response),'MNDF origin missing '+id);assert(info.profile.includes('Equipment inventory not yet confirmed'),'unknown inventory presented as equipment absence');
   await p.selectOption('#scenarioSelect','atr72-crash');assert((await p.textContent('#scenarioPanel')).includes(info.ap.short),'scenario did not adapt '+id);
   await p.click('#islandResponseBtn');await p.click('[data-tab="agencies"]');assert((await p.textContent('#mvBody')).includes('nearest post responds'),'agency list missing generic response '+id);await p.click('#mvClose');
  }
  await p.evaluate(()=>{localStorage.setItem('ttx-mv-session-data:VRMH:old',JSON.stringify({'ttx-resource-tracker':JSON.stringify([{id:'military',name:'MNDF unit',type:'Military',owner:'MNDF',mobilisation:35}])}));localStorage.setItem('ttx-airport',JSON.stringify({airport:'VRMH',runway:'03/21',end:'03'}));localStorage.setItem('ttx-mv-ops:VRMH:initial',JSON.stringify({transfers:[],hospitals:[],facts:[],landmarks:[],settings:{},agencies:[{name:'MNDF Northern Area — Coast Guard, Fire & Rescue (Kulhudhuffushi)',role:'Existing exercise assignment',status:'Acknowledged',eta:'',primary:'Existing channel',fallback:'',initiator:''}]}));});
  await p.reload({waitUntil:'load'});await p.waitForSelector('#islandResponseBtn');await p.click('#islandResponseBtn');await p.click('[data-tab="agencies"]');
  const text=await p.textContent('#mvBody');assert(text.includes('nearest post responds'),'generic military response missing');assert(!text.includes('35–40')&&!text.includes('Existing exercise assignment')&&!text.includes('Existing channel'),'military response details remain');await p.click('[data-tab="services"]');const directory=await p.textContent('#mvBody');for(const location of ['Hanimaadhoo','Kulhudhuffushi','Maafaru','Maafilaafushi','Kadhdhoo','Gan','Vilimalé','Hoarafushi','Makunudhoo'])assert(directory.includes(location),'missing public location '+location);assert(!directory.includes('35–40'),'response timing shown in public directory');
  assert(!(await p.evaluate(()=>localStorage.getItem('ttx-mv-session-data:VRMH:old'))).includes('mobilisation'),'archived military timing survived');assert(p.errors.length===0,p.errors.join('; '));await ctx.close();
 });
 await behavior('island response: capacities, stages, assets, exports and sessions',async()=>{
  const {ctx,p}=await newAppPage();
  await p.waitForSelector('#islandResponseBtn');
  await p.click('#islandResponseBtn');
  await p.click('[data-tab="hospitals"]');await p.click('[data-edit="0"]');
  await p.fill('#mvForm [name="capacity"]','6');await p.selectOption('#mvForm [name="accepted"]','Yes');await p.click('#mvForm button[type="submit"]');
  await p.click('[data-tab="assets"]');await p.click('[data-edit="0"]');
  await p.fill('#mvForm [name="name"]','Medical boat <img src=x>');await p.selectOption('#mvForm [name="key"]','boats');await p.selectOption('#mvForm [name="capability"]','Sea ambulance');
  await p.selectOption('#mvForm [name="confirmed"]','Yes');await p.selectOption('#mvForm [name="status"]','available');await p.fill('#mvForm [name="stretchers"]','2');await p.fill('#mvForm [name="escort"]','Clinical team');await p.fill('#mvForm [name="travel"]','20');await p.click('#mvForm button[type="submit"]');
  assert(await p.locator('#mvBody img').count()===0,'asset name injected HTML');
  await p.click('[data-tab="transport"]');await p.fill('#mvForm [name="patient"]','RED-01');await p.fill('#mvForm [name="patients"]','2');await p.fill('#mvForm [name="embark"]','Airport jetty');await p.fill('#mvForm [name="disembark"]','Receiving jetty');await p.fill('#mvForm [name="alternative"]','Alternate jetty');
  await p.selectOption('#mvForm [name="status"]','Departed');await p.click('#mvForm button[type="submit"]');assert((await p.textContent('#mvMessage')).includes('sequence'),'skipping transfer stages allowed');
  await p.selectOption('#mvForm [name="status"]','Accepted');await p.click('#mvForm button[type="submit"]');
  await p.click('[data-edit="0"]');await p.selectOption('#mvForm [name="status"]','Boarding');await p.click('#mvForm button[type="submit"]');assert((await p.textContent('#mvMessage'))==='Saved.','valid medical transfer failed');
  const record=await p.evaluate(()=>TTX_MV.data());assert(record.operations.transfers[0].history.length===2,'transfer audit history missing');
  await p.click('[data-tab="verification"]');assert((await p.locator('#mvBody tbody tr').count())>0,'default verification facts absent');
  await p.click('[data-tab="settings"]');await p.fill('#mvSettings [name="name"]','Atoll response exercise');await p.click('#mvSettings button');
  await p.click('#mvClose');await p.click('#icsBtn');assert((await p.textContent('#icsContent')).includes('RED-01'),'ICS export missing transfer plan');await p.click('#closeIcsModal');
  await p.evaluate(()=>localStorage.setItem('ttx-timeline-events',JSON.stringify([{time:'10:00 MVT',text:'Velana only',category:'info'}])));
  await Promise.all([p.waitForEvent('load'),p.selectOption('#airportSelect','VRMD')]);await p.waitForSelector('#islandResponseBtn');
  assert(await p.evaluate(()=>localStorage.getItem('ttx-timeline-events'))===null,'new airport inherited timeline');
  assert((await p.evaluate(()=>TTX_MV.data().resources.filter(r=>r.key==='boats').length))===2,'airport boat roster did not change');
  await Promise.all([p.waitForEvent('load'),p.selectOption('#airportSelect','VRMM')]);await p.waitForSelector('#islandResponseBtn');
  assert((await p.evaluate(()=>localStorage.getItem('ttx-timeline-events'))).includes('Velana only'),'previous airport timeline lost');
  assert((await p.evaluate(()=>TTX_MV.data().operations.transfers[0].patient))==='RED-01','transfer plan lost across airport switch');
  assert(p.errors.length===0,p.errors.join('; '));await ctx.close();
 });
}
export async function workerTests(){
 const listeners={};
 const cached=new Response('<html>Offline exercise shell</html>',{headers:{'Content-Type':'text/html'}});
 Object.defineProperty(cached,'redirected',{value:true});
 const context=vm.createContext({Response,URL,Promise,self:{addEventListener:(n,cb)=>listeners[n]=cb,location:{origin:'https://airport.example'},clients:{claim(){}}},caches:{match:async()=>cached},fetch:async()=>{throw new Error('offline');}});
 vm.runInContext(readFileSync(new URL('sw.js',root),'utf8'),context);
 let result;listeners.fetch({request:{method:'GET',mode:'navigate',url:'https://airport.example/'},respondWith:p=>result=p});
 const response=await result;assert.equal(response.status,200);assert.equal(response.redirected,false);assert.match(await response.text(),/Offline exercise shell/);
 console.log('Service-worker regression passed: redirected Pages shell is normalised for offline navigation.');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){unitTests();await workerTests();}
