/* Maldives exercise operations. All capacities start as exercise assumptions. */
var TTX_MV = (function () {
  'use strict';
  var read = function (k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (_) { return fallback; } };
  var write = function (k, v) { localStorage.setItem(k, JSON.stringify(v)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
  var time = function (date, options) { return new Intl.DateTimeFormat('en-GB', Object.assign({timeZone:'Indian/Maldives', hour:'2-digit', minute:'2-digit'}, options)).format(date) + ' MVT'; };
  var date = function (d) { return new Intl.DateTimeFormat('en-GB', {timeZone:'Indian/Maldives', year:'numeric', month:'2-digit', day:'2-digit'}).format(d); };
  var stamp = function (d) { return date(d) + ' ' + time(d); };
  var types = [
    {key:'arff', label:'RFF vehicle', type:'ARFF'}, {key:'ambulances',label:'Ambulance',type:'EMS'},
    {key:'fireTrucks',label:'Fire truck',type:'Fire'}, {key:'buses',label:'Bus',type:'Transport'},
    {key:'boats',label:'Rescue boat (capability unconfirmed)',type:'Marine'},
    {key:'air',label:'Air medical / military SAR asset',type:'Air'},
    {key:'medical',label:'Medical team',type:'Medical'}, {key:'security',label:'Police / AVSEC unit',type:'Security'}
  ];
  var defaults = function (ap) {
    var units = [];
    types.forEach(function (t) { var n = ap.local[t.key] || (t.key === 'medical' || t.key === 'security' ? 1 : 0);
      for (var i=1;i<=n;i++) units.push({id:ap.id+'-'+t.key+'-'+i,name:t.label+' '+i,type:t.type,key:t.key,status:'unavailable',owner:ap.operator,location:ap.island,notes:'Exercise assumption — confirm availability and capability',capability:t.key === 'boats' ? 'Rescue boat' : t.label,stretchers:0,escort:'',mobilisation:0,travel:0,turnaround:0,constraints:'',confirmed:false});
    }); return units;
  };
  var scopeKeys = ['ttx-resource-tracker','ttx-casualty-tracker','ttx-scenario-resources','ttx-timeline-events','ttx-clock','ttx-aar-notes','ttx-checklist-state','ttx-active-scenario','ttx-restore-points','ttx-version-history'];
  var session = read('ttx-mv-session', {id:'initial',name:'Initial exercise'});
  var sessions=read('ttx-mv-sessions',[]);if(!sessions.some(function(x){return x.id===session.id;})){sessions.push(session);write('ttx-mv-sessions',sessions);}
  var airport = TTX_SITE.context().airport;
  var scope = airport.id + ':' + session.id;
  var key = function () { return 'ttx-mv-ops:' + scope; };
  var state = read(key(), {transfers:[],agencies:[],hospitals:[],facts:[],landmarks:[],settings:{}});
  var persist = function () { write(key(),state); };
  var switching=false;
  var archive = function () { if(switching)return; var snapshot={}; scopeKeys.forEach(function(k){ snapshot[k]=localStorage.getItem(k); }); write('ttx-mv-session-data:'+scope,snapshot); };
  var switchScope = function (ap, nextSession) {
    archive(); switching=true; var target=ap+':'+nextSession.id, saved=read('ttx-mv-session-data:'+target,{});
    scopeKeys.forEach(function(k){ if(saved[k] !== undefined && saved[k] !== null) localStorage.setItem(k,saved[k]); else localStorage.removeItem(k); });
    write('ttx-mv-session', nextSession); location.reload();
  };
  var roster = function () { return read('ttx-resource-tracker', defaults(airport)); };
  var counts = function () { var c={}; roster().forEach(function(r){if(r.status==='deployed'&&r.confirmed) c[r.key]=(c[r.key]||0)+1;});return c; };
  var configure = function () {
    var hospitals=read('ttx-mv-hospitals:'+airport.id,null); if(hospitals) airport.hospitals=hospitals;
    var facts=read('ttx-mv-facts:'+airport.id,state.facts||[]); state.facts=facts.length?facts:[{fact:'Runway',value:airport.runways.map(function(r){return r.id+' '+r.length+' × '+r.width+' m';}).join('; '),source:'Verify against current AIP / approved AEP',date:'',by:'',status:'Exercise assumption'},{fact:'On-island resources',value:JSON.stringify(airport.local),source:'Airport profile planning defaults',date:'',by:'',status:'Exercise assumption'},{fact:'RFF category',value:airport.rff,source:'Verify certified category in current AIP / AEP',date:'',by:'',status:'Exercise assumption'}].concat(airport.hospitals.map(function(h){return {fact:h.name,value:h.how+' / '+h.eta,source:'Airport profile planning estimate',date:'',by:'',status:'Exercise assumption'};}));
    if(!state.hospitals.length) state.hospitals=airport.hospitals.map(function(h){return {name:h.name,capacity:0,accepted:false,contact:'',confirmedAt:'',how:h.how,eta:h.eta,role:h.role};});
    if(!state.landmarks.length) state.landmarks=[{name:'Primary jetty — confirm AEP name',purpose:'Jetty',access:'Confirm loading and stretcher access',alternative:'Confirm alternative jetty'},{name:'AEP rendezvous point — confirm name',purpose:'Rendezvous',access:'Confirm gate / access',alternative:'Confirm alternative access'}];
    if(!state.agencies.length) state.agencies=airport.agencies.map(function(n){return {name:n,role:'Confirm role against local AEP',initiator:'',status:'Not requested',eta:'',primary:'',fallback:'',contact:''};});
  };
  configure();
  var report = function () {
    return '<section class="mv-report"><h2>Maldives island response — '+esc(airport.name)+'</h2><p>'+esc(session.name)+' · '+esc(stamp(new Date()))+'</p>'+
      '<h3>Transfer plan</h3>'+table(['Casualty / group','Route / alternative','Asset','Status / history (UTC)','Patients','Destination / estimate'],state.transfers.map(function(t){return [t.patient,t.origin+' → '+t.embark+' → '+t.disembark+' / '+t.alternative,t.asset,t.status+' / '+(t.history||[]).map(function(x){return x.status+' '+x.at;}).join('; '),t.patients,t.hospital+' / '+estimate(t)];}))+
      '<h3>Hospital acceptance</h3>'+table(['Hospital','Confirmed acceptance','Exercise slots','Contact'],state.hospitals.map(function(h){return [h.name,h.accepted?'Yes':'Unconfirmed',h.capacity,h.contact];}))+
      '<h3>Agency assignments and communications</h3>'+table(['Agency','Assignment / initiator','Status / ETA','Primary / fallback'],state.agencies.map(function(a){return [a.name,a.role+' / '+a.initiator,a.status+' / '+a.eta,a.primary+' / '+a.fallback];}))+
      '<h3>Exercise settings</h3><p>'+esc(JSON.stringify(state.settings))+'</p><h3>Operational landmarks</h3>'+table(['Name','Purpose','Access','Alternative'],state.landmarks.map(function(l){return [l.name,l.purpose,l.access,l.alternative];}))+'<h3>Local data verification</h3>'+table(['Fact','Value','Source','Verified date / by','Status'],state.facts.map(function(f){return [f.fact,f.value,f.source,f.date+' / '+f.by,f.status];}))+'</section>';
  };
  function table(headers, rows, editable) {return '<div class="mv-scroll"><table><thead><tr>'+headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+(editable?'<th>Actions</th>':'')+'</tr></thead><tbody>'+rows.map(function(r,i){return '<tr>'+r.map(function(v){return '<td>'+esc(v)+'</td>';}).join('')+(editable?'<td><button type="button" data-edit="'+i+'">Edit</button></td>':'')+'</tr>';}).join('')+'</tbody></table></div>';}
  function input(label,name,value,type) {return '<label>'+esc(label)+'<input name="'+name+'" type="'+(type||'text')+'" value="'+esc(value)+'" '+(type==='number'?'min="0" max="10000" step="1"':'')+'></label>';}
  function select(label,name,values,current) {return '<label>'+esc(label)+'<select name="'+name+'">'+values.map(function(v){return '<option '+(v===current?'selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select></label>';}
  var activeTab='transport', editIndex=-1;
  var render;
  function mount() {
    var button=document.createElement('button');button.className='reset-btn hdr-btn';button.type='button';button.textContent='🏝 Island Response';button.id='islandResponseBtn';
    var anchor=document.getElementById('resourceBtn');anchor.parentNode.insertBefore(button,anchor);
    var dialog=document.createElement('dialog');dialog.id='mvDialog';dialog.setAttribute('aria-label','Maldives island response'); document.body.appendChild(dialog);
    render=function(){
      var labels=read('ttx-mv-labels',{});
      dialog.innerHTML='<div class="mv-head"><h2>Island Response · '+esc(airport.short)+'</h2><button type="button" id="mvClose">Close</button></div><p>'+esc(session.name)+' · '+esc(stamp(new Date()))+' · capacities are exercise assumptions until confirmed.</p>'+
        '<nav class="mv-tabs">'+['transport','assets','hospitals','agencies','verification','locations','settings'].map(function(t){return '<button type="button" data-tab="'+t+'" aria-pressed="'+(activeTab===t)+'">'+t+'</button>';}).join('')+'</nav><div id="mvBody"></div><p id="mvMessage" role="status"></p><button type="button" id="mvExport">Export island response report</button>';
      dialog.querySelector('#mvClose').onclick=function(){dialog.close();};
      dialog.querySelectorAll('[data-tab]').forEach(function(b){b.onclick=function(){activeTab=b.dataset.tab;editIndex=-1;render();};});
      dialog.querySelector('#mvExport').onclick=function(){download('Island-response.html','<!doctype html><meta charset="utf-8"><title>Island response</title>'+report(),'text/html');};
      var body=dialog.querySelector('#mvBody'), h='', fields='', rows=[], headers=[];
      if(activeTab==='transport') {
        h='<h3>Casualty movement</h3><p>Reference casualty tags from the Casualties tracker. Rescue capacity and medical transport capacity are separate. Confirm clinical suitability and hospital acceptance before departure.</p>';
        var t=state.transfers[editIndex]||{};
        fields=input('Casualty tag / group','patient',t.patient||'')+input('Number of patients','patients',t.patients||1,'number')+input('Origin / CCP','origin',t.origin||airport.island)+input('Embarkation jetty / gate','embark',t.embark||'')+input('Receiving jetty / gate','disembark',t.disembark||'')+select('Receiving hospital','hospital',state.hospitals.map(function(x){return x.name;}),t.hospital)+select('Asset','asset',roster().map(function(x){return x.id;}),t.asset)+select('Status','status',['Requested','Accepted','Boarding','Departed','Arrived','Handed over'],t.status)+input('Alternative route / asset','alternative',t.alternative||'')+input('Departure (MVT, exercise date)','departure',t.departure||'','datetime-local')+input('Handover / notes','notes',t.notes||'');
        headers=['Casualty / group','Patients','Route / alternative','Hospital','Asset','Status','Estimate'];
        rows=state.transfers.map(function(x){return [x.patient,x.patients,x.origin+' → '+x.embark+' → '+x.disembark+' / '+x.alternative,x.hospital,x.asset,x.status,estimate(x)];});
      } else if(activeTab==='assets') {
        h='<h3>Response assets</h3><p>Shared with the Unit Roster and scenario commitments. SAR / medical aircraft require confirmed tasking; they are never assumed available.</p>';
        var r=roster()[editIndex]||{};
        fields=input('Asset name','name',r.name||'')+select('Resource class','key',types.map(function(x){return x.key;}),r.key)+select('Capability','capability',['Rescue boat','Sea ambulance','Resort speedboat','Dhoni','Coast Guard vessel','Military SAR helicopter','Military medical evacuation helicopter','Air medical transport','RFF vehicle','Ambulance','Fire truck','Bus','Medical team','Police / AVSEC unit'],r.capability)+input('Owner / tasking authority','owner',r.owner||'')+input('Base / location','location',r.location||airport.island)+select('Availability','status',['unavailable','available','deployed'],r.status)+select('Capability confirmed','confirmed',['No','Yes'],r.confirmed?'Yes':'No')+input('Stretcher capacity','stretchers',r.stretchers||0,'number')+input('Medical escort / equipment','escort',r.escort||'')+input('Mobilisation minutes','mobilisation',r.mobilisation||0,'number')+input('One-way travel minutes','travel',r.travel||0,'number')+input('Return and reload minutes','turnaround',r.turnaround||0,'number')+input('Sea state / daylight / lighting / rescue constraints','constraints',r.constraints||'')+input('Notes','notes',r.notes||'');
        headers=['Asset','Capability','Owner / base','Status','Stretchers / escort','Constraints'];rows=roster().map(function(x){return [x.name,x.capability,x.owner+' / '+x.location,x.status+(x.confirmed?' · confirmed':' · unconfirmed'),x.stretchers+' / '+(x.escort||''),x.constraints];});
      } else if(activeTab==='hospitals') {
        h='<h3>Receiving hospitals</h3><p>Slots are facilitator-entered exercise capacity, not published clinical capacity. Record acceptance for this exercise and update it as conditions change.</p>';
        var hosp=state.hospitals[editIndex]||{};fields=input('Hospital name','name',hosp.name||'')+input('Exercise receiving slots','capacity',hosp.capacity||0,'number')+select('Acceptance confirmed','accepted',['No','Yes'],hosp.accepted?'Yes':'No')+input('Contact / confirmation notes','contact',hosp.contact||'')+input('Transfer method','how',hosp.how||'')+input('Planning transfer estimate','eta',hosp.eta||'')+input('Role','role',hosp.role||'Receiving');
        headers=['Hospital','Slots','Acceptance','Contact','Confirmed'];rows=state.hospitals.map(function(x){return [x.name,x.capacity,x.accepted?'Confirmed':'Unconfirmed',x.contact,x.confirmedAt];});
      } else if(activeTab==='agencies') {
        h='<h3>Call-outs and assignments</h3><p>Use your approved AEP to establish command, tasking and communications arrangements. Record actual acknowledgements.</p>';
        var a=state.agencies[editIndex]||{};fields=input('Agency','name',a.name||'')+input('Assignment','role',a.role||'')+input('Call-out initiator','initiator',a.initiator||'')+select('Status','status',['Not requested','Requested','Acknowledged','Mobilising','On scene','Stood down'],a.status)+input('ETA (MVT) / estimate','eta',a.eta||'')+input('Primary communications','primary',a.primary||'')+input('Fallback communications','fallback',a.fallback||'')+input('Contact','contact',a.contact||'');
        headers=['Agency','Assignment','Initiator','Status / ETA','Primary / fallback'];rows=state.agencies.map(function(x){return [x.name,x.role,x.initiator,x.status+' / '+x.eta,x.primary+' / '+x.fallback];});
      } else if(activeTab==='verification') {
        h='<h3>Local facts and verification</h3><p>Airport resource counts, runway details and hospital transfer estimates in the dashboard are planning values. Record the AIP / AEP source and verification here; capability is confirmed separately for each asset.</p>';
        var f=state.facts[editIndex]||{};fields=input('Fact','fact',f.fact||'')+input('Value / exercise assumption','value',f.value||'')+input('Source / document revision','source',f.source||'')+input('Verified date','date',f.date||'','date')+input('Verified by','by',f.by||'')+select('Status','status',['Exercise assumption','Confirmed value'],f.status);
        headers=['Fact','Value','Source','Date / verifier','Status']; rows=state.facts.map(function(x){return [x.fact,x.value,x.source,x.date+' / '+x.by,x.status];});
      } else if(activeTab==='locations') {
        h='<h3>Operational landmarks</h3><p>Name the actual jetties, gates, rendezvous and casualty handover points from the airport AEP. Use Key Locations → Customize Map to place them on the schematic.</p>';
        var l=state.landmarks[editIndex]||{};fields=input('Location name','name',l.name||'')+select('Purpose','purpose',['Jetty','Gate','Rendezvous','Casualty handover','Alternative access','Assembly point'],l.purpose)+input('Access / constraints','access',l.access||'')+input('Alternative','alternative',l.alternative||'')+input('Map X (0–960)','x',l.x||120,'number')+input('Map Y (0–620)','y',l.y||520,'number');
        headers=['Location','Purpose','Access','Alternative'];rows=state.landmarks.map(function(x){return [x.name,x.purpose,x.access,x.alternative];});
      } else {
        h='<h3>Exercise settings</h3><p>All exercise clocks and reports use MVT (UTC+5). UTC timestamps are retained in stored records. New sessions preserve the previous exercise.</p><form id="mvSettings" class="mv-grid">'+input('Exercise name','name',session.name)+input('Exercise date','date',state.settings.date||'','date')+input('Facilitator daylight cut-off (MVT)','sunset',state.settings.sunset||'','time')+input('Approved evacuation plan / assembly arrangements','evacuation',state.settings.evacuation||'')+'<button>Save settings</button></form><button type="button" id="mvNew">Start new exercise session</button><h3>Dhivehi labels</h3><p>Enter locally reviewed Thaana labels. Saved labels appear beside the matching checklist items and zone / alert labels. English remains available.</p><form id="mvLabels" class="mv-grid">'+['Local Standby','Full Emergency','Aircraft Accident','All Clear','Hot Zone','Warm Zone','Cold Zone'].concat(TTX_DATA.checklistItems).map(function(k,i){return input(k,'label'+i,labels[k]||'');}).join('')+input('Reviewed by','reviewer',labels.reviewer||'')+'<button>Save reviewed labels</button></form>';
      }
      body.innerHTML=h+(fields?table(headers.concat(['Actions']),rows.map(function(r,i){return r.concat(['']);})).replace(/<td><\/td><\/tr>/g,function(){return '<td></td></tr>';})+'<div id="mvEditList">'+rows.map(function(_,i){return '<button type="button" data-edit="'+i+'">Edit '+(i+1)+'</button>';}).join('')+'</div><form id="mvForm" class="mv-grid">'+fields+'<button type="submit">'+(editIndex<0?'Add':'Save')+'</button>'+(editIndex>=0?'<button type="button" id="mvCancel">Cancel edit</button>':'')+'</form>':'');
      body.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){editIndex=Number(b.dataset.edit);render();};});
      var cancel=body.querySelector('#mvCancel');if(cancel)cancel.onclick=function(){editIndex=-1;render();};
      var form=body.querySelector('#mvForm');if(form)form.onsubmit=function(e){e.preventDefault();saveForm(new FormData(form));};
      var settings=body.querySelector('#mvSettings');if(settings)settings.onsubmit=function(e){e.preventDefault();var d=Object.fromEntries(new FormData(settings));session.name=d.name;sessions=sessions.map(function(x){return x.id===session.id?session:x;});write('ttx-mv-sessions',sessions);write('ttx-mv-session',session);state.settings=d;persist();render();};
      if(activeTab==='settings'){var resume=document.createElement('select');resume.setAttribute('aria-label','Resume exercise session');sessions.forEach(function(x){var opt=document.createElement('option');opt.value=x.id;opt.textContent=x.name;opt.selected=x.id===session.id;resume.appendChild(opt);});resume.onchange=function(){var chosen=sessions.find(function(x){return x.id===resume.value;});switchScope(airport.id,chosen);};body.appendChild(resume);}
      var newButton=body.querySelector('#mvNew');if(newButton)newButton.onclick=function(){var name=prompt('New exercise name');if(name&&name.trim())switchScope(airport.id,{id:crypto.randomUUID(),name:name.trim()});};
      var labelForm=body.querySelector('#mvLabels');if(labelForm)labelForm.onsubmit=function(e){e.preventDefault();var fd=new FormData(labelForm),o={reviewer:fd.get('reviewer')};if(!o.reviewer.trim()){message('Enter the local language reviewer.');return;}['Local Standby','Full Emergency','Aircraft Accident','All Clear','Hot Zone','Warm Zone','Cold Zone'].concat(TTX_DATA.checklistItems).forEach(function(k,i){o[k]=fd.get('label'+i);});write('ttx-mv-labels',o);applyLabels();message('Reviewed labels saved.');};
    };
    button.onclick=function(){render();dialog.showModal();};
    document.getElementById('airportSelect').addEventListener('change',function(e){var ap=e.target.value;if(ap!==airport.id){e.stopImmediatePropagation();TTX_SITE.setSelection({airport:ap});switchScope(ap,session);}},true);
    window.addEventListener('beforeunload',archive);
    applyLabels();drawLandmarks();
  }
  function message(s){document.getElementById('mvMessage').textContent=s;}
  function estimate(t) {
    var r=roster().find(function(x){return x.id===t.asset;});
    if(!r||!r.confirmed||!r.stretchers||!r.escort||r.status==='unavailable')return 'Medical transport unconfirmed';
    var trips=Math.ceil(Number(t.patients)/Number(r.stretchers));
    var minutes=Number(r.mobilisation)+trips*Number(r.travel)+(trips-1)*Number(r.turnaround);
    return trips+' trip(s); last arrival ≈ '+minutes+' min from mobilisation (loading / handover must be included in timings)';
  }
  function saveForm(fd) {
    var obj=Object.fromEntries(fd), target;
    if(activeTab==='assets') {target=roster();obj.id=editIndex>=0?target[editIndex].id:crypto.randomUUID();if(!obj.name.trim()){message('Enter an asset name.');return;}obj.type=types.find(function(x){return x.key===obj.key;}).type;obj.confirmed=obj.confirmed==='Yes';if(!obj.confirmed)obj.status='unavailable';['stretchers','mobilisation','travel','turnaround'].forEach(function(k){obj[k]=Number(obj[k]);});if(/helicopter/i.test(obj.capability)&&obj.key==='boats'){message('Select the air resource class for military SAR / medical aircraft.');return;}}
    else if(activeTab==='hospitals'){target=state.hospitals;obj.accepted=obj.accepted==='Yes';obj.capacity=Number(obj.capacity);obj.confirmedAt=obj.accepted?stamp(new Date()):'';}
    else if(activeTab==='transport') {
      target=state.transfers;obj.patients=Number(obj.patients);var hospital=state.hospitals.find(function(h){return h.name===obj.hospital;}), asset=roster().find(function(r){return r.id===obj.asset;});
      if(!obj.patient.trim()||obj.patients<1){message('Enter a casualty tag / group and at least one patient.');return;}
      var prior=target[editIndex];
      var order=['Requested','Accepted','Boarding','Departed','Arrived','Handed over'];
      if(order.indexOf(obj.status) > order.indexOf(prior?prior.status:'Requested')+1){message('Record each transfer handover stage in sequence.');return;}
      if(prior&&order.indexOf(obj.status)<order.indexOf(prior.status)){message('Transfer stages cannot move backwards.');return;}
      var moving=['Boarding','Departed','Arrived','Handed over'].indexOf(obj.status)>=0;
      var assigned=target.reduce(function(n,t,i){return n+(i!==editIndex&&t.hospital===obj.hospital&&t.status!=='Requested'?Number(t.patients):0);},0);
      if(obj.status!=='Requested'&&(!hospital||!hospital.accepted||assigned+obj.patients>hospital.capacity)){message('Confirm hospital acceptance and sufficient receiving slots first.');return;}
      if(moving&&(!asset||!asset.confirmed||asset.status==='unavailable'||asset.stretchers<1||!asset.escort.trim()||!obj.embark.trim()||!obj.disembark.trim()||!obj.alternative.trim())){message('Confirm asset capability, medical escort, both transfer points and alternative route first.');return;}
      if(moving&&target.some(function(t,i){return i!==editIndex&&t.asset===obj.asset&&['Boarding','Departed','Arrived'].indexOf(t.status)>=0;})){message('This asset is already assigned to an active transfer.');return;}
      if(obj.status==='Handed over'){var casualties=read('ttx-casualty-tracker',[]);casualties.forEach(function(c){if(String(c.tag)===obj.patient){c.transported=true;c.destination=obj.hospital;}});write('ttx-casualty-tracker',casualties);document.dispatchEvent(new Event('mv-casualty-change'));}
      obj.updatedAt=new Date().toISOString();if(obj.departure)obj.departureUtc=new Date(obj.departure+'+05:00').toISOString();obj.history=(prior&&prior.history||[]).concat([{status:obj.status,at:obj.updatedAt}]);
    } else target=state[activeTab==='verification'?'facts':activeTab];
    if(activeTab==='verification'&&obj.status==='Confirmed value'&&(!obj.source.trim()||!obj.by.trim()||!obj.date)){message('Confirmed facts need source, verified date and verifier.');return;}
    if(editIndex<0)target.push(obj);else target[editIndex]=obj;
    if(activeTab==='assets'){write('ttx-resource-tracker',target);document.dispatchEvent(new Event('mv-roster-change'));}
    if(activeTab==='hospitals'){airport.hospitals=state.hospitals.map(function(h){return {name:h.name,role:h.role||'Receiving',how:h.how||'Confirm route',eta:h.eta||'Unconfirmed'};});write('ttx-mv-hospitals:'+airport.id,state.hospitals.map(function(h){return {name:h.name,role:h.role||'Receiving',how:h.how||'Confirm route',eta:h.eta||'Unconfirmed'};}));}
    if(activeTab==='verification')write('ttx-mv-facts:'+airport.id,state.facts);
    persist();editIndex=-1;render();drawLandmarks();message('Saved.');
  }
  function drawLandmarks(){
    document.querySelectorAll('.mv-landmark').forEach(function(n){n.remove();});
    var svg=document.getElementById('pinLayer');if(svg)svg=svg.ownerSVGElement;
    if(!svg)return;
    state.landmarks.forEach(function(l){if(!l.x||!l.y)return;var g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','mv-landmark');var t=document.createElementNS(g.namespaceURI,'text');t.setAttribute('x',Math.min(960,Number(l.x)));t.setAttribute('y',Math.min(620,Number(l.y)));t.setAttribute('fill','#fbbf24');t.setAttribute('font-size','11');t.textContent=l.name;g.appendChild(t);svg.appendChild(g);});
  }
  function applyLabels(){var labels=read('ttx-mv-labels',{});document.querySelectorAll('.mv-dv').forEach(function(n){n.remove();});if(!labels.reviewer)return;document.querySelectorAll('h3,h4,label,.check-label,.state-name').forEach(function(n){var text=n.textContent.trim(),dv=labels[text];if(dv){var s=document.createElement('span');s.className='mv-dv';s.lang='dv';s.dir='rtl';s.textContent=dv;n.appendChild(s);}});}
  function download(name,content,type){var url=URL.createObjectURL(new Blob([content],{type:type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,0);});
  return {time:time,date:date,stamp:stamp,defaults:defaults,counts:counts,report:report,estimate:estimate,data:function(){return {airport:airport.id,session:session,operations:state,resources:roster()};},settings:function(){return state.settings;},agencies:function(){return state.agencies;},types:types};
})();
