/* =====================================================
   APP — All interactive logic for the dashboard.
   Depends on: data.js (TTX_DATA)
   ===================================================== */

(function () {
  'use strict';

  try {

    /* ================= THEME TOGGLE ================= */
    var THEME_KEY = 'ttx-theme';
    var themeToggle = document.getElementById('themeToggle');

    var setTheme = function (theme) {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.textContent = '☀️';
      } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '🌙';
      }
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    };

    var loadTheme = function () {
      try {
        var saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light') setTheme('light');
        else setTheme('dark');
      } catch (e) { setTheme('dark'); }
    };

    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') setTheme('dark');
        else setTheme('light');
      });
    }

    loadTheme();

    /* ================= CHECKLIST ================= */
    var STORAGE_KEY = 'ttx-checklist-state';

    var grid  = document.getElementById('checkGrid');
    var fill  = document.getElementById('progressFill');
    var num   = document.getElementById('progressNum');
    var reset = document.getElementById('resetBtn');

    if (grid) {
      var ITEMS = TTX_DATA.checklistItems;

      ITEMS.forEach(function (text) {
        var label = document.createElement('label');
        label.className = 'check-item';
        label.innerHTML =
          '<input type="checkbox" class="check-input">' +
          '<span class="check-box">✓</span>' +
          '<span class="check-label">' + text + '</span>';
        grid.appendChild(label);
      });

      var inputs = Array.prototype.slice.call(grid.querySelectorAll('.check-input'));

      var saveState = function () {
        var state = inputs.map(function (i) { return i.checked; });
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      };

      var loadState = function () {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          var state = JSON.parse(raw);
          if (!Array.isArray(state) || state.length !== inputs.length) return;
          inputs.forEach(function (i, idx) { i.checked = !!state[idx]; });
        } catch (e) {}
      };

      var updateProgress = function () {
        var done = inputs.filter(function (i) { return i.checked; }).length;
        var pct  = Math.round((done / inputs.length) * 100);
        fill.style.width = pct + '%';
        num.textContent = done + ' / ' + inputs.length;
        num.classList.toggle('ready', done === inputs.length);
        saveState();
      };

      inputs.forEach(function (i) { i.addEventListener('change', updateProgress); });

      loadState();
      updateProgress();

      reset.addEventListener('click', function () {
        inputs.forEach(function (i) { i.checked = false; });
        updateProgress();
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      });
    }

    /* ================= MAP PINS & LEGEND ================= */
    var CATS = TTX_DATA.pinCategories;
    var LOCATIONS = TTX_DATA.locations;
    var PIN_STORAGE_KEY = 'ttx-pin-positions';

    var pinLayer = document.getElementById('pinLayer');
    var legend   = document.getElementById('legend');
    var NS = 'http://www.w3.org/2000/svg';

    /* ---------- Pin position persistence ---------- */
    var savePinPositions = function () {
      var positions = {};
      LOCATIONS.forEach(function (loc) {
        var pin = pinLayer.querySelector('.pin[data-id="' + loc.id + '"]');
        if (pin) {
          var transform = pin.getAttribute('transform');
          var match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match) {
            positions[loc.id] = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
          }
        }
      });
      try { localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
    };

    var loadPinPositions = function () {
      try {
        var raw = localStorage.getItem(PIN_STORAGE_KEY);
        if (!raw) return {};
        var positions = JSON.parse(raw);
        if (typeof positions !== 'object' || positions === null) return {};
        return positions;
      } catch (e) { return {}; }
    };

    var resetPinPositions = function () {
      try { localStorage.removeItem(PIN_STORAGE_KEY); } catch (e) {}
      LOCATIONS.forEach(function (loc) {
        var pin = pinLayer.querySelector('.pin[data-id="' + loc.id + '"]');
        if (pin) {
          pin.setAttribute('transform', 'translate(' + loc.x + ',' + loc.y + ')');
        }
      });
    };

    /* ---------- Drag logic ---------- */
    var draggedPin = null;
    var dragOffset = { x: 0, y: 0 };

    var getSVGPoint = function (svg, clientX, clientY) {
      var pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      var svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    };

    var onPinMouseDown = function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var pin = e.currentTarget;
      var svg = pin.closest('svg');
      if (!svg) return;

      var transform = pin.getAttribute('transform');
      var match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!match) return;

      var pinX = parseFloat(match[1]);
      var pinY = parseFloat(match[2]);
      var svgPt = getSVGPoint(svg, e.clientX, e.clientY);

      draggedPin = pin;
      dragOffset.x = svgPt.x - pinX;
      dragOffset.y = svgPt.y - pinY;

      pin.classList.add('dragging');
    };

    var onMouseMove = function (e) {
      if (!draggedPin) return;
      var svg = draggedPin.closest('svg');
      if (!svg) return;

      var svgPt = getSVGPoint(svg, e.clientX, e.clientY);
      var newX = svgPt.x - dragOffset.x;
      var newY = svgPt.y - dragOffset.y;

      /* Clamp to SVG bounds */
      var vb = svg.viewBox.baseVal;
      var margin = 20;
      newX = Math.max(margin, Math.min(vb.width - margin, newX));
      newY = Math.max(margin, Math.min(vb.height - margin, newY));

      draggedPin.setAttribute('transform', 'translate(' + newX + ',' + newY + ')');
    };

    var onMouseUp = function () {
      if (!draggedPin) return;
      draggedPin.classList.remove('dragging');
      draggedPin = null;
      savePinPositions();
    };

    /* ---------- Pin creation ---------- */
    var makePin = function (loc) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'pin');
      g.setAttribute('data-cat', loc.cat);
      g.setAttribute('data-id', loc.id);

      /* Use saved position if available */
      var savedPositions = loadPinPositions();
      var x = loc.x, y = loc.y;
      if (savedPositions[loc.id]) {
        x = savedPositions[loc.id].x;
        y = savedPositions[loc.id].y;
      }
      g.setAttribute('transform', 'translate(' + x + ',' + y + ')');

      var catColor = CATS[loc.cat].color;

      var title = document.createElementNS(NS, 'title');
      title.textContent = loc.id + '. ' + loc.name + ' (drag to move)';
      g.appendChild(title);

      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'halo');
      halo.setAttribute('r', '19');
      halo.setAttribute('stroke', catColor);
      g.appendChild(halo);

      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('class', 'dot');
      dot.setAttribute('r', '13');
      dot.setAttribute('fill', catColor);
      dot.setAttribute('stroke', '#0a1220');
      dot.setAttribute('stroke-width', '2');
      g.appendChild(dot);

      var num = document.createElementNS(NS, 'text');
      num.setAttribute('text-anchor', 'middle');
      num.setAttribute('dominant-baseline', 'central');
      num.setAttribute('font-size', '12');
      num.setAttribute('font-weight', '700');
      num.setAttribute('fill', '#ffffff');
      num.setAttribute('pointer-events', 'none');
      num.textContent = loc.id;
      g.appendChild(num);

      return g;
    };

    var itemEls = {};

    if (pinLayer && legend) {
      LOCATIONS.forEach(function (loc) {
        var pin = makePin(loc);
        pinLayer.appendChild(pin);
        pin.addEventListener('mouseenter', function () { highlight(loc.id, true); });
        pin.addEventListener('mouseleave', function () { highlight(loc.id, false); });
        pin.addEventListener('mousedown', onPinMouseDown);
      });

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      Object.keys(CATS).forEach(function (catKey) {
        var cat = CATS[catKey];
        var heading = document.createElement('div');
        heading.className = 'legend-cat';
        heading.textContent = cat.label;
        legend.appendChild(heading);

        LOCATIONS.filter(function (l) { return l.cat === catKey; })
          .sort(function (a, b) { return a.id - b.id; })
          .forEach(function (loc) {
            var item = document.createElement('div');
            item.className = 'legend-item';
            item.setAttribute('data-id', loc.id);
            item.innerHTML =
              '<div class="legend-num" style="background:' + cat.color + '">' + loc.id + '</div>' +
              '<div class="legend-txt"><b>' + loc.name + '</b><span>' + loc.desc + '</span></div>';
            item.addEventListener('mouseenter', function () { highlight(loc.id, true); });
            item.addEventListener('mouseleave', function () { highlight(loc.id, false); });
            legend.appendChild(item);
            itemEls[loc.id] = item;
          });
      });

      /* Add reset button for pin positions */
      var resetPinsBtn = document.createElement('button');
      resetPinsBtn.className = 'reset-btn';
      resetPinsBtn.type = 'button';
      resetPinsBtn.textContent = 'Reset Pin Positions';
      resetPinsBtn.style.marginTop = '12px';
      resetPinsBtn.addEventListener('click', function () {
        resetPinPositions();
      });
      legend.appendChild(resetPinsBtn);
    }

    function highlight(id, on) {
      var pin  = pinLayer.querySelector('.pin[data-id="' + id + '"]');
      var item = itemEls[id];
      if (pin)  pin.classList.toggle('hl', on);
      if (item) item.classList.toggle('hl', on);
    }

    /* ================= DRAG CRASH SITE & ZONE RINGS ================= */
    var CRASH_ZONE_STORAGE_KEY = 'ttx-crash-zone-positions';
    var DEFAULT_CRASH_POS = { x: 507, y: 270 };

    var saveCrashZonePositions = function () {
      var group = document.getElementById('crashZoneGroup');
      if (!group) return;
      var transform = group.getAttribute('transform');
      var match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (match) {
        var positions = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        try { localStorage.setItem(CRASH_ZONE_STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
      }
    };

    var loadCrashZonePositions = function () {
      try {
        var raw = localStorage.getItem(CRASH_ZONE_STORAGE_KEY);
        if (!raw) return {};
        var positions = JSON.parse(raw);
        if (typeof positions !== 'object' || positions === null) return {};
        return positions;
      } catch (e) { return {}; }
    };

    var resetCrashZonePositions = function () {
      try { localStorage.removeItem(CRASH_ZONE_STORAGE_KEY); } catch (e) {}
      var group = document.getElementById('crashZoneGroup');
      if (group) group.setAttribute('transform', 'translate(0,0)');
    };

    var draggedCrashGroup = null;
    var dragStartMouse = { x: 0, y: 0 };
    var dragStartPos = { x: 0, y: 0 };

    var onCrashZoneMouseDown = function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var el = e.currentTarget;
      var svg = el.closest('svg');
      if (!svg) return;

      var transform = el.getAttribute('transform');
      var match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!match) return;

      var elX = parseFloat(match[1]);
      var elY = parseFloat(match[2]);
      var svgPt = getSVGPoint(svg, e.clientX, e.clientY);

      draggedCrashGroup = el;
      dragStartMouse.x = svgPt.x;
      dragStartMouse.y = svgPt.y;
      dragStartPos.x = elX;
      dragStartPos.y = elY;

      el.style.cursor = 'grabbing';
    };

    var onCrashZoneMouseMove = function (e) {
      if (!draggedCrashGroup) return;
      var svg = draggedCrashGroup.closest('svg');
      if (!svg) return;

      var svgPt = getSVGPoint(svg, e.clientX, e.clientY);
      var dx = svgPt.x - dragStartMouse.x;
      var dy = svgPt.y - dragStartMouse.y;
      var newX = dragStartPos.x + dx;
      var newY = dragStartPos.y + dy;

      /* Allow movement across the entire map — no lower clamp */
      draggedCrashGroup.setAttribute('transform', 'translate(' + newX + ',' + newY + ')');
    };

    var onCrashZoneMouseUp = function () {
      if (!draggedCrashGroup) return;
      draggedCrashGroup.style.cursor = 'grab';
      draggedCrashGroup = null;
      saveCrashZonePositions();
    };

    var crashZoneGroup = document.getElementById('crashZoneGroup');

    if (crashZoneGroup) {
      /* Load saved positions */
      var savedCrashZone = loadCrashZonePositions();
      if (savedCrashZone.x !== undefined) {
        crashZoneGroup.setAttribute('transform', 'translate(' + savedCrashZone.x + ',' + savedCrashZone.y + ')');
      }

      crashZoneGroup.addEventListener('mousedown', onCrashZoneMouseDown);
      document.addEventListener('mousemove', onCrashZoneMouseMove);
      document.addEventListener('mouseup', onCrashZoneMouseUp);

      /* Add reset button for crash site and zone positions */
      var resetCrashZoneBtn = document.createElement('button');
      resetCrashZoneBtn.className = 'reset-btn';
      resetCrashZoneBtn.type = 'button';
      resetCrashZoneBtn.textContent = 'Reset Crash Site & Zones';
      resetCrashZoneBtn.style.marginTop = '8px';
      resetCrashZoneBtn.addEventListener('click', function () {
        resetCrashZonePositions();
      });
      legend.appendChild(resetCrashZoneBtn);
    }

    /* ================= SCENARIO SELECTOR ================= */
    var scenarioSelect = document.getElementById('scenarioSelect');

    if (scenarioSelect && TTX_DATA.scenarios) {
      TTX_DATA.scenarios.forEach(function (sc) {
        var opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name;
        scenarioSelect.appendChild(opt);
      });

      scenarioSelect.addEventListener('change', function () {
        var scenario = TTX_DATA.scenarios.find(function (s) { return s.id === scenarioSelect.value; });
        updateScenarioPanel(scenario);
      });
    }

    function updateScenarioPanel(scenario) {
      var panel = document.getElementById('scenarioPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'scenarioPanel';
        panel.style.cssText = 'background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);padding:20px;margin-top:20px;';
        var main = document.querySelector('main.wrap');
        if (main) main.insertBefore(panel, main.firstChild);
      }

      if (!scenario) {
        panel.innerHTML = '<p style="color:var(--muted);margin:0;">Select a scenario above to see casualty estimates, resource requirements, and exercise injects.</p>';
        return;
      }

      var html = '<h3 style="margin:0 0 16px;font-size:16px;">' + scenario.name + '</h3>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;">';
      html += '<div class="stat" style="background:#0a1220;border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:#fff;">' + scenario.soulsOnBoard + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Souls on Board</span></div>';
      html += '<div class="stat" style="background:#0a1220;border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:#fff;">' + scenario.fuelLoad + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Fuel Load</span></div>';
      html += '<div class="stat" style="background:#0a1220;border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:' + (scenario.fireInvolved ? '#ef4444' : '#22c55e') + ';">' + (scenario.fireInvolved ? 'Yes' : 'No') + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Fire Involved</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Estimated Casualties</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px;">';
      html += '<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#fca5a5;">' + scenario.casualties.red + '</span><span style="font-size:10px;color:#fca5a5;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Red (Immediate)</span></div>';
      html += '<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#fcd34d;">' + scenario.casualties.yellow + '</span><span style="font-size:10px;color:#fcd34d;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Yellow (Delayed)</span></div>';
      html += '<div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#86efac;">' + scenario.casualties.green + '</span><span style="font-size:10px;color:#86efac;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Green (Minor)</span></div>';
      html += '<div style="background:rgba(148,163,184,.1);border:1px solid rgba(148,163,184,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#94a3b8;">' + scenario.casualties.deceased + '</span><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Deceased</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Resource Requirements</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:16px;">';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:#fff;">' + scenario.resources.arff + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">ARFF Vehicles</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:#fff;">' + scenario.resources.ambulances + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Ambulances</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:#fff;">' + scenario.resources.fireTrucks + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Fire Trucks</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:#fff;">' + scenario.resources.buses + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Buses</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Exercise Injects</h4>';
      html += '<ul class="clean" style="margin:0;">';
      scenario.injects.forEach(function (inject) {
        html += '<li style="padding-left:20px;margin-bottom:8px;font-size:13px;color:#c4d3e8;position:relative;"><span style="position:absolute;left:4px;top:8px;width:6px;height:6px;border-radius:2px;background:var(--blue);transform:rotate(45deg);"></span>' + inject + '</li>';
      });
      html += '</ul>';

      panel.innerHTML = html;
    }

    /* ================= TIMELINE / INJECT TRACKER ================= */
    var TIMELINE_STORAGE_KEY = 'ttx-timeline-events';

    var timelineEvents = [];

    var loadTimeline = function () {
      try {
        var raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
        if (!raw) return;
        var events = JSON.parse(raw);
        if (Array.isArray(events)) {
          timelineEvents = events;
        }
      } catch (e) {}
    };

    var saveTimeline = function () {
      try { localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timelineEvents)); } catch (e) {}
    };

    var clearTimeline = function () {
      timelineEvents = [];
      try { localStorage.removeItem(TIMELINE_STORAGE_KEY); } catch (e) {}
      renderTimeline();
    };

    var addTimelineEvent = function (time, text, category) {
      timelineEvents.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: time,
        text: text,
        category: category || 'info',
        timestamp: new Date().toISOString()
      });
      saveTimeline();
      renderTimeline();
    };

    var deleteTimelineEvent = function (id) {
      timelineEvents = timelineEvents.filter(function (e) { return e.id !== id; });
      saveTimeline();
      renderTimeline();
    };

    var renderTimeline = function () {
      var container = document.getElementById('timelineContainer');
      if (!container) return;

      if (timelineEvents.length === 0) {
        container.innerHTML = '<p style="color:var(--muted);margin:0;font-size:13px;">No events logged yet. Use the form above to add injects, decisions, or milestones.</p>';
        return;
      }

      var html = '';
      timelineEvents.forEach(function (evt) {
        var catColor = '#3b82f6';
        if (evt.category === 'inject') catColor = '#a855f7';
        else if (evt.category === 'decision') catColor = '#22c55e';
        else if (evt.category === 'milestone') catColor = '#f59e0b';
        else if (evt.category === 'casualty') catColor = '#ef4444';

        html += '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line-soft);">';
        html += '<div style="flex:0 0 60px;font-size:12px;font-weight:700;color:' + catColor + ';font-variant-numeric:tabular-nums;">' + evt.time + '</div>';
        html += '<div style="flex:1;font-size:13px;color:#c4d3e8;">' + evt.text + '</div>';
        html += '<button class="reset-btn" style="flex:0 0 auto;padding:2px 8px;font-size:11px;" onclick="deleteTimelineEvent(\'' + evt.id + '\')">×</button>';
        html += '</div>';
      });

      container.innerHTML = html;
    };

    /* Expose delete function globally for inline onclick */
    window.deleteTimelineEvent = deleteTimelineEvent;

    /* Build timeline UI */
    var timelineSection = document.createElement('div');
    timelineSection.id = 'timelineSection';
    timelineSection.style.cssText = 'background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);padding:20px;margin-top:20px;';

    var timelineHTML = '<h3 style="margin:0 0 16px;font-size:16px;">Exercise Timeline</h3>';

    timelineHTML += '<div style="display:grid;grid-template-columns:100px 1fr 120px auto;gap:8px;margin-bottom:16px;align-items:end;">';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Time</label><input id="timelineTime" type="text" placeholder="09:30" style="width:100%;background:#0a1220;border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"></div>';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Event / Inject</label><input id="timelineText" type="text" placeholder="Describe the event..." style="width:100%;background:#0a1220;border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"></div>';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Category</label><select id="timelineCategory" style="width:100%;background:#0a1220;border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"><option value="info">Info</option><option value="inject">Inject</option><option value="decision">Decision</option><option value="milestone">Milestone</option><option value="casualty">Casualty</option></select></div>';
    timelineHTML += '<button id="timelineAddBtn" class="reset-btn" style="padding:6px 16px;">Add</button>';
    timelineHTML += '</div>';

    timelineHTML += '<div id="timelineContainer" style="max-height:400px;overflow-y:auto;"></div>';

    timelineHTML += '<div style="margin-top:12px;display:flex;gap:8px;">';
    timelineHTML += '<button id="timelineClearBtn" class="reset-btn" type="button">Clear All Events</button>';
    timelineHTML += '<button id="timelineExportBtn" class="reset-btn" type="button">Export for AAR</button>';
    timelineHTML += '</div>';

    timelineSection.innerHTML = timelineHTML;

    var mainWrap = document.querySelector('main.wrap');
    if (mainWrap) mainWrap.insertBefore(timelineSection, mainWrap.firstChild);

    /* Wire up events */
    var timelineTime = document.getElementById('timelineTime');
    var timelineText = document.getElementById('timelineText');
    var timelineCategory = document.getElementById('timelineCategory');
    var timelineAddBtn = document.getElementById('timelineAddBtn');
    var timelineClearBtn = document.getElementById('timelineClearBtn');
    var timelineExportBtn = document.getElementById('timelineExportBtn');

    var handleAdd = function () {
      var time = timelineTime.value.trim() || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      var text = timelineText.value.trim();
      if (!text) { timelineText.focus(); return; }
      addTimelineEvent(time, text, timelineCategory.value);
      timelineText.value = '';
      timelineText.focus();
    };

    if (timelineAddBtn) {
      timelineAddBtn.addEventListener('click', handleAdd);
      timelineText.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
      });
    }

    if (timelineClearBtn) {
      timelineClearBtn.addEventListener('click', function () {
        if (confirm('Clear all timeline events?')) clearTimeline();
      });
    }

    if (timelineExportBtn) {
      timelineExportBtn.addEventListener('click', function () {
        if (timelineEvents.length === 0) { alert('No events to export.'); return; }
        var scenarioName = '';
        var scenarioSelect = document.getElementById('scenarioSelect');
        if (scenarioSelect && scenarioSelect.value) {
          var sc = TTX_DATA.scenarios.find(function (s) { return s.id === scenarioSelect.value; });
          if (sc) scenarioName = sc.name;
        }
        var report = 'AIRPORT EMERGENCY EXERCISE — TIMELINE\n';
        report += '==========================================\n';
        if (scenarioName) report += 'Scenario: ' + scenarioName + '\n';
        report += 'Generated: ' + new Date().toLocaleString() + '\n\n';
        timelineEvents.forEach(function (evt) {
          report += '[' + evt.time + '] [' + evt.category.toUpperCase() + '] ' + evt.text + '\n';
        });
        var blob = new Blob([report], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'exercise-timeline-' + new Date().toISOString().slice(0, 10) + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    loadTimeline();
    renderTimeline();

    /* ================= AAR EXPORT ================= */
    var aarBtn = document.createElement('button');
    aarBtn.className = 'reset-btn';
    aarBtn.type = 'button';
    aarBtn.textContent = 'Export AAR Summary';
    aarBtn.style.marginTop = '12px';
    aarBtn.addEventListener('click', function () {
      var scenarioName = '';
      var scenarioSelect = document.getElementById('scenarioSelect');
      if (scenarioSelect && scenarioSelect.value) {
        var sc = TTX_DATA.scenarios.find(function (s) { return s.id === scenarioSelect.value; });
        if (sc) scenarioName = sc.name;
      }

      var checklistState = [];
      try {
        var raw = localStorage.getItem('ttx-checklist-state');
        if (raw) checklistState = JSON.parse(raw);
      } catch (e) {}

      var report = '';
      report += '============================================================\n';
      report += '  AIRPORT EMERGENCY EXERCISE — AFTER ACTION REPORT SUMMARY\n';
      report += '============================================================\n\n';
      report += 'Generated: ' + new Date().toLocaleString() + '\n';
      if (scenarioName) report += 'Scenario: ' + scenarioName + '\n';
      report += '\n';

      report += '------------------------------------------------------------\n';
      report += 'CHECKLIST STATUS\n';
      report += '------------------------------------------------------------\n';
      var checkedCount = 0;
      TTX_DATA.checklistItems.forEach(function (item, idx) {
        var checked = checklistState[idx] === true;
        if (checked) checkedCount++;
        report += (checked ? '[✓]' : '[ ]') + ' ' + item + '\n';
      });
      report += '\nProgress: ' + checkedCount + ' / ' + TTX_DATA.checklistItems.length + ' completed\n\n';

      report += '------------------------------------------------------------\n';
      report += 'EXERCISE TIMELINE\n';
      report += '------------------------------------------------------------\n';
      if (timelineEvents.length === 0) {
        report += 'No events recorded.\n';
      } else {
        timelineEvents.forEach(function (evt) {
          report += '[' + evt.time + '] [' + evt.category.toUpperCase() + '] ' + evt.text + '\n';
        });
      }
      report += '\n';

      report += '------------------------------------------------------------\n';
      report += 'NOTES\n';
      report += '------------------------------------------------------------\n';
      report += '\n\n\n\n';

      var blob = new Blob([report], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'AAR-Summary-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
    timelineSection.appendChild(aarBtn);

  } catch (err) {
    if (window.console) console.warn('Enhancement script skipped:', err);
  }

})();
