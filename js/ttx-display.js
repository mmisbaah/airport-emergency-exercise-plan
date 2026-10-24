/* Participant window reads the released-only payload. No scenario/controller script is loaded. */
(function(){
  'use strict';
  var key='nr-ttx-v1:display',last='',lastState=null;
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function time(ms){var s=Math.floor((960*60000+ms)/1000);return [Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60].map(function(n){return String(n).padStart(2,'0');}).join(':');}
  function render(){
    var raw;try{raw=localStorage.getItem(key);}catch(_){raw=null;}
    if(!raw){document.getElementById('displayContent').innerHTML='<section class="display-empty"><span class="eyebrow">READY FOR THE BRIEF</span><h1>Hanimaadhoo<br>Tabletop exercise</h1><p>Waiting for the facilitator to open the exercise console on this browser.</p></section>';return;}
    var data;try{data=JSON.parse(raw);if(data.schema!==1||!Array.isArray(data.released)||!Number.isFinite(data.elapsed))return;}catch(_){return;}
    lastState=data;
    var signature=JSON.stringify([data.sessionId,data.name,data.date,data.ended,data.pausedForSafety,data.released,data.casualties]);
    if(signature!==last){
      last=signature;var inj=data.released[data.released.length-1];
      document.getElementById('displayContent').innerHTML='<div class="display-header"><div><span class="eyebrow">EXERCISE / '+esc(data.date)+'</span><h2 style="margin-top:10px">'+esc(data.name)+'</h2><span class="tag">'+(data.ended?'EXERCISE ENDED':data.pausedForSafety?'NO DUFF · PLAY PAUSED':'A320 · 110 PERSONS · 120-MIN SESSION')+'</span></div><div><div class="display-clock" id="displayClock">'+time(data.elapsed)+'</div><span class="eyebrow" style="margin-top:8px">MVT · UTC+5 <span id="displayRunStatus"></span></span></div></div>'+(data.pausedForSafety?'<div class="end-banner" style="margin-top:20px">NO DUFF. Exercise play is paused. Follow the facilitator’s directions for the real-world situation.</div>':'')+(inj?'<section class="panel current-event"><div class="event-meta"><span class="tag">INJECT '+data.released.length+'</span><span>'+esc(inj.from)+' · '+esc(inj.phase)+'</span><span>'+time(inj.at*60000).slice(0,5)+' MVT</span></div><h1>'+esc(inj.title)+'</h1><p class="message">'+esc(inj.message)+'</p><div class="event-prompt"><span class="eyebrow">TEAM DISCUSSION</span><p>'+esc(inj.prompt)+'</p></div></section>':'<section class="display-empty"><span class="eyebrow">PLAYER BRIEF</span><h1>Hanimaadhoo<br>Airport emergency TTX</h1><p>Your team will discuss an A320 emergency with 110 persons aboard. State your first actions, command arrangements, resources and information needs.</p><p class="muted">Waiting for the 16:00 ATC call.</p></section>')+(data.casualties?'<div class="casualty-totals">'+data.casualties.map(function(c){return '<div class="stat '+esc(c.category.toLowerCase())+'"><span class="eyebrow">'+esc(c.category)+'</span><span class="number">'+esc(c.count)+'</span><small>'+esc(c.label)+'</small></div>';}).join('')+'</div>':'');
    }
    if(document.getElementById('displayClock'))document.getElementById('displayClock').textContent=time(data.elapsed);
    if(document.getElementById('displayRunStatus'))document.getElementById('displayRunStatus').textContent=data.running?'· RUNNING':'· PAUSED';
    status();
  }
  function status(){if(!lastState)return;var age=Date.now()-Date.parse(lastState.updatedAt);document.getElementById('connectionStatus').textContent=age>12000?'No recent controller update. Check that the facilitator window is open; the displayed time is the last received value.':'Same-browser display · '+(lastState.running?'Clock updates from facilitator':'Clock paused by facilitator')+' · Only released information is shown.';}
  document.getElementById('fullscreenBtn').onclick=function(){if(document.fullscreenElement)document.exitFullscreen().catch(function(){});else document.documentElement.requestFullscreen().catch(function(){document.getElementById('connectionStatus').textContent='Full screen is unavailable in this browser.';});};
  window.addEventListener('storage',function(e){if(e.key===key)render();});setInterval(function(){render();status();},2000);render();
})();
