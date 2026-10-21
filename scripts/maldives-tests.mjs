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
 console.log('Maldives unit checks passed: MVT date rollover, airport rosters, capability, transfer cycles, commitments, media references.');
}
export async function browserTests({behavior,newAppPage,assert}){
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
if(process.argv[1]===fileURLToPath(import.meta.url))unitTests();
