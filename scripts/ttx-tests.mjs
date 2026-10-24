/* Critical exercise flows, called by the existing browser regression runner. */
import {readFile} from 'node:fs/promises';

export async function northernResponseTests({behavior,newAppPage,assert}) {
  const open = async () => {
    const {ctx,p}=await newAppPage();
    await p.goto(new URL('/ttx.html',p.url()).href);
    await p.waitForSelector('#nextBtn');
    return {ctx,p};
  };
  const section = (p,view) => p.click(`[data-view="${view}"]`);
  const release = async (p,count) => {for(let i=0;i<count;i++)await p.click('#nextBtn');};
  const state = p => p.evaluate(()=>JSON.parse(localStorage.getItem('nr-ttx-v1:'+JSON.parse(localStorage.getItem('nr-ttx-v1:active')))));

  await behavior('Northern Response: 16:00 call, 16:10 crash, 22 red of 110, manual release',async()=>{
    const {ctx,p}=await open();
    assert((await p.textContent('#clockValue'))==='16:00:00','clock must start at 16:00 MVT');
    assert((await state(p)).patients.length===110,'110 unique patient records required');
    await release(p,1);
    assert((await p.textContent('.current-event')).includes('Landing gear emergency'),'first inject not ATC emergency');
    await release(p,3);
    assert((await p.textContent('#clockValue'))==='16:10:00','crash time must be 16:10');
    assert((await p.textContent('.current-event')).includes('left engine catches fire'),'missing engine fire');
    await section(p,'casualties');
    assert((await p.textContent('#pageContent')).includes('Awaiting the medical assessment'),'patient register leaked before assessment');
    await section(p,'control');await release(p,3);
    await section(p,'casualties');
    assert(await p.locator('#patientRows tr').count()===110,'patient register total mismatch');
    const s=await state(p);
    assert(s.patients.filter(x=>x.category==='Red').length===22,'red allocation incorrect');
    assert(new Set(s.patients.map(x=>x.id)).size===110,'duplicate patient IDs');
    assert(s.released.length===7,'clock must never automatically release an inject');
    await section(p,'control');await p.selectOption('#speedSelect','10');await p.click('#playBtn');await p.click('#advanceBtn');await p.click('#resetExerciseBtn');await p.click('#confirmDialog button[value=confirm]');
    const reset=await state(p);assert(reset.elapsed===0&&!reset.running&&reset.speed===1,'reset must pause at 16:00 with 1x speed');
    assert(reset.released.length===0&&reset.patients.length===110&&reset.patients.every(x=>x.status==='Unlocated'),'exercise reset must clear injects and restore patients');
    assert(reset.decisions.length===0&&reset.resources.length===0&&reset.actions.length===0&&reset.commandTransfers.length===0,'exercise reset must clear run records');
    assert(reset.review.every(x=>x.score===-1&&x.evidence==='')&&reset.facilities.every(x=>x.status==='Not established'&&!x.owner&&!x.location),'exercise reset must clear assessments and facility records');
    assert(reset.id===s.id&&reset.name===s.name&&!reset.ended&&!reset.pausedForSafety,'exercise reset must restart the same session');
    await p.reload();assert((await p.textContent('#clockValue'))==='16:00:00','timer reset must persist across reload');
    assert(!p.errors.length,p.errors.join('; '));await ctx.close();
  });

  await behavior('Northern Response: projector receives released-only information and safety pause',async()=>{
    const {ctx,p}=await open();
    const display=await ctx.newPage();await display.goto(new URL('/ttx-display.html',p.url()).href);
    assert(!(await display.textContent('body')).includes('left engine catches fire'),'unreleased crash exposed');
    await release(p,1);
    await display.waitForSelector('.current-event');
    assert((await display.textContent('.current-event')).includes('Landing gear emergency'),'projector did not sync');
    assert(!(await display.textContent('body')).includes('Facilitator notes'),'controller notes exposed');
    const payload=await p.evaluate(()=>JSON.parse(localStorage.getItem('nr-ttx-v1:display')));
    assert(payload.released.length===1&&payload.casualties===null,'future material in payload');
    assert(!('expected' in payload.released[0]),'expected actions exposed');
    await p.click('#playBtn');await p.click('#noDuffBtn');
    const before=await state(p);assert(await p.locator('#nextBtn').isDisabled()&&await p.locator('#advanceBtn').isDisabled(),'NO DUFF controls must be disabled');
    const after=await state(p);assert(!after.running&&after.pausedForSafety,'NO DUFF must pause play');
    assert(after.released.length===before.released.length&&after.elapsed===before.elapsed,'NO DUFF allowed play to advance');
    await display.waitForFunction(()=>document.body.innerText.includes('NO DUFF · PLAY PAUSED'));
    await p.click('#resumeSafetyBtn');await p.click('#confirmDialog button[value=confirm]');
    assert(!(await state(p)).pausedForSafety,'EXCON resume did not clear safety pause');
    assert(!p.errors.length,p.errors.join('; '));await ctx.close();
  });

  await behavior('Northern Response: bulk patient updates and transfer acceptance guard',async()=>{
    const {ctx,p}=await open();await release(p,7);await section(p,'casualties');
    await p.selectOption('#categoryFilter','Red');await p.click('#selectFilteredBtn');await p.click('#bulkPatientBtn');
    await p.selectOption('#patientForm [name=status]','Treatment');await p.fill('#patientForm [name=location]','Exercise TA');
    await p.click('#patientForm button[type=submit], #patientForm button.primary');
    assert((await state(p)).patients.filter(x=>x.status==='Treatment').length===22,'bulk update did not update 22 red');
    await p.click('[data-patient=R01]');await p.selectOption('#patientForm [name=status]','In transfer');
    await p.fill('#patientForm [name=location]','Exercise loading area');
    await p.click('#patientForm button.primary');
    assert((await p.textContent('#patientError')).includes('Confirm receiving acceptance'),'unconfirmed transfer allowed');
    await p.fill('#patientForm [name=destination]','Simulated receiving hospital');await p.fill('#patientForm [name=transport]','Exercise ambulance A');await p.check('#patientForm [name=accepted]');await p.click('#patientForm button.primary');
    const s=await state(p);assert(s.patients.find(x=>x.id==='R01').status==='In transfer','confirmed movement not saved');
    assert(s.patients.filter(x=>x.category==='Red').length===22&&s.patients.length===110,'movement changed scenario totals');
    await ctx.close();
  });

  await behavior('Northern Response: resource confirmation, command transfer and facility validation',async()=>{
    const {ctx,p}=await open();await section(p,'resources');
    await p.fill('#resourceForm [name=capability]','Stretcher support');await p.fill('#resourceForm [name=owner]','Exercise logistics');await p.selectOption('#resourceForm [name=status]','Assigned');await p.click('#resourceForm button.primary');
    assert((await p.textContent('#resourceError')).includes('Confirm capability'),'assigned resource did not require confirmation');
    await p.check('#resourceForm [name=confirmed]');await p.click('#resourceForm button.primary');assert((await state(p)).resources.length===1,'resource not saved');
    await section(p,'coordination');
    assert((await p.textContent('#pageContent')).includes('designated Incident Commander takes over'),'HAQ command rule missing');
    const status=p.locator('[data-facility="0"][data-field=status]');await status.selectOption('Established');
    assert((await state(p)).facilities[0].status==='Not established','facility established without owner and location');
    await p.fill('[data-facility="0"][data-field=owner]','Exercise RVP coordinator');await p.fill('[data-facility="0"][data-field=location]','Validated exercise point');await p.locator('[data-facility="0"][data-field=location]').blur();await status.selectOption('Established');
    assert((await state(p)).facilities[0].status==='Established','facility record not saved');
    await p.fill('#transferCommandForm [name=from]','ARFF interim commander');await p.fill('#transferCommandForm [name=to]','Designated Incident Commander');await p.fill('#transferCommandForm [name=brief]','Face-to-face briefing: hazards, priorities, resources and outstanding tasks.');await p.check('#transferCommandForm [name=announced]');await p.click('#transferCommandForm button.primary');
    assert((await state(p)).commandTransfers.length===1,'command transfer not recorded');await ctx.close();
  });

  await behavior('Northern Response: decisions, evidence, AAR, JSON restore and session isolation',async()=>{
    const {ctx,p}=await open();await release(p,1);const initialId=(await state(p)).id;
    await section(p,'decisions');await p.fill('#decisionForm [name=text]','Activate responding agency internal notification.');await p.fill('#decisionForm [name=owner]','Duty officer');await p.fill('#decisionForm [name=action]','Confirm liaison and acknowledgement.');await p.click('#decisionForm button.primary');
    await section(p,'review');await p.selectOption('[data-score="0"]','2');await p.fill('[data-evidence="0"]','Acknowledgement recorded.');await p.locator('[data-evidence="0"]').blur();
    await p.fill('#actionForm [name=text]','Verify the fallback communications plan.');await p.fill('#actionForm [name=owner]','Communications lead');await p.fill('#actionForm [name=due]','2026-11-01');await p.click('#actionForm button.primary');
    await p.click('#exportBtn');
    const backupPromise=p.waitForEvent('download');await p.click('#backupBtn');const backup=await backupPromise;const backupText=await readFile(await backup.path(),'utf8');const parsed=JSON.parse(backupText);
    assert(parsed.session.decisions.length===1&&parsed.session.review[0].score===2,'backup incomplete');
    const reportPromise=p.waitForEvent('download');await p.click('#reportBtn');const report=await reportPromise;const html=await readFile(await report.path(),'utf8');assert(html.includes('Activate responding agency internal notification.')&&html.includes('Command transfers')&&html.includes('HAQ Airport Emergency Plan'),'AAR incomplete');
    await p.click('[data-close=exportDialog]');await section(p,'setup');await p.click('#newSessionBtn');await p.fill('#newSessionForm [name=name]','Second exercise');await p.click('#newSessionForm button.primary');
    assert((await state(p)).released.length===0&&(await state(p)).decisions.length===0,'new session inherited previous records');
    await section(p,'setup');await p.click(`[data-session="${initialId}"]`);assert((await state(p)).decisions.length===1,'original session lost');
    await p.setInputFiles('#importFile',{name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupText)});await p.waitForSelector('#confirmDialog[open]');await p.click('#confirmDialog button[value=confirm]');
    const restored=await state(p);assert(restored.id!==initialId&&restored.decisions.length===1&&!restored.running,'restore must create a separate paused session');
    assert(!p.errors.length,p.errors.join('; '));await ctx.close();
  });

  await behavior('Northern Response: malformed/XSS backup rejected and mobile layout stays within viewport',async()=>{
    const {ctx,p}=await open();const before=await state(p),bad=JSON.parse(JSON.stringify(before));bad.decisions.push({id:'"><img src=x onerror=alert(1)>',at:new Date().toISOString(),scenario:'16:00:00',text:'Bad record',owner:'x',action:'x',due:'',inject:'',status:'Open'});
    await p.setInputFiles('#importFile',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'northern-response-ttx',version:1,session:bad}))});
    await p.waitForFunction(()=>document.getElementById('toast').textContent.includes('Invalid'));
    assert((await state(p)).id===before.id,'invalid backup replaced active state');
    await p.setViewportSize({width:390,height:844});
    for(const v of ['control','casualties','resources','decisions','review','setup','coordination']){await section(p,v);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow in '+v);}
    assert(!p.errors.length,p.errors.join('; '));await ctx.close();
  });

  await behavior('Northern Response: controller and projector remain distinct offline',async()=>{
    const {ctx,p}=await open();await release(p,1);
    await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await ctx.setOffline(true);
    await p.goto(new URL('/ttx-display.html',p.url()).href);await p.waitForSelector('#displayContent .current-event');
    assert(!(await p.locator('#nextBtn').count()),'offline projector fell back to controller');
    await p.goto(new URL('/ttx.html',p.url()).href);await p.waitForSelector('#nextBtn');
    assert((await state(p)).released.length===1,'offline controller lost session');await ctx.close();
  });
}
