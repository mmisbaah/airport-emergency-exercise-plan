/* =====================================================
   APP — All interactive logic for the dashboard.
   Depends on: data.js (TTX_DATA)
   ===================================================== */

(function () {
  'use strict';

  try {

    /* ================= KEYBOARD SHORTCUTS ================= */
    var TAB_IDS = ['ttx-tab-phases', 'ttx-tab-teams', 'ttx-tab-locations', 'ttx-tab-zones', 'ttx-tab-emergencies', 'ttx-tab-aircraft', 'ttx-tab-checklist'];
    var TAB_NAMES = ['IC Role', 'Team Labels', 'Key Locations', 'Incident Zones', 'Emergency Types', 'Aircraft Specs', 'TTX Flow & Checklist'];

    document.addEventListener('keydown', function (e) {
      // Don't trigger shortcuts when typing in inputs
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      // Ctrl/Cmd + 1-7: Switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        var idx = parseInt(e.key) - 1;
        if (TAB_IDS[idx]) {
          var radio = document.getElementById(TAB_IDS[idx]);
          if (radio) radio.checked = true;
        }
        return;
      }

      // Ctrl/Cmd + T: Toggle theme
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        var current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') setTheme('dark');
        else setTheme('light');
        return;
      }

      // Ctrl/Cmd + P: Print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        var printBtn = document.getElementById('printBtn');
        if (printBtn) printBtn.click();
        return;
      }

      // Ctrl/Cmd + E: Open scenario editor
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        var scenarioEditorBtn = document.getElementById('scenarioEditorBtn');
        if (scenarioEditorBtn) scenarioEditorBtn.click();
        return;
      }

      // Ctrl/Cmd + Z: Undo timeline
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        undoTimeline();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl+Y: Redo timeline
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' || e.key === 'Z') && e.shiftKey) || (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redoTimeline();
        return;
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        var scenarioModal = document.getElementById('scenarioModal');
        if (scenarioModal && scenarioModal.style.display !== 'none') {
          scenarioModal.style.display = 'none';
        }
        return;
      }
    });

    /* ================= THEME TOGGLE ================= */
    var THEME_KEY = 'ttx-theme';
    var themeToggle = document.getElementById('themeToggle');

    var setTheme = function (theme) {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.textContent = '🌙';
      } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
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
        var timelineSection = document.getElementById('timelineSection');
        if (timelineSection) {
          if (scenario) {
            timelineSection.style.display = 'block';
          } else {
            timelineSection.style.display = 'none';
          }
        }
      });
    }

    function updateScenarioPanel(scenario) {
      var panel = document.getElementById('scenarioPanel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'scenarioPanel';
        panel.style.cssText = 'background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);padding:20px;margin-top:20px;color:var(--text);';
        var main = document.querySelector('main.wrap');
        if (main) main.insertBefore(panel, main.firstChild);
      }

      if (!scenario) {
        panel.innerHTML = '<p style="color:var(--muted);margin:0;">Select a scenario above to see casualty estimates, resource requirements, and exercise injects.</p>';
        return;
      }

      var html = '<h3 style="margin:0 0 16px;font-size:16px;color:var(--text);">' + scenario.name + '</h3>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;">';
      html += '<div class="stat" style="background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:var(--stat-text);">' + scenario.soulsOnBoard + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Souls on Board</span></div>';
      html += '<div class="stat" style="background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:var(--stat-text);">' + scenario.fuelLoad + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Fuel Load</span></div>';
      html += '<div class="stat" style="background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:9px;padding:12px;text-align:center;"><span class="num" style="font-size:20px;font-weight:700;color:' + (scenario.fireInvolved ? '#ef4444' : '#22c55e') + ';">' + (scenario.fireInvolved ? 'Yes' : 'No') + '</span><span class="lbl" style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:4px;">Fire Involved</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Estimated Casualties</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px;">';
      html += '<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#dc2626;">' + scenario.casualties.red + '</span><span style="font-size:10px;color:#dc2626;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Red (Immediate)</span></div>';
      html += '<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#d97706;">' + scenario.casualties.yellow + '</span><span style="font-size:10px;color:#d97706;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Yellow (Delayed)</span></div>';
      html += '<div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#16a34a;">' + scenario.casualties.green + '</span><span style="font-size:10px;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Green (Minor)</span></div>';
      html += '<div style="background:rgba(148,163,184,.1);border:1px solid rgba(148,163,184,.3);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:18px;font-weight:700;color:#64748b;">' + scenario.casualties.deceased + '</span><span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Deceased</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Resource Requirements</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:16px;">';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.arff + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">ARFF Vehicles</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.ambulances + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Ambulances</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.fireTrucks + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Fire Trucks</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.buses + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Buses</span></div>';
      html += '</div>';

      html += '<h4 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Exercise Injects</h4>';
      html += '<ul class="clean" style="margin:0;">';
      scenario.injects.forEach(function (inject) {
        html += '<li style="padding-left:20px;margin-bottom:8px;font-size:13px;color:var(--card-text);position:relative;"><span style="position:absolute;left:4px;top:8px;width:6px;height:6px;border-radius:2px;background:var(--blue);transform:rotate(45deg);"></span>' + inject + '</li>';
      });
      html += '</ul>';

      panel.innerHTML = html;
    }

    /* ================= TIMELINE / INJECT TRACKER ================= */
    var TIMELINE_STORAGE_KEY = 'ttx-timeline-events';

    var timelineEvents = [];
    var timelineHistory = [];
    var timelineHistoryIndex = -1;
    var MAX_HISTORY = 50;

    var snapshotTimeline = function () {
      return JSON.parse(JSON.stringify(timelineEvents));
    };

    var pushHistory = function () {
      // Remove any redo states
      timelineHistory = timelineHistory.slice(0, timelineHistoryIndex + 1);
      // Add new state
      timelineHistory.push(snapshotTimeline());
      // Limit history size
      if (timelineHistory.length > MAX_HISTORY) {
        timelineHistory.shift();
      } else {
        timelineHistoryIndex++;
      }
    };

    var undoTimeline = function () {
      if (timelineHistoryIndex > 0) {
        timelineHistoryIndex--;
        timelineEvents = JSON.parse(JSON.stringify(timelineHistory[timelineHistoryIndex]));
        saveTimeline();
        renderTimeline();
        updateUndoRedoButtons();
      }
    };

    var redoTimeline = function () {
      if (timelineHistoryIndex < timelineHistory.length - 1) {
        timelineHistoryIndex++;
        timelineEvents = JSON.parse(JSON.stringify(timelineHistory[timelineHistoryIndex]));
        saveTimeline();
        renderTimeline();
        updateUndoRedoButtons();
      }
    };

    var updateUndoRedoButtons = function () {
      var undoBtn = document.getElementById('timelineUndoBtn');
      var redoBtn = document.getElementById('timelineRedoBtn');
      if (undoBtn) undoBtn.disabled = timelineHistoryIndex <= 0;
      if (redoBtn) redoBtn.disabled = timelineHistoryIndex >= timelineHistory.length - 1;
    };

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
      pushHistory();
      timelineEvents = [];
      try { localStorage.removeItem(TIMELINE_STORAGE_KEY); } catch (e) {}
      renderTimeline();
      updateUndoRedoButtons();
    };

    var addTimelineEvent = function (time, text, category) {
      pushHistory();
      timelineEvents.push({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: time,
        text: text,
        category: category || 'info',
        timestamp: new Date().toISOString()
      });
      saveTimeline();
      renderTimeline();
      updateUndoRedoButtons();
    };

    var deleteTimelineEvent = function (id) {
      pushHistory();
      timelineEvents = timelineEvents.filter(function (e) { return e.id !== id; });
      saveTimeline();
      renderTimeline();
      updateUndoRedoButtons();
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
        html += '<div style="flex:1;font-size:13px;color:var(--card-text);">' + evt.text + '</div>';
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
    timelineSection.style.cssText = 'background:var(--panel);border:1px solid var(--line-soft);border-radius:var(--radius);padding:20px;margin-top:20px;color:var(--text);display:none;';

    var timelineHTML = '<h3 style="margin:0 0 16px;font-size:16px;">Exercise Timeline</h3>';

    timelineHTML += '<div style="display:grid;grid-template-columns:100px 1fr 120px auto;gap:8px;margin-bottom:16px;align-items:end;">';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Time</label><input id="timelineTime" type="text" placeholder="09:30" style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"></div>';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Event / Inject</label><input id="timelineText" type="text" placeholder="Describe the event..." style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"></div>';
    timelineHTML += '<div><label style="font-size:11px;color:var(--muted);display:block;margin-bottom:4px;">Category</label><select id="timelineCategory" style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:6px;padding:6px 10px;color:var(--text);font:inherit;font-size:13px;"><option value="info">Info</option><option value="inject">Inject</option><option value="decision">Decision</option><option value="milestone">Milestone</option><option value="casualty">Casualty</option></select></div>';
    timelineHTML += '<button id="timelineAddBtn" class="reset-btn" style="padding:6px 16px;">Add</button>';
    timelineHTML += '</div>';

    timelineHTML += '<div id="timelineContainer" style="max-height:400px;overflow-y:auto;"></div>';

    timelineHTML += '<div style="margin-top:12px;display:flex;gap:8px;">';
    timelineHTML += '<button id="timelineUndoBtn" class="reset-btn" type="button" title="Undo (Ctrl+Z)">↩ Undo</button>';
    timelineHTML += '<button id="timelineRedoBtn" class="reset-btn" type="button" title="Redo (Ctrl+Y)">↪ Redo</button>';
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

    var timelineUndoBtn = document.getElementById('timelineUndoBtn');
    var timelineRedoBtn = document.getElementById('timelineRedoBtn');

    if (timelineUndoBtn) {
      timelineUndoBtn.addEventListener('click', function () {
        undoTimeline();
      });
    }

    if (timelineRedoBtn) {
      timelineRedoBtn.addEventListener('click', function () {
        redoTimeline();
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
    // Initialize history with loaded state
    timelineHistory = [snapshotTimeline()];
    timelineHistoryIndex = 0;
    renderTimeline();
    updateUndoRedoButtons();

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

    /* ================= SCENARIO EDITOR ================= */
    var SCENARIO_STORAGE_KEY = 'ttx-custom-scenarios';
    var allScenarios = TTX_DATA.scenarios.slice(); // copy

    var loadCustomScenarios = function () {
      try {
        var raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
        if (raw) {
          var custom = JSON.parse(raw);
          if (Array.isArray(custom)) {
            // Remove old custom scenarios, then add fresh ones
            allScenarios = TTX_DATA.scenarios.concat(custom);
          }
        }
      } catch (e) {}
    };

    var saveCustomScenarios = function () {
      var custom = allScenarios.filter(function (s) { return s.custom; });
      try { localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(custom)); } catch (e) {}
    };

    loadCustomScenarios();

    // Populate scenario selector with all scenarios
    var scenarioSelect = document.getElementById('scenarioSelect');
    if (scenarioSelect) {
      scenarioSelect.innerHTML = '<option value="">— Select a scenario —</option>';
      allScenarios.forEach(function (sc) {
        var opt = document.createElement('option');
        opt.value = sc.id;
        opt.textContent = sc.name + (sc.custom ? ' (custom)' : '');
        scenarioSelect.appendChild(opt);
      });
    }

    // Modal elements
    var scenarioModal = document.getElementById('scenarioModal');
    var scenarioEditorBtn = document.getElementById('scenarioEditorBtn');
    var closeScenarioModal = document.getElementById('closeScenarioModal');
    var scenarioList = document.getElementById('scenarioList');
    var scenarioForm = document.getElementById('scenarioForm');
    var formTitle = document.getElementById('formTitle');

    if (scenarioEditorBtn) {
      scenarioEditorBtn.addEventListener('click', function () {
        scenarioModal.style.display = 'block';
        renderScenarioList();
      });
    }

    if (closeScenarioModal) {
      closeScenarioModal.addEventListener('click', function () {
        scenarioModal.style.display = 'none';
      });
    }

    // Close modal when clicking outside
    if (scenarioModal) {
      scenarioModal.addEventListener('click', function (e) {
        if (e.target === scenarioModal) scenarioModal.style.display = 'none';
      });
    }

    function renderScenarioList() {
      if (!scenarioList) return;
      var html = '<h3 style="margin:0 0 12px;font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Your Scenarios</h3>';
      html += '<div style="display:flex;flex-direction:column;gap:8px;">';

      allScenarios.forEach(function (sc, idx) {
        var isCustom = !!sc.custom;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text);">' + sc.name + (isCustom ? ' <span style="font-size:10px;color:var(--blue);text-transform:uppercase;">custom</span>' : '') + '</div>';
        html += '<div style="font-size:11px;color:var(--muted);">' + (sc.aircraft || 'No aircraft') + ' · ' + sc.soulsOnBoard + ' souls</div>';
        html += '</div>';
        html += '<button class="reset-btn" style="padding:4px 10px;font-size:11px;" onclick="window.__editScenario(' + idx + ')">Edit</button>';
        if (isCustom) {
          html += '<button class="reset-btn" style="padding:4px 10px;font-size:11px;color:var(--red);" onclick="window.__deleteScenario(' + idx + ')">Delete</button>';
        }
        html += '</div>';
      });

      html += '</div>';

      // Add new scenario button
      html += '<button id="newScenarioBtn" class="reset-btn" type="button" style="margin-top:12px;padding:8px 16px;width:100%;">+ New Scenario</button>';

      scenarioList.innerHTML = html;

      var newBtn = document.getElementById('newScenarioBtn');
      if (newBtn) {
        newBtn.addEventListener('click', function () {
          scenarioForm.style.display = 'block';
          formTitle.textContent = 'New Scenario';
          scenarioForm.dataset.index = '';
          document.getElementById('editName').value = '';
          document.getElementById('editAircraft').value = '';
          document.getElementById('editSouls').value = '';
          document.getElementById('editFuel').value = '';
          document.getElementById('editFire').value = 'false';
          document.getElementById('editCategory').value = 'aircraft';
          document.getElementById('editRed').value = '';
          document.getElementById('editYellow').value = '';
          document.getElementById('editGreen').value = '';
          document.getElementById('editDeceased').value = '';
          document.getElementById('editArff').value = '';
          document.getElementById('editAmbulances').value = '';
          document.getElementById('editFireTrucks').value = '';
          document.getElementById('editBuses').value = '';
          document.getElementById('editInjects').value = '';
        });
      }
    }

    window.__editScenario = function (idx) {
      var sc = allScenarios[idx];
      if (!sc) return;
      scenarioForm.style.display = 'block';
      formTitle.textContent = 'Edit: ' + sc.name;
      scenarioForm.dataset.index = idx;
      document.getElementById('editName').value = sc.name;
      document.getElementById('editAircraft').value = sc.aircraft || '';
      document.getElementById('editSouls').value = sc.soulsOnBoard;
      document.getElementById('editFuel').value = sc.fuelLoad || '';
      document.getElementById('editFire').value = sc.fireInvolved ? 'true' : 'false';
      document.getElementById('editCategory').value = sc.category || 'aircraft';
      document.getElementById('editRed').value = sc.casualties.red;
      document.getElementById('editYellow').value = sc.casualties.yellow;
      document.getElementById('editGreen').value = sc.casualties.green;
      document.getElementById('editDeceased').value = sc.casualties.deceased;
      document.getElementById('editArff').value = sc.resources.arff;
      document.getElementById('editAmbulances').value = sc.resources.ambulances;
      document.getElementById('editFireTrucks').value = sc.resources.fireTrucks;
      document.getElementById('editBuses').value = sc.resources.buses;
      document.getElementById('editInjects').value = sc.injects.join('\n');
    };

    window.__deleteScenario = function (idx) {
      var sc = allScenarios[idx];
      if (!sc) return;
      if (!confirm('Delete scenario "' + sc.name + '"?')) return;
      allScenarios.splice(idx, 1);
      saveCustomScenarios();
      renderScenarioList();
      // Refresh selector
      if (scenarioSelect) {
        scenarioSelect.innerHTML = '<option value="">— Select a scenario —</option>';
        allScenarios.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name + (s.custom ? ' (custom)' : '');
          scenarioSelect.appendChild(opt);
        });
      }
    };

    var saveScenarioBtn = document.getElementById('saveScenarioBtn');
    var cancelScenarioBtn = document.getElementById('cancelScenarioBtn');

    if (saveScenarioBtn) {
      saveScenarioBtn.addEventListener('click', function () {
        var name = document.getElementById('editName').value.trim();
        if (!name) { alert('Please enter a scenario name.'); return; }

        var idx = scenarioForm.dataset.index;
        var scenario = {
          id: idx !== '' ? allScenarios[idx].id : 'custom-' + Date.now(),
          name: name,
          aircraft: document.getElementById('editAircraft').value.trim() || null,
          soulsOnBoard: parseInt(document.getElementById('editSouls').value) || 0,
          fuelLoad: document.getElementById('editFuel').value.trim() || 'N/A',
          fireInvolved: document.getElementById('editFire').value === 'true',
          category: document.getElementById('editCategory').value,
          casualties: {
            red: parseInt(document.getElementById('editRed').value) || 0,
            yellow: parseInt(document.getElementById('editYellow').value) || 0,
            green: parseInt(document.getElementById('editGreen').value) || 0,
            deceased: parseInt(document.getElementById('editDeceased').value) || 0
          },
          resources: {
            arff: parseInt(document.getElementById('editArff').value) || 0,
            ambulances: parseInt(document.getElementById('editAmbulances').value) || 0,
            fireTrucks: parseInt(document.getElementById('editFireTrucks').value) || 0,
            buses: parseInt(document.getElementById('editBuses').value) || 0
          },
          injects: document.getElementById('editInjects').value.split('\n').filter(function (l) { return l.trim(); }),
          custom: true
        };

        if (idx !== '') {
          allScenarios[idx] = scenario;
        } else {
          allScenarios.push(scenario);
        }

        saveCustomScenarios();
        scenarioForm.style.display = 'none';
        renderScenarioList();

        // Refresh selector
        if (scenarioSelect) {
          scenarioSelect.innerHTML = '<option value="">— Select a scenario —</option>';
          allScenarios.forEach(function (s) {
            var opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name + (s.custom ? ' (custom)' : '');
            scenarioSelect.appendChild(opt);
          });
        }
      });
    }

    if (cancelScenarioBtn) {
      cancelScenarioBtn.addEventListener('click', function () {
        scenarioForm.style.display = 'none';
      });
    }

    /* ================= PRINT ================= */
    var printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        // Set print date
        var printDate = document.getElementById('printDate');
        if (printDate) printDate.textContent = new Date().toLocaleString();

        // Temporarily show all sections for printing
        var views = document.querySelectorAll('.view');
        views.forEach(function (v) { v.style.display = 'block'; });

        // Show print header
        var printHeader = document.querySelector('.print-header');
        if (printHeader) printHeader.style.display = 'block';

        // Trigger print
        window.print();

        // Restore after printing
        setTimeout(function () {
          views.forEach(function (v) { v.style.display = ''; });
          if (printHeader) printHeader.style.display = 'none';
        }, 500);
      });
    }

    /* ================= ICS FORM GENERATOR ================= */
    var icsBtn = document.getElementById('icsBtn');
    var icsModal = document.getElementById('icsModal');
    var closeIcsModal = document.getElementById('closeIcsModal');
    var icsContent = document.getElementById('icsContent');
    var icsDownloadBtn = document.getElementById('icsDownloadBtn');
    var icsCopyBtn = document.getElementById('icsCopyBtn');

    var generateICSForms = function () {
      var scenarioSelect = document.getElementById('scenarioSelect');
      var scenario = null;
      if (scenarioSelect && scenarioSelect.value) {
        scenario = allScenarios.find(function (s) { return s.id === scenarioSelect.value; });
      }

      var now = new Date();
      var dateStr = now.toISOString().slice(0, 10);
      var timeStr = now.toTimeString().slice(0, 5);

      var report = '';
      report += '=================================================================\n';
      report += '  ICS 201 — INCIDENT BRIEFING\n';
      report += '=================================================================\n\n';
      report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
      report += '2. Date/Time Prepared: ' + dateStr + ' ' + timeStr + '\n';
      report += '3. Incident Commander: _________________________\n';
      report += '4. Agency: Airport Emergency Management\n';
      report += '5. Incident Type: ' + (scenario ? (scenario.category || 'aircraft') : 'Exercise') + '\n\n';

      report += '6. Situation Summary:\n';
      if (scenario) {
        report += '   - Aircraft: ' + (scenario.aircraft || 'N/A') + '\n';
        report += '   - Souls on Board: ' + scenario.soulsOnBoard + '\n';
        report += '   - Fuel Load: ' + scenario.fuelLoad + '\n';
        report += '   - Fire Involved: ' + (scenario.fireInvolved ? 'Yes' : 'No') + '\n';
        report += '   - Estimated Casualties: Red=' + scenario.casualties.red + ', Yellow=' + scenario.casualties.yellow + ', Green=' + scenario.casualties.green + ', Deceased=' + scenario.casualties.deceased + '\n';
      } else {
        report += '   No scenario selected. Select a scenario to auto-populate.\n';
      }
      report += '\n';

      report += '7. Current Actions:\n';
      if (timelineEvents.length > 0) {
        timelineEvents.forEach(function (evt) {
          report += '   [' + evt.time + '] ' + evt.text + '\n';
        });
      } else {
        report += '   No actions recorded.\n';
      }
      report += '\n';

      report += '8. Resource Requirements:\n';
      if (scenario) {
        report += '   - ARFF Vehicles: ' + scenario.resources.arff + '\n';
        report += '   - Ambulances: ' + scenario.resources.ambulances + '\n';
        report += '   - Fire Trucks: ' + scenario.resources.fireTrucks + '\n';
        report += '   - Buses: ' + scenario.resources.buses + '\n';
      }
      report += '\n';

      report += '=================================================================\n';
      report += '  ICS 202 — INCIDENT OBJECTIVES\n';
      report += '=================================================================\n\n';
      report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
      report += '2. Operational Period: ' + dateStr + ' ' + timeStr + ' — Ongoing\n\n';
      report += '3. Objectives:\n';
      report += '   a. Establish Incident Command Post and command structure\n';
      report += '   b. Ensure life safety — rescue and triage casualties\n';
      report += '   c. Contain and control the hazard\n';
      report += '   d. Establish hot/warm/cold zones and cordons\n';
      report += '   e. Coordinate multi-agency response\n';
      report += '   f. Establish Family Assistance Center\n';
      report += '   g. Manage media and public information\n';
      report += '   h. Document all actions for After Action Report\n\n';

      report += '4. Strategy:\n';
      report += '   - Prioritize life safety over property conservation\n';
      report += '   - Establish unified command with all responding agencies\n';
      report += '   - Maintain span of control (3-7 subordinates per supervisor)\n\n';

      report += '=================================================================\n';
      report += '  ICS 203 — ORGANIZATION ASSIGNMENT LIST\n';
      report += '=================================================================\n\n';
      report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
      report += '2. Date/Time Prepared: ' + dateStr + ' ' + timeStr + '\n\n';
      report += '3. Command Staff:\n';
      report += '   Incident Commander: _________________________\n';
      report += '   Safety Officer: _________________________\n';
      report += '   Public Information Officer: _________________________\n';
      report += '   Liaison Officer: _________________________\n\n';

      report += '4. Operations Section:\n';
      report += '   Operations Section Chief: _________________________\n';
      report += '   ARFF Group: _________________________\n';
      report += '   EMS/Triage Group: _________________________\n';
      report += '   Security/Perimeter Group: _________________________\n\n';

      report += '5. Planning Section:\n';
      report += '   Planning Section Chief: _________________________\n';
      report += '   Situation Unit: _________________________\n';
      report += '   Resources Unit: _________________________\n\n';

      report += '6. Logistics Section:\n';
      report += '   Logistics Section Chief: _________________________\n';
      report += '   Staging Area Manager: _________________________\n';
      report += '   Communications Unit: _________________________\n\n';

      report += '=================================================================\n';
      report += '  END OF ICS FORMS\n';
      report += '=================================================================\n';

      return report;
    };

    if (icsBtn) {
      icsBtn.addEventListener('click', function () {
        icsModal.style.display = 'block';
        icsContent.textContent = generateICSForms();
      });
    }

    if (closeIcsModal) {
      closeIcsModal.addEventListener('click', function () {
        icsModal.style.display = 'none';
      });
    }

    if (icsModal) {
      icsModal.addEventListener('click', function (e) {
        if (e.target === icsModal) icsModal.style.display = 'none';
      });
    }

    if (icsDownloadBtn) {
      icsDownloadBtn.addEventListener('click', function () {
        var content = icsContent.textContent;
        var blob = new Blob([content], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ICS-Forms-' + new Date().toISOString().slice(0, 10) + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (icsCopyBtn) {
      icsCopyBtn.addEventListener('click', function () {
        var content = icsContent.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(content).then(function () {
            icsCopyBtn.textContent = 'Copied!';
            setTimeout(function () { icsCopyBtn.textContent = 'Copy to Clipboard'; }, 2000);
          });
        } else {
          // Fallback
          var ta = document.createElement('textarea');
          ta.value = content;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          icsCopyBtn.textContent = 'Copied!';
          setTimeout(function () { icsCopyBtn.textContent = 'Copy to Clipboard'; }, 2000);
        }
      });
    }

    /* ================= RESOURCE TRACKER ================= */
    var RESOURCE_STORAGE_KEY = 'ttx-resource-tracker';
    var resourceBtn = document.getElementById('resourceBtn');
    var resourceModal = document.getElementById('resourceModal');
    var closeResourceModal = document.getElementById('closeResourceModal');
    var resourceContent = document.getElementById('resourceContent');
    var resourceExportBtn = document.getElementById('resourceExportBtn');
    var resourceResetBtn = document.getElementById('resourceResetBtn');

    var defaultResources = [
      { id: 'arff1', name: 'ARFF Vehicle 1', type: 'ARFF', status: 'available', location: '', notes: '' },
      { id: 'arff2', name: 'ARFF Vehicle 2', type: 'ARFF', status: 'available', location: '', notes: '' },
      { id: 'amb1', name: 'Ambulance 1', type: 'EMS', status: 'available', location: '', notes: '' },
      { id: 'amb2', name: 'Ambulance 2', type: 'EMS', status: 'available', location: '', notes: '' },
      { id: 'amb3', name: 'Ambulance 3', type: 'EMS', status: 'available', location: '', notes: '' },
      { id: 'ft1', name: 'Fire Truck 1', type: 'Fire', status: 'available', location: '', notes: '' },
      { id: 'ft2', name: 'Fire Truck 2', type: 'Fire', status: 'available', location: '', notes: '' },
      { id: 'bus1', name: 'Bus 1', type: 'Transport', status: 'available', location: '', notes: '' },
      { id: 'police1', name: 'Police Unit 1', type: 'Security', status: 'available', location: '', notes: '' },
      { id: 'medic1', name: 'Medical Team 1', type: 'Medical', status: 'available', location: '', notes: '' }
    ];

    var resources = [];

    var loadResources = function () {
      try {
        var raw = localStorage.getItem(RESOURCE_STORAGE_KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length > 0) {
            resources = saved;
            return;
          }
        }
      } catch (e) {}
      resources = JSON.parse(JSON.stringify(defaultResources));
    };

    var saveResources = function () {
      try { localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(resources)); } catch (e) {}
    };

    var renderResources = function () {
      if (!resourceContent) return;

      var html = '';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';

      resources.forEach(function (res, idx) {
        var statusColor = res.status === 'available' ? 'var(--green)' : res.status === 'deployed' ? 'var(--amber)' : 'var(--red)';
        var statusBg = res.status === 'available' ? 'rgba(34,197,94,.1)' : res.status === 'deployed' ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)';

        html += '<div style="padding:14px;border:1px solid var(--line-soft);border-radius:10px;background:' + statusBg + ';">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
        html += '<div>';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text);">' + res.name + '</div>';
        html += '<div style="font-size:11px;color:var(--muted);">' + res.type + '</div>';
        html += '</div>';
        html += '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:' + statusColor + ';">' + res.status + '</span>';
        html += '</div>';

        html += '<div style="margin-bottom:8px;">';
        html += '<label style="font-size:10px;color:var(--muted);display:block;margin-bottom:2px;">Location</label>';
        html += '<input type="text" value="' + (res.location || '') + '" placeholder="e.g., Apron, Terminal, Runway" style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:4px;padding:4px 8px;color:var(--text);font:inherit;font-size:12px;" onchange="window.__updateResource(' + idx + ',\'location\',this.value)">';
        html += '</div>';

        html += '<div style="margin-bottom:10px;">';
        html += '<label style="font-size:10px;color:var(--muted);display:block;margin-bottom:2px;">Notes</label>';
        html += '<input type="text" value="' + (res.notes || '') + '" placeholder="Optional notes" style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:4px;padding:4px 8px;color:var(--text);font:inherit;font-size:12px;" onchange="window.__updateResource(' + idx + ',\'notes\',this.value)">';
        html += '</div>';

        html += '<div style="display:flex;gap:6px;">';
        html += '<button class="reset-btn" style="flex:1;padding:4px 8px;font-size:11px;" onclick="window.__setResourceStatus(' + idx + ',\'available\')">Available</button>';
        html += '<button class="reset-btn" style="flex:1;padding:4px 8px;font-size:11px;" onclick="window.__setResourceStatus(' + idx + ',\'deployed\')">Deploy</button>';
        html += '<button class="reset-btn" style="flex:1;padding:4px 8px;font-size:11px;" onclick="window.__setResourceStatus(' + idx + ',\'unavailable\')">Unavailable</button>';
        html += '</div>';

        html += '</div>';
      });

      html += '</div>';

      // Summary
      var available = resources.filter(function (r) { return r.status === 'available'; }).length;
      var deployed = resources.filter(function (r) { return r.status === 'deployed'; }).length;
      var unavailable = resources.filter(function (r) { return r.status === 'unavailable'; }).length;

      html += '<div style="margin-top:16px;padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;display:flex;gap:20px;">';
      html += '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--green);">' + available + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Available</div></div>';
      html += '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--amber);">' + deployed + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Deployed</div></div>';
      html += '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--red);">' + unavailable + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Unavailable</div></div>';
      html += '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--text);">' + resources.length + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Total</div></div>';
      html += '</div>';

      resourceContent.innerHTML = html;
    };

    window.__updateResource = function (idx, field, value) {
      if (resources[idx]) {
        resources[idx][field] = value;
        saveResources();
      }
    };

    window.__setResourceStatus = function (idx, status) {
      if (resources[idx]) {
        resources[idx].status = status;
        saveResources();
        renderResources();
      }
    };

    if (resourceBtn) {
      resourceBtn.addEventListener('click', function () {
        resourceModal.style.display = 'block';
        renderResources();
      });
    }

    if (closeResourceModal) {
      closeResourceModal.addEventListener('click', function () {
        resourceModal.style.display = 'none';
      });
    }

    if (resourceModal) {
      resourceModal.addEventListener('click', function (e) {
        if (e.target === resourceModal) resourceModal.style.display = 'none';
      });
    }

    if (resourceExportBtn) {
      resourceExportBtn.addEventListener('click', function () {
        var report = 'RESOURCE STATUS REPORT\n';
        report += 'Generated: ' + new Date().toLocaleString() + '\n';
        report += '==========================================\n\n';
        resources.forEach(function (res) {
          report += res.name + ' (' + res.type + ')\n';
          report += '  Status: ' + res.status + '\n';
          report += '  Location: ' + (res.location || 'N/A') + '\n';
          report += '  Notes: ' + (res.notes || 'N/A') + '\n\n';
        });
        var blob = new Blob([report], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Resource-Status-' + new Date().toISOString().slice(0, 10) + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (resourceResetBtn) {
      resourceResetBtn.addEventListener('click', function () {
        if (confirm('Reset all resources to available?')) {
          resources = JSON.parse(JSON.stringify(defaultResources));
          saveResources();
          renderResources();
        }
      });
    }

    loadResources();

    /* ================= CASUALTY TRACKER ================= */
    var CASUALTY_STORAGE_KEY = 'ttx-casualty-tracker';
    var casualtyBtn = document.getElementById('casualtyBtn');
    var casualtyModal = document.getElementById('casualtyModal');
    var closeCasualtyModal = document.getElementById('closeCasualtyModal');
    var casualtySummary = document.getElementById('casualtySummary');
    var casualtyList = document.getElementById('casualtyList');
    var casualtyExportBtn = document.getElementById('casualtyExportBtn');
    var casualtyClearBtn = document.getElementById('casualtyClearBtn');
    var addCasualtyBtn = document.getElementById('addCasualtyBtn');

    var casualties = [];

    var loadCasualties = function () {
      try {
        var raw = localStorage.getItem(CASUALTY_STORAGE_KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (Array.isArray(saved)) {
            casualties = saved;
          }
        }
      } catch (e) {}
    };

    var saveCasualties = function () {
      try { localStorage.setItem(CASUALTY_STORAGE_KEY, JSON.stringify(casualties)); } catch (e) {}
    };

    var renderCasualtySummary = function () {
      if (!casualtySummary) return;
      var red = casualties.filter(function (c) { return c.triage === 'red'; }).length;
      var yellow = casualties.filter(function (c) { return c.triage === 'yellow'; }).length;
      var green = casualties.filter(function (c) { return c.triage === 'green'; }).length;
      var deceased = casualties.filter(function (c) { return c.triage === 'deceased'; }).length;
      var transported = casualties.filter(function (c) { return c.transported; }).length;

      casualtySummary.innerHTML =
        '<div style="display:flex;gap:16px;padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#dc2626;">' + red + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Red</div></div>' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#d97706;">' + yellow + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Yellow</div></div>' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#16a34a;">' + green + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Green</div></div>' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#64748b;">' + deceased + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Deceased</div></div>' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--blue);">' + transported + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Transported</div></div>' +
        '<div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--text);">' + casualties.length + '</div><div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Total</div></div>' +
        '</div>';
    };

    var renderCasualties = function () {
      if (!casualtyList) return;

      if (casualties.length === 0) {
        casualtyList.innerHTML = '<p style="color:var(--muted);margin:0;font-size:13px;">No casualties recorded yet. Use the form above to add casualties.</p>';
        return;
      }

      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';

      casualties.forEach(function (cas, idx) {
        var triageColor = cas.triage === 'red' ? '#dc2626' : cas.triage === 'yellow' ? '#d97706' : cas.triage === 'green' ? '#16a34a' : '#64748b';
        var triageBg = cas.triage === 'red' ? 'rgba(220,38,38,.1)' : cas.triage === 'yellow' ? 'rgba(217,119,6,.1)' : cas.triage === 'green' ? 'rgba(22,163,74,.1)' : 'rgba(100,116,139,.1)';

        html += '<div style="padding:14px;border:1px solid var(--line-soft);border-radius:10px;background:' + triageBg + ';">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
        html += '<div>';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text);">Tag #' + (cas.tag || '—') + '</div>';
        html += '<div style="font-size:11px;color:' + triageColor + ';font-weight:600;text-transform:uppercase;">' + cas.triage + '</div>';
        html += '</div>';
        html += '<button class="reset-btn" style="padding:2px 8px;font-size:11px;" onclick="window.__deleteCasualty(' + idx + ')">×</button>';
        html += '</div>';

        if (cas.location) {
          html += '<div style="font-size:12px;color:var(--muted);margin-bottom:4px;">📍 ' + cas.location + '</div>';
        }
        if (cas.notes) {
          html += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">' + cas.notes + '</div>';
        }

        html += '<div style="display:flex;gap:6px;">';
        html += '<button class="reset-btn" style="flex:1;padding:4px 8px;font-size:11px;' + (cas.transported ? 'background:var(--green);color:#fff;border-color:var(--green);' : '') + '" onclick="window.__toggleTransported(' + idx + ')">' + (cas.transported ? '✓ Transported' : 'Mark Transported') + '</button>';
        html += '</div>';

        html += '</div>';
      });

      html += '</div>';
      casualtyList.innerHTML = html;
    };

    window.__deleteCasualty = function (idx) {
      if (confirm('Delete this casualty record?')) {
        casualties.splice(idx, 1);
        saveCasualties();
        renderCasualtySummary();
        renderCasualties();
      }
    };

    window.__toggleTransported = function (idx) {
      if (casualties[idx]) {
        casualties[idx].transported = !casualties[idx].transported;
        saveCasualties();
        renderCasualtySummary();
        renderCasualties();
      }
    };

    if (addCasualtyBtn) {
      addCasualtyBtn.addEventListener('click', function () {
        var tag = document.getElementById('casTag').value.trim();
        var triage = document.getElementById('casTriage').value;
        var location = document.getElementById('casLocation').value.trim();
        var notes = document.getElementById('casNotes').value.trim();

        casualties.push({
          tag: tag,
          triage: triage,
          location: location,
          notes: notes,
          transported: false,
          timestamp: new Date().toISOString()
        });

        saveCasualties();
        renderCasualtySummary();
        renderCasualties();

        // Clear form
        document.getElementById('casTag').value = '';
        document.getElementById('casLocation').value = '';
        document.getElementById('casNotes').value = '';
      });
    }

    if (casualtyBtn) {
      casualtyBtn.addEventListener('click', function () {
        casualtyModal.style.display = 'block';
        renderCasualtySummary();
        renderCasualties();
      });
    }

    if (closeCasualtyModal) {
      closeCasualtyModal.addEventListener('click', function () {
        casualtyModal.style.display = 'none';
      });
    }

    if (casualtyModal) {
      casualtyModal.addEventListener('click', function (e) {
        if (e.target === casualtyModal) casualtyModal.style.display = 'none';
      });
    }

    if (casualtyExportBtn) {
      casualtyExportBtn.addEventListener('click', function () {
        var report = 'CASUALTY REPORT\n';
        report += 'Generated: ' + new Date().toLocaleString() + '\n';
        report += '==========================================\n\n';
        casualties.forEach(function (cas) {
          report += 'Tag #' + (cas.tag || '—') + '\n';
          report += '  Triage: ' + cas.triage + '\n';
          report += '  Location: ' + (cas.location || 'N/A') + '\n';
          report += '  Notes: ' + (cas.notes || 'N/A') + '\n';
          report += '  Transported: ' + (cas.transported ? 'Yes' : 'No') + '\n\n';
        });
        var blob = new Blob([report], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Casualty-Report-' + new Date().toISOString().slice(0, 10) + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (casualtyClearBtn) {
      casualtyClearBtn.addEventListener('click', function () {
        if (confirm('Clear all casualty records?')) {
          casualties = [];
          saveCasualties();
          renderCasualtySummary();
          renderCasualties();
        }
      });
    }

    loadCasualties();

    /* ================= WEATHER INTEGRATION ================= */
    var weatherBtn = document.getElementById('weatherBtn');
    var weatherModal = document.getElementById('weatherModal');
    var closeWeatherModal = document.getElementById('closeWeatherModal');
    var weatherLocation = document.getElementById('weatherLocation');
    var fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
    var weatherResult = document.getElementById('weatherResult');

    var getWeatherIcon = function (code) {
      if (code >= 200 && code < 300) return '⛈️';
      if (code >= 300 && code < 400) return '🌦️';
      if (code >= 500 && code < 600) return '🌧️';
      if (code >= 600 && code < 700) return '🌨️';
      if (code >= 700 && code < 800) return '🌫️';
      if (code === 800) return '☀️';
      if (code === 801) return '🌤️';
      if (code === 802) return '⛅';
      if (code >= 803) return '☁️';
      return '🌡️';
    };

    var fetchWeather = function (location) {
      if (!location) {
        weatherResult.innerHTML = '<p style="color:var(--red);margin:0;">Please enter a location.</p>';
        return;
      }

      weatherResult.innerHTML = '<p style="color:var(--muted);margin:0;">Fetching weather data...</p>';

      // Use Open-Meteo API (free, no API key required)
      var geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(location) + '&count=1&language=en&format=json';

      fetch(geoUrl)
        .then(function (res) { return res.json(); })
        .then(function (geoData) {
          if (!geoData.results || geoData.results.length === 0) {
            weatherResult.innerHTML = '<p style="color:var(--red);margin:0;">Location not found. Try a different city or airport name.</p>';
            return;
          }

          var lat = geoData.results[0].latitude;
          var lon = geoData.results[0].longitude;
          var name = geoData.results[0].name;
          var country = geoData.results[0].country || '';

          var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&timezone=auto';

          return fetch(weatherUrl)
            .then(function (res) { return res.json(); })
            .then(function (weatherData) {
              var current = weatherData.current;
              var temp = current.temperature_2m;
              var feelsLike = current.apparent_temperature;
              var humidity = current.relative_humidity_2m;
              var windSpeed = current.wind_speed_10m;
              var windDir = current.wind_direction_10m;
              var pressure = current.pressure_msl;
              var weatherCode = current.weather_code;
              var icon = getWeatherIcon(weatherCode);

              var windDirText = '';
              if (windDir >= 337.5 || windDir < 22.5) windDirText = 'N';
              else if (windDir >= 22.5 && windDir < 67.5) windDirText = 'NE';
              else if (windDir >= 67.5 && windDir < 112.5) windDirText = 'E';
              else if (windDir >= 112.5 && windDir < 157.5) windDirText = 'SE';
              else if (windDir >= 157.5 && windDir < 202.5) windDirText = 'S';
              else if (windDir >= 202.5 && windDir < 247.5) windDirText = 'SW';
              else if (windDir >= 247.5 && windDir < 292.5) windDirText = 'W';
              else windDirText = 'NW';

              var html = '';
              html += '<div style="text-align:center;padding:20px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:10px;">';
              html += '<div style="font-size:48px;margin-bottom:8px;">' + icon + '</div>';
              html += '<div style="font-size:14px;font-weight:600;color:var(--text);">' + name + (country ? ', ' + country : '') + '</div>';
              html += '<div style="font-size:32px;font-weight:700;color:var(--text);margin:8px 0;">' + temp + '°C</div>';
              html += '<div style="font-size:12px;color:var(--muted);">Feels like ' + feelsLike + '°C</div>';
              html += '</div>';

              html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">';
              html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
              html += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Wind</div>';
              html += '<div style="font-size:16px;font-weight:600;color:var(--text);">' + windSpeed + ' km/h ' + windDirText + '</div>';
              html += '</div>';
              html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
              html += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Humidity</div>';
              html += '<div style="font-size:16px;font-weight:600;color:var(--text);">' + humidity + '%</div>';
              html += '</div>';
              html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
              html += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Pressure</div>';
              html += '<div style="font-size:16px;font-weight:600;color:var(--text);">' + pressure + ' hPa</div>';
              html += '</div>';
              html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
              html += '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;">Wind Direction</div>';
              html += '<div style="font-size:16px;font-weight:600;color:var(--text);">' + windDir + '° ' + windDirText + '</div>';
              html += '</div>';
              html += '</div>';

              // Exercise impact assessment
              html += '<div style="margin-top:12px;padding:12px;background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.28);border-left:3px solid var(--blue);border-radius:8px;">';
              html += '<div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:4px;">Exercise Impact Assessment</div>';
              var impacts = [];
              if (windSpeed > 30) impacts.push('⚠️ High winds may affect smoke drift and helicopter operations');
              if (temp > 35) impacts.push('⚠️ Extreme heat — monitor responders for heat stress');
              if (temp < 5) impacts.push('⚠️ Cold conditions — consider hypothermia risk for casualties');
              if (weatherCode >= 500 && weatherCode < 600) impacts.push('🌧️ Rain may affect visibility and runway conditions');
              if (weatherCode >= 200 && weatherCode < 300) impacts.push('⛈️ Thunderstorms — consider lightning safety for outdoor operations');
              if (impacts.length === 0) impacts.push('✅ Weather conditions are favorable for exercise operations');
              impacts.forEach(function (imp) {
                html += '<div style="font-size:12px;color:var(--card-text);margin-top:4px;">' + imp + '</div>';
              });
              html += '</div>';

              weatherResult.innerHTML = html;
            });
        })
        .catch(function (err) {
          weatherResult.innerHTML = '<p style="color:var(--red);margin:0;">Failed to fetch weather data. Please check your internet connection and try again.</p>';
        });
    };

    if (weatherBtn) {
      weatherBtn.addEventListener('click', function () {
        weatherModal.style.display = 'block';
      });
    }

    if (closeWeatherModal) {
      closeWeatherModal.addEventListener('click', function () {
        weatherModal.style.display = 'none';
      });
    }

    if (weatherModal) {
      weatherModal.addEventListener('click', function (e) {
        if (e.target === weatherModal) weatherModal.style.display = 'none';
      });
    }

    if (fetchWeatherBtn) {
      fetchWeatherBtn.addEventListener('click', function () {
        fetchWeather(weatherLocation.value.trim());
      });
    }

    if (weatherLocation) {
      weatherLocation.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          fetchWeather(weatherLocation.value.trim());
        }
      });
    }

    /* ================= EXPORT TO PDF ================= */
    var exportPdfBtn = document.getElementById('exportPdfBtn');

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', function () {
        // Get current scenario
        var scenarioSelect = document.getElementById('scenarioSelect');
        var scenario = null;
        if (scenarioSelect && scenarioSelect.value) {
          scenario = allScenarios.find(function (s) { return s.id === scenarioSelect.value; });
        }

        // Build comprehensive exercise package
        var now = new Date();
        var dateStr = now.toISOString().slice(0, 10);
        var timeStr = now.toTimeString().slice(0, 5);

        var report = '';
        report += '=================================================================\n';
        report += '  AIRPORT EMERGENCY EXERCISE — COMPLETE EXERCISE PACKAGE\n';
        report += '=================================================================\n\n';
        report += 'Generated: ' + dateStr + ' ' + timeStr + '\n';
        report += '=================================================================\n\n';

        // Section 1: Scenario Details
        report += '-----------------------------------------------------------------\n';
        report += 'SECTION 1: SCENARIO DETAILS\n';
        report += '-----------------------------------------------------------------\n\n';
        if (scenario) {
          report += 'Scenario Name: ' + scenario.name + '\n';
          report += 'Aircraft: ' + (scenario.aircraft || 'N/A') + '\n';
          report += 'Souls on Board: ' + scenario.soulsOnBoard + '\n';
          report += 'Fuel Load: ' + scenario.fuelLoad + '\n';
          report += 'Fire Involved: ' + (scenario.fireInvolved ? 'Yes' : 'No') + '\n';
          report += 'Category: ' + (scenario.category || 'aircraft') + '\n\n';
          report += 'Estimated Casualties:\n';
          report += '  Red (Immediate): ' + scenario.casualties.red + '\n';
          report += '  Yellow (Delayed): ' + scenario.casualties.yellow + '\n';
          report += '  Green (Minor): ' + scenario.casualties.green + '\n';
          report += '  Deceased: ' + scenario.casualties.deceased + '\n\n';
          report += 'Resource Requirements:\n';
          report += '  ARFF Vehicles: ' + scenario.resources.arff + '\n';
          report += '  Ambulances: ' + scenario.resources.ambulances + '\n';
          report += '  Fire Trucks: ' + scenario.resources.fireTrucks + '\n';
          report += '  Buses: ' + scenario.resources.buses + '\n\n';
          report += 'Exercise Injects:\n';
          scenario.injects.forEach(function (inject) {
            report += '  ' + inject + '\n';
          });
        } else {
          report += 'No scenario selected.\n';
        }
        report += '\n';

        // Section 2: ICS Forms
        report += '-----------------------------------------------------------------\n';
        report += 'SECTION 2: ICS FORMS\n';
        report += '-----------------------------------------------------------------\n\n';
        report += 'ICS 201 — INCIDENT BRIEFING\n\n';
        report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
        report += '2. Date/Time Prepared: ' + dateStr + ' ' + timeStr + '\n';
        report += '3. Incident Commander: _________________________\n';
        report += '4. Agency: Airport Emergency Management\n';
        report += '5. Incident Type: ' + (scenario ? (scenario.category || 'aircraft') : 'Exercise') + '\n\n';
        report += '6. Current Actions:\n';
        if (timelineEvents.length > 0) {
          timelineEvents.forEach(function (evt) {
            report += '   [' + evt.time + '] ' + evt.text + '\n';
          });
        } else {
          report += '   No actions recorded.\n';
        }
        report += '\n';

        report += 'ICS 202 — INCIDENT OBJECTIVES\n\n';
        report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
        report += '2. Operational Period: ' + dateStr + ' ' + timeStr + ' — Ongoing\n\n';
        report += '3. Objectives:\n';
        report += '   a. Establish Incident Command Post and command structure\n';
        report += '   b. Ensure life safety — rescue and triage casualties\n';
        report += '   c. Contain and control the hazard\n';
        report += '   d. Establish hot/warm/cold zones and cordons\n';
        report += '   e. Coordinate multi-agency response\n';
        report += '   f. Establish Family Assistance Center\n';
        report += '   g. Manage media and public information\n';
        report += '   h. Document all actions for After Action Report\n\n';

        report += 'ICS 203 — ORGANIZATION ASSIGNMENT LIST\n\n';
        report += '1. Incident Name: ' + (scenario ? scenario.name : 'Airport Emergency Exercise') + '\n';
        report += '2. Date/Time Prepared: ' + dateStr + ' ' + timeStr + '\n\n';
        report += '3. Command Staff:\n';
        report += '   Incident Commander: _________________________\n';
        report += '   Safety Officer: _________________________\n';
        report += '   Public Information Officer: _________________________\n';
        report += '   Liaison Officer: _________________________\n\n';
        report += '4. Operations Section:\n';
        report += '   Operations Section Chief: _________________________\n';
        report += '   ARFF Group: _________________________\n';
        report += '   EMS/Triage Group: _________________________\n';
        report += '   Security/Perimeter Group: _________________________\n\n';
        report += '5. Planning Section:\n';
        report += '   Planning Section Chief: _________________________\n';
        report += '   Situation Unit: _________________________\n';
        report += '   Resources Unit: _________________________\n\n';
        report += '6. Logistics Section:\n';
        report += '   Logistics Section Chief: _________________________\n';
        report += '   Staging Area Manager: _________________________\n';
        report += '   Communications Unit: _________________________\n\n';

        // Section 3: Resource Status
        report += '-----------------------------------------------------------------\n';
        report += 'SECTION 3: RESOURCE STATUS\n';
        report += '-----------------------------------------------------------------\n\n';
        if (resources.length > 0) {
          resources.forEach(function (res) {
            report += res.name + ' (' + res.type + ')\n';
            report += '  Status: ' + res.status + '\n';
            report += '  Location: ' + (res.location || 'N/A') + '\n';
            report += '  Notes: ' + (res.notes || 'N/A') + '\n\n';
          });
        } else {
          report += 'No resources tracked.\n\n';
        }

        // Section 4: Casualty Report
        report += '-----------------------------------------------------------------\n';
        report += 'SECTION 4: CASUALTY REPORT\n';
        report += '-----------------------------------------------------------------\n\n';
        if (casualties.length > 0) {
          casualties.forEach(function (cas) {
            report += 'Tag #' + (cas.tag || '—') + '\n';
            report += '  Triage: ' + cas.triage + '\n';
            report += '  Location: ' + (cas.location || 'N/A') + '\n';
            report += '  Notes: ' + (cas.notes || 'N/A') + '\n';
            report += '  Transported: ' + (cas.transported ? 'Yes' : 'No') + '\n\n';
          });
        } else {
          report += 'No casualties recorded.\n\n';
        }

        // Section 5: Checklist
        report += '-----------------------------------------------------------------\n';
        report += 'SECTION 5: IC CHECKLIST\n';
        report += '-----------------------------------------------------------------\n\n';
        var checklistState = [];
        try {
          var raw = localStorage.getItem('ttx-checklist-state');
          if (raw) checklistState = JSON.parse(raw);
        } catch (e) {}
        TTX_DATA.checklistItems.forEach(function (item, idx) {
          var checked = checklistState[idx] === true;
          report += (checked ? '[✓]' : '[ ]') + ' ' + item + '\n';
        });

        report += '\n=================================================================\n';
        report += '  END OF EXERCISE PACKAGE\n';
        report += '=================================================================\n';

        // Create a hidden iframe and use print-to-PDF
        var iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write('<html><head><title>Airport Emergency Exercise Package</title>');
        doc.write('<style>');
        doc.write('body{font-family:monospace;font-size:11px;line-height:1.5;padding:40px;color:#000;}');
        doc.write('pre{white-space:pre-wrap;font-family:monospace;font-size:11px;}');
        doc.write('</style></head><body>');
        doc.write('<pre>' + report.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
        doc.write('</body></html>');
        doc.close();

        // Wait for content to load, then trigger print
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Remove iframe after print dialog closes
        setTimeout(function () {
          document.body.removeChild(iframe);
        }, 1000);
      });
    }

  } catch (err) {
    if (window.console) console.warn('Enhancement script skipped:', err);
  }

})();
