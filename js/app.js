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

    /* ================= SAVE CHIP ================= */
    // Subtle "✓ saved" confirmation shown in the scenario row whenever
    // something is written to browser storage.
    var flashSaved = function (label) {
      var chip = document.getElementById('saveChip');
      if (!chip) return;
      chip.textContent = '✓ ' + (label || 'saved');
      chip.classList.add('on');
      clearTimeout(flashSaved._t);
      flashSaved._t = setTimeout(function () {
        chip.classList.remove('on');
      }, 1800);
    };

    /* ================= RESTORE POINTS (snapshots) ================= */
    // A rolling snapshot of the mutable exercise state so users can roll
    // back after a destructive action (clear all, reset, import …).
    var SNAPSHOT_KEY = 'ttx-restore-points';
    var SNAPSHOT_MAX = 15;

    var collectState = function () {
      var pick = function (key) {
        try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
      };
      return {
        timeline: pick('ttx-timeline-events'),
        checklist: pick('ttx-checklist-state'),
        casualties: pick('ttx-casualty-tracker'),
        resources: pick('ttx-resource-tracker')
      };
    };

    var pushSnapshot = function (label) {
      var points = [];
      try { points = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]'); } catch (e) {}
      if (!Array.isArray(points)) points = [];
      points.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        label: label || 'Manual point',
        data: collectState()
      });
      if (points.length > SNAPSHOT_MAX) points = points.slice(-SNAPSHOT_MAX);
      try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(points)); } catch (e) {}
      return points[points.length - 1];
    };

    // Returns true when the state was rolled back. The caller decides
    // whether to reload the page (simplest way to re-render everything).
    var restoreSnapshot = function (id) {
      var points = [];
      try { points = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]'); } catch (e) {}
      if (!Array.isArray(points)) return false;
      var pt = points.find(function (p) { return p && p.id === id; });
      if (!pt || !pt.data) return false;
      // Safety net: snapshot the CURRENT state first, so a restore is undoable.
      pushSnapshot('Auto — before restore');
      var put = function (key, val) {
        try {
          if (val === null || val === undefined) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
      };
      put('ttx-timeline-events', pt.data.timeline);
      put('ttx-checklist-state', pt.data.checklist);
      put('ttx-casualty-tracker', pt.data.casualties);
      put('ttx-resource-tracker', pt.data.resources);
      return true;
    };

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
          if (radio) {
            radio.checked = true;
            // fire change so persistence, tab-strip scroll and
            // scroll-to-top all run for keyboard switches too
            radio.dispatchEvent(new Event('change'));
          }
        }
        return;
      }

      // Ctrl/Cmd + T: Cycle theme (dark → light → high contrast)
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        if (current === 'dark') setTheme('light');
        else if (current === 'light') setTheme('hc');
        else setTheme('dark');
        return;
      }

      // Ctrl/Cmd + / - / 0: Text size controls
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        stepFont(1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        stepFont(-1);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        fontScale = 1;
        applyFontScale();
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

      // Escape: Close modal (guide first, then scenario editor)
      if (e.key === 'Escape') {
        var openGuideModal = document.getElementById('guideModal');
        if (openGuideModal && openGuideModal.style.display !== 'none') {
          openGuideModal.style.display = 'none';
          return;
        }
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

    var setTheme = function (theme, persist) {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.textContent = '🌙';
      } else if (theme === 'hc') {
        document.documentElement.setAttribute('data-theme', 'hc');
        if (themeToggle) themeToggle.textContent = '👁️';
      } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
      }
      if (persist !== false) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
      }
    };

    var loadTheme = function () {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
      if (saved === 'light' || saved === 'dark' || saved === 'hc') {
        setTheme(saved);
      } else {
        // No saved preference: follow the OS light/dark setting (not persisted,
        // so the app keeps tracking the system until the user toggles manually).
        var sysLight = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        setTheme(sysLight ? 'light' : 'dark', false);
      }
    };

    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        // Cycle: dark → light → high contrast → dark
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        if (current === 'dark') setTheme('light');
        else if (current === 'light') setTheme('hc');
        else setTheme('dark');
      });
    }

    loadTheme();

    /* ================= FONT SIZE CONTROLS ================= */
    var FONT_KEY = 'ttx-font-scale';
    var fontScale = 1;
    try {
      var savedFont = parseFloat(localStorage.getItem(FONT_KEY));
      if (savedFont >= 0.8 && savedFont <= 1.6) fontScale = savedFont;
    } catch (e) {}

    var applyFontScale = function () {
      try { document.documentElement.style.zoom = fontScale; } catch (e) {}
      var resetBtn = document.getElementById('fontReset');
      if (resetBtn) resetBtn.textContent = Math.round(fontScale * 100) + '%';
      try { localStorage.setItem(FONT_KEY, String(fontScale)); } catch (e) {}
    };

    var stepFont = function (dir) {
      fontScale = Math.max(0.8, Math.min(1.6, Math.round((fontScale + dir * 0.1) * 10) / 10));
      applyFontScale();
    };

    var fontDec = document.getElementById('fontDec');
    var fontInc = document.getElementById('fontInc');
    var fontReset = document.getElementById('fontReset');
    if (fontDec) fontDec.addEventListener('click', function () { stepFont(-1); });
    if (fontInc) fontInc.addEventListener('click', function () { stepFont(1); });
    if (fontReset) fontReset.addEventListener('click', function () { fontScale = 1; applyFontScale(); });
    applyFontScale();

    /* ================= MOBILE TAB SCROLL ================= */
    // On narrow screens the tab bar scrolls horizontally — keep the
    // active tab in view whenever it changes (tap or Ctrl+1-7).
    TAB_IDS.forEach(function (id) {
      var radio = document.getElementById(id);
      if (!radio) return;
      radio.addEventListener('change', function () {
        if (radio.checked) {
          try { localStorage.setItem('ttx-active-tab', id); } catch (e) {}
          // a section that opens always starts at the top
          window.scrollTo(0, 0);
        }
        var label = document.querySelector('.tab[for="' + id + '"]');
        var scroller = document.querySelector('.tabs .wrap');
        if (!label || !scroller) return;
        if (scroller.scrollWidth > scroller.clientWidth + 4) {
          var target = Math.max(0, label.offsetLeft - 16);
          if (typeof scroller.scrollTo === 'function') {
            scroller.scrollTo({ left: target, behavior: 'smooth' });
          } else {
            scroller.scrollLeft = target;
          }
        }
      });
      // tapping a tab header always brings its section to the top —
      // including a re-tap of the active tab, which fires no change event
      var label = document.querySelector('.tab[for="' + id + '"]');
      if (label) label.addEventListener('click', function () { window.scrollTo(0, 0); });
    });

    // Restore the tab the user was last on
    try {
      var lastTab = localStorage.getItem('ttx-active-tab');
      if (lastTab && TAB_IDS.indexOf(lastTab) !== -1) {
        var lastRadio = document.getElementById(lastTab);
        if (lastRadio) lastRadio.checked = true;
      }
    } catch (e) {}

    /* ================= USER GUIDE ================= */
    var guideBtn = document.getElementById('guideBtn');
    var guideDockLink = document.getElementById('guideDockLink');
    var guideModalEl = document.getElementById('guideModal');
    var closeGuideModal = document.getElementById('closeGuideModal');

    var openGuide = function (e) {
      if (e) e.preventDefault();
      if (guideModalEl) guideModalEl.style.display = 'block';
    };

    if (guideBtn) guideBtn.addEventListener('click', openGuide);
    if (guideDockLink) guideDockLink.addEventListener('click', openGuide);
    if (closeGuideModal) {
      closeGuideModal.addEventListener('click', function () {
        if (guideModalEl) guideModalEl.style.display = 'none';
      });
    }

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
        var json = JSON.stringify(state);
        var changed = false;
        try {
          changed = localStorage.getItem(STORAGE_KEY) !== json;
          localStorage.setItem(STORAGE_KEY, json);
        } catch (e) {}
        if (changed) flashSaved();
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
        if (fill.parentElement && fill.parentElement.hasAttribute('role')) {
          fill.parentElement.setAttribute('aria-valuenow', String(pct));
        }
        num.textContent = done + ' / ' + inputs.length;
        num.classList.toggle('ready', done === inputs.length);
        saveState();
      };

      inputs.forEach(function (i) { i.addEventListener('change', updateProgress); });

      loadState();
      updateProgress();

      reset.addEventListener('click', function () {
        if (!confirm('Reset the IC checklist? All ticks will be cleared.')) return;
        pushSnapshot('Before checklist reset');
        inputs.forEach(function (i) { i.checked = false; });
        updateProgress();
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        flashSaved('checklist reset');
      });
    }

    /* ================= MAP PINS & LEGEND ================= */
    var CATS = TTX_DATA.pinCategories;
    var LOCATIONS = TTX_DATA.locations;
    var PIN_STORAGE_KEY = 'ttx-pin-positions';

    /* ---------- Map customization (locations + zone radii) ---------- */
    var MAP_CFG_KEY = 'ttx-map-config';
    var ZONE_DEFAULTS = {
      map:     { hot: 38,  warm: 110, cold: 185 },
      diagram: { hot: 92,  warm: 185, cold: 280 }
    };
    var mapConfig = { locations: null, zones: null };

    var clampNum = function (v, lo, hi, fallback) {
      var n = parseInt(v, 10);
      if (isNaN(n)) return fallback;
      return Math.max(lo, Math.min(hi, n));
    };

    var zoneVal = function (side, which) {
      var z = (mapConfig.zones && mapConfig.zones[side]) || {};
      return clampNum(z[which], 8, 500, ZONE_DEFAULTS[side][which]);
    };

    var applyZoneRadii = function () {
      var setR = function (id, r) { var el = document.getElementById(id); if (el) el.setAttribute('r', r); };
      var setY = function (id, y) { var el = document.getElementById(id); if (el) el.setAttribute('y', y); };
      var setX = function (id, x) { var el = document.getElementById(id); if (el) el.setAttribute('x', x); };
      var mz = { hot: zoneVal('map', 'hot'), warm: zoneVal('map', 'warm'), cold: zoneVal('map', 'cold') };
      var dz = { hot: zoneVal('diagram', 'hot'), warm: zoneVal('diagram', 'warm'), cold: zoneVal('diagram', 'cold') };

      // Map rings (crash site group, centre 507,270 — viewBox 1000x720)
      setR('hotZone', mz.hot);
      setR('warmZone', mz.warm);
      setY('warmZoneLabel', Math.max(14, 270 - mz.warm - 8));
      setR('coldZone', mz.cold);
      setY('coldZoneLabel', Math.max(14, 270 - mz.cold - 10));
      setY('crashSiteLabel', Math.max(14, 270 - mz.hot - 10));

      // Zones diagram (concentric circles centred 380,350 — viewBox 760x700)
      setR('zoneHot', dz.hot);
      setR('zoneWarm', dz.warm);
      setY('zoneWarmLabel', Math.max(14, 350 - dz.warm + 43));
      setY('zoneWarmSub', Math.max(30, 350 - dz.warm + 62));
      var inner = Math.round(dz.warm * 0.73);
      setR('zoneInner', inner);
      setX('zoneInnerLabel', 380 + inner - 15);
      setR('zoneCold', dz.cold);
      setY('zoneColdLabel', Math.max(14, 350 - dz.cold + 50));
      setY('zoneColdSub', Math.max(30, 350 - dz.cold + 70));
      var outer = Math.round(dz.cold * 1.15);
      setR('zoneOuter', outer);
      setY('zoneOuterLabel', Math.max(14, 350 - outer + 22));
    };

    var applyMapConfig = function () {
      LOCATIONS = Array.isArray(mapConfig.locations)
        ? mapConfig.locations
        : TTX_DATA.locations;
      applyZoneRadii();
    };

    var loadMapConfig = function () {
      try {
        var raw = localStorage.getItem(MAP_CFG_KEY);
        if (raw) {
          var c = JSON.parse(raw);
          if (c && typeof c === 'object') {
            if (Array.isArray(c.locations)) mapConfig.locations = c.locations;
            if (c.zones && typeof c.zones === 'object') mapConfig.zones = c.zones;
          }
        }
      } catch (e) {}
      applyMapConfig();
    };

    var saveMapConfig = function () {
      try { localStorage.setItem(MAP_CFG_KEY, JSON.stringify(mapConfig)); } catch (e) {}
      flashSaved('map saved');
    };

    var pinLayer = document.getElementById('pinLayer');
    var legend   = document.getElementById('legend');
    var NS = 'http://www.w3.org/2000/svg';

    /* ---------- TWR / ARFF station markers (draggable like pins) ----------
       Static elements in the map SVG — they share the pin position storage
       (keys 'twr' / 'arff'), so saving, restoring and resetting cover pins
       and markers alike. Default transforms are captured from the markup
       here, before any saved position is applied. */
    var SITE_MARKS = ['mapTwr', 'mapArff'].map(function (id) {
      var el = document.getElementById(id);
      var match = el ? (el.getAttribute('transform') || '').match(/translate\(([^,]+),([^)]+)\)/) : null;
      return {
        id: id,
        key: id === 'mapTwr' ? 'twr' : 'arff',
        defX: match ? parseFloat(match[1]) : 0,
        defY: match ? parseFloat(match[2]) : 0
      };
    });

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
      SITE_MARKS.forEach(function (m) {
        var el = document.getElementById(m.id);
        if (!el) return;
        var match = (el.getAttribute('transform') || '').match(/translate\(([^,]+),([^)]+)\)/);
        if (match) positions[m.key] = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
      });
      try { localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
      flashSaved('pin positions');
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
      SITE_MARKS.forEach(function (m) {
        var el = document.getElementById(m.id);
        if (el) el.setAttribute('transform', 'translate(' + m.defX + ',' + m.defY + ')');
      });
    };

    /* Restore saved TWR/ARFF marker positions (or their markup defaults) */
    var applySiteMarkerPositions = function () {
      var saved = loadPinPositions();
      SITE_MARKS.forEach(function (m) {
        var el = document.getElementById(m.id);
        if (!el) return;
        var p = saved[m.key];
        el.setAttribute('transform', 'translate(' +
          (p ? p.x : m.defX) + ',' + (p ? p.y : m.defY) + ')');
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
      /* Mouse: primary button only. Touch/pen: always allow. */
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.isPrimary === false) return;
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
      /* Keep receiving move/up events even if the finger leaves the pin */
      try { pin.setPointerCapture(e.pointerId); } catch (err) {}
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

    /* Rebuild pins + legend — called at startup and again whenever the
       map configuration (locations) changes. Document-level pointer
       listeners stay outside so re-renders never duplicate them. */
    var buildMapUI = function () {
      if (!pinLayer || !legend) return;

      while (pinLayer.firstChild) pinLayer.removeChild(pinLayer.firstChild);
      legend.innerHTML = '';
      itemEls = {};

      LOCATIONS.forEach(function (loc) {
        var pin = makePin(loc);
        pinLayer.appendChild(pin);
        pin.addEventListener('mouseenter', function () { highlight(loc.id, true); });
        pin.addEventListener('mouseleave', function () { highlight(loc.id, false); });
        pin.addEventListener('pointerdown', onPinMouseDown);
      });

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
      resetPinsBtn.textContent = 'Reset Pin & Marker Positions';
      resetPinsBtn.style.marginTop = '12px';
      resetPinsBtn.addEventListener('click', function () {
        resetPinPositions();
      });
      legend.appendChild(resetPinsBtn);

      /* Reset for crash site + zone rings (created here too so a legend
         rebuild after map edits never loses it) */
      var resetCrashZoneBtn = document.createElement('button');
      resetCrashZoneBtn.className = 'reset-btn';
      resetCrashZoneBtn.type = 'button';
      resetCrashZoneBtn.textContent = 'Reset Crash Site & Zones';
      resetCrashZoneBtn.style.marginTop = '8px';
      resetCrashZoneBtn.addEventListener('click', function () {
        resetCrashZonePositions();
      });
      legend.appendChild(resetCrashZoneBtn);
    };

    /* pointer drag listeners — registered exactly once */
    document.addEventListener('pointermove', onMouseMove);
    document.addEventListener('pointerup', onMouseUp);
    document.addEventListener('pointercancel', onMouseUp);

    /* TWR / ARFF markers are static in the markup — bind them once here */
    SITE_MARKS.forEach(function (m) {
      var el = document.getElementById(m.id);
      if (el) el.addEventListener('pointerdown', onPinMouseDown);
    });

    /* Load custom map config (if any), then render pins + legend + zones */
    loadMapConfig();
    buildMapUI();
    applySiteMarkerPositions();

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
        flashSaved('crash site');
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
      /* Mouse: primary button only. Touch/pen: always allow. */
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.isPrimary === false) return;
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
      /* Keep receiving move/up events even if the finger leaves the group */
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
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

      crashZoneGroup.addEventListener('pointerdown', onCrashZoneMouseDown);
      document.addEventListener('pointermove', onCrashZoneMouseMove);
      document.addEventListener('pointerup', onCrashZoneMouseUp);
      document.addEventListener('pointercancel', onCrashZoneMouseUp);

      /* Reset button lives in buildMapUI (legend rebuilds with it) */
    }

    /* Touch devices: never scroll the page while dragging a pin or the
       crash-zone group (belt-and-braces alongside touch-action:none). */
    document.addEventListener('touchmove', function (e) {
      if (draggedPin || draggedCrashGroup) {
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    /* ================= MAP CUSTOMIZATION MODAL ================= */
    (function () {
      var mapModal = document.getElementById('mapModal');
      var editMapBtn = document.getElementById('editMapBtn');
      if (!mapModal || !editMapBtn) return;

      var zoneEditor = document.getElementById('mapZoneEditor');
      var locEditor  = document.getElementById('mapLocEditor');
      var importFile = document.getElementById('mapImportFile');

      var escAttr = function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      };

      var effectiveLocations = function () {
        return Array.isArray(mapConfig.locations) ? mapConfig.locations : TTX_DATA.locations;
      };

      var catKeys = function () { return Object.keys(CATS); };

      var catOptions = function (selected) {
        return catKeys().map(function (k) {
          return '<option value="' + k + '"' + (k === selected ? ' selected' : '') + '>' +
            escAttr(CATS[k].label) + '</option>';
        }).join('');
      };

      /* ---------- zone radii fields ---------- */
      var renderZoneEditor = function () {
        var sides = [
          { side: 'map', title: 'Map rings — Key Locations', sub: 'Crash hot ring, warm & cold perimeters (map units)' },
          { side: 'diagram', title: 'Zone diagram — Incident Zones', sub: 'Concentric hot / warm / cold cordon' }
        ];
        var html = '<h3 class="maped-h">Zone radii</h3><div class="maped-grid">';
        sides.forEach(function (g) {
          html += '<fieldset class="maped-field"><legend>' + g.title + '</legend>';
          ['hot', 'warm', 'cold'].forEach(function (which) {
            var v = zoneVal(g.side, which);
            html += '<label class="maped-num">' +
              '<span>' + which.charAt(0).toUpperCase() + which.slice(1) + '</span>' +
              '<input type="number" id="mz-' + g.side + '-' + which + '" min="8" max="500" step="1" value="' + v + '">' +
              '<em>u</em></label>';
          });
          html += '<p class="maped-note">' + g.sub + '</p></fieldset>';
        });
        html += '</div>';
        zoneEditor.innerHTML = html;
      };

      /* ---------- location rows ---------- */
      var locRowHtml = function (idAttr, id, cat, name, desc) {
        var safeCat = CATS[cat] ? cat : catKeys()[0];
        var badge = (id == null) ? '＋' : id;
        var badgeColor = (id == null) ? '#475569' : CATS[safeCat].color;
        return '<div class="maploc-row" data-id="' + escAttr(idAttr) + '">' +
          '<span class="maploc-num" style="background:' + badgeColor + '">' + badge + '</span>' +
          '<select class="maploc-cat" aria-label="Category">' + catOptions(safeCat) + '</select>' +
          '<input class="maploc-name" type="text" aria-label="Location name" placeholder="Name" value="' + escAttr(name) + '">' +
          '<input class="maploc-desc" type="text" aria-label="Location description" placeholder="Description" value="' + escAttr(desc) + '">' +
          '<button type="button" class="maploc-del" aria-label="Delete this location">✕</button>' +
          '</div>';
      };

      var renderLocEditor = function () {
        var locs = effectiveLocations();
        var html = '<h3 class="maped-h">Locations <span class="maped-count">' + locs.length + '</span></h3>' +
          '<div class="maploc-rows">';
        locs.forEach(function (loc) {
          html += locRowHtml(String(loc.id), loc.id, loc.cat, loc.name, loc.desc);
        });
        if (!locs.length) {
          html += '<p class="maped-note" style="padding:10px 2px;">No locations — use ＋ Add to place some.</p>';
        }
        html += '</div>';
        html += '<button type="button" id="mapLocAdd" class="reset-btn">＋ Add location</button>';
        locEditor.innerHTML = html;
      };

      /* ---------- collect from DOM ---------- */
      var collectLocations = function () {
        var rows = locEditor.querySelectorAll('.maploc-row');
        var existing = {};
        effectiveLocations().forEach(function (l) { existing[l.id] = l; });

        var base = 0;
        Array.prototype.forEach.call(rows, function (row) {
          var i = parseInt(row.getAttribute('data-id'), 10);
          if (!isNaN(i) && i > base) base = i;
        });

        var out = [];
        Array.prototype.forEach.call(rows, function (row) {
          var id = parseInt(row.getAttribute('data-id'), 10);
          if (isNaN(id)) id = ++base;
          var sel = row.querySelector('.maploc-cat');
          var cat = sel && CATS[sel.value] ? sel.value : catKeys()[0];
          var nameEl = row.querySelector('.maploc-name');
          var descEl = row.querySelector('.maploc-desc');
          var name = (nameEl && nameEl.value || '').trim() || ('Location ' + id);
          var desc = (descEl && descEl.value || '').trim();
          var prev = existing[id];
          out.push({
            id: id, cat: cat, name: name, desc: desc,
            x: prev ? prev.x : 500, y: prev ? prev.y : 360
          });
        });
        return out;
      };

      var collectZones = function () {
        var grab = function (side) {
          var vals = ['hot', 'warm', 'cold'].map(function (w) {
            var el = document.getElementById('mz-' + side + '-' + w);
            return clampNum(el ? el.value : '', 8, 500, ZONE_DEFAULTS[side][w]);
          }).sort(function (a, b) { return a - b; });
          // keep rings nested: warm >= hot+10, cold >= warm+10
          vals[1] = Math.min(500, Math.max(vals[1], vals[0] + 10));
          vals[2] = Math.min(500, Math.max(vals[2], vals[1] + 10));
          return { hot: vals[0], warm: vals[1], cold: vals[2] };
        };
        return { map: grab('map'), diagram: grab('diagram') };
      };

      /* ---------- actions ---------- */
      var open = function () {
        renderZoneEditor();
        renderLocEditor();
        mapModal.style.display = 'block';
      };
      var close = function () { mapModal.style.display = 'none'; };

      var save = function () {
        mapConfig.locations = collectLocations();
        mapConfig.zones = collectZones();
        saveMapConfig();
        applyMapConfig();
        buildMapUI();
        close();
      };

      var reset = function () {
        if (!window.confirm('Reset map layout and zone radii to factory defaults?')) return;
        mapConfig.locations = null;
        mapConfig.zones = null;
        try { localStorage.removeItem(MAP_CFG_KEY); } catch (e) {}
        applyMapConfig();
        buildMapUI();
        renderZoneEditor();
        renderLocEditor();
        flashSaved('map reset');
      };

      var exportMap = function () {
        var data = { locations: effectiveLocations(), zones: collectZones() };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'map-layout.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
          if (a.parentNode) a.parentNode.removeChild(a);
        }, 1000);
      };

      /* ---------- wiring ---------- */
      editMapBtn.addEventListener('click', open);
      document.getElementById('closeMapModal').addEventListener('click', close);
      document.getElementById('mapCancelBtn').addEventListener('click', close);
      mapModal.addEventListener('click', function (e) { if (e.target === mapModal) close(); });
      document.getElementById('mapSaveBtn').addEventListener('click', save);
      document.getElementById('mapResetBtn').addEventListener('click', reset);
      document.getElementById('mapExportBtn').addEventListener('click', exportMap);
      document.getElementById('mapImportBtn').addEventListener('click', function () {
        importFile.click();
      });

      locEditor.addEventListener('click', function (e) {
        var del = e.target.closest ? e.target.closest('.maploc-del') : null;
        if (del) {
          var row = del.closest('.maploc-row');
          if (row && row.parentNode) row.parentNode.removeChild(row);
          var count = locEditor.querySelectorAll('.maploc-row').length;
          var countEl = locEditor.querySelector('.maped-count');
          if (countEl) countEl.textContent = count;
          return;
        }
        if (e.target.id === 'mapLocAdd') {
          var rowsWrap = locEditor.querySelector('.maploc-rows');
          if (!rowsWrap) return;
          var empty = rowsWrap.querySelector('.maped-note');
          if (empty) empty.parentNode.removeChild(empty);
          rowsWrap.insertAdjacentHTML('beforeend',
            locRowHtml('', null, catKeys()[0], '', ''));
          var added = rowsWrap.lastElementChild;
          var countEl2 = locEditor.querySelector('.maped-count');
          if (countEl2) countEl2.textContent = rowsWrap.querySelectorAll('.maploc-row').length;
          var nameInput = added ? added.querySelector('.maploc-name') : null;
          if (nameInput) nameInput.focus();
        }
      });

      locEditor.addEventListener('change', function (e) {
        if (e.target.classList && e.target.classList.contains('maploc-cat')) {
          var row = e.target.closest('.maploc-row');
          var badge = row ? row.querySelector('.maploc-num') : null;
          if (badge && CATS[e.target.value]) badge.style.background = CATS[e.target.value].color;
        }
      });

      importFile.addEventListener('change', function () {
        var f = importFile.files && importFile.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(reader.result);
            if (data && Array.isArray(data.locations)) {
              var seen = {};
              var locs = [];
              data.locations.forEach(function (l, i) {
                if (!l || typeof l !== 'object') return;
                var id = clampNum(l.id, 1, 9999, i + 1);
                if (seen[id]) return; // drop duplicate ids
                seen[id] = true;
                locs.push({
                  id: id,
                  cat: CATS[l.cat] ? l.cat : catKeys()[0],
                  name: String(l.name || ('Location ' + id)).slice(0, 80),
                  desc: String(l.desc || '').slice(0, 140),
                  x: clampNum(l.x, 0, 1000, 500),
                  y: clampNum(l.y, 0, 720, 360)
                });
              });
              mapConfig.locations = locs;
            }
            if (data && data.zones && typeof data.zones === 'object') {
              mapConfig.zones = data.zones;
            }
            saveMapConfig();
            applyMapConfig();
            buildMapUI();
            renderZoneEditor();
            renderLocEditor();
            flashSaved('map imported');
          } catch (err) {
            window.alert('Could not import: that file is not valid map JSON.');
          }
        };
        reader.readAsText(f);
        importFile.value = '';
      });
    })();

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
        // Look up in allScenarios (built-in + custom) so custom scenarios
        // also get their panel, timeline and injects.
        var scenario = (typeof allScenarios !== 'undefined' ? allScenarios : TTX_DATA.scenarios)
          .find(function (s) { return s.id === scenarioSelect.value; });
        updateScenarioPanel(scenario);
        try {
          if (scenarioSelect.value) localStorage.setItem('ttx-active-scenario', scenarioSelect.value);
          else localStorage.removeItem('ttx-active-scenario');
        } catch (e) {}
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

      /* Exercise clock + inject player (rendered by renderClockPanel) */
      html += '<div id="clockMount"></div>';

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
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:4px;">';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.arff + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">ARFF Vehicles</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.ambulances + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Ambulances</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.fireTrucks + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Fire Trucks</span></div>';
      html += '<div style="background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;padding:10px;text-align:center;"><span style="font-size:16px;font-weight:700;color:var(--stat-text);">' + scenario.resources.buses + '</span><span style="font-size:10px;color:var(--muted2);text-transform:uppercase;letter-spacing:.08em;display:block;margin-top:2px;">Buses</span></div>';
      html += '</div>';

      panel.innerHTML = html;

      // Render the exercise clock & inject player into its mount
      if (typeof renderClockPanel === 'function') renderClockPanel();
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
      flashSaved('timeline');
    };

    var clearTimeline = function () {
      pushHistory();
      timelineEvents = [];
      try { localStorage.removeItem(TIMELINE_STORAGE_KEY); } catch (e) {}
      renderTimeline();
      updateUndoRedoButtons();
    };

    var addTimelineEvent = function (time, text, category, tplus) {
      pushHistory();
      var evt = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: time,
        text: text,
        category: category || 'info',
        timestamp: new Date().toISOString()
      };
      if (tplus) evt.tplus = tplus;
      timelineEvents.push(evt);
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
        html += '<div style="flex:0 0 60px;font-size:12px;font-weight:700;color:' + catColor + ';font-variant-numeric:tabular-nums;">' + evt.time +
          (evt.tplus ? '<div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:.02em;">T+' + evt.tplus + '</div>' : '') +
          '</div>';
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

    timelineHTML += '<div class="timeline-form">';
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
        if (confirm('Clear all timeline events?')) {
          pushSnapshot('Before clearing timeline');
          clearTimeline();
          flashSaved('timeline cleared');
        }
      });
    }

    if (timelineExportBtn) {
      timelineExportBtn.addEventListener('click', function () {
        if (timelineEvents.length === 0) { alert('No events to export.'); return; }
        var scenarioName = '';
        var scenarioSelect = document.getElementById('scenarioSelect');
        if (scenarioSelect && scenarioSelect.value) {
          var sc = (typeof allScenarios !== 'undefined' ? allScenarios : TTX_DATA.scenarios)
            .find(function (s) { return s.id === scenarioSelect.value; });
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

    /* ================= EXERCISE CLOCK & INJECT PLAYER ================= */
    var CLOCK_KEY = 'ttx-clock';
    var clockState = {
      scenarioId: null, startWall: null, accumulated: 0,
      running: false, startedAt: null,
      mode: 'manual', autoLog: true, released: []
    };
    try {
      var rawClock = JSON.parse(localStorage.getItem(CLOCK_KEY) || 'null');
      if (rawClock && typeof rawClock === 'object') {
        Object.keys(clockState).forEach(function (k) {
          if (rawClock[k] !== undefined) clockState[k] = rawClock[k];
        });
        if (clockState.running && !clockState.startedAt) clockState.startedAt = Date.now();
      }
    } catch (e) {}

    var saveClock = function () {
      try { localStorage.setItem(CLOCK_KEY, JSON.stringify(clockState)); } catch (e) {}
      flashSaved('clock');
    };

    // Cue (latest released inject) must survive re-renders of the panel
    var clockCue = { visible: false, text: '' };

    var resetClockState = function () {
      clockState.scenarioId = getActiveScenarioId();
      clockState.startWall = null;
      clockState.accumulated = 0;
      clockState.running = false;
      clockState.startedAt = null;
      clockState.released = [];
      clockCue.visible = false;
      clockCue.text = '';
    };

    var clockElapsed = function () {
      var e = clockState.accumulated || 0;
      if (clockState.running && clockState.startedAt) e += Date.now() - clockState.startedAt;
      return e;
    };

    var fmtTplus = function (ms) {
      var s = Math.max(0, Math.floor(ms / 1000));
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return pad(h) + ':' + pad(m) + ':' + pad(sec);
    };

    var getActiveScenarioId = function () {
      var sel = document.getElementById('scenarioSelect');
      return sel && sel.value ? sel.value : null;
    };

    var getActiveScenarioObj = function () {
      var id = getActiveScenarioId();
      var pool = (typeof allScenarios !== 'undefined' ? allScenarios : TTX_DATA.scenarios);
      return pool.find(function (s) { return s.id === id; }) || null;
    };

    /* Injects are strings like "09:05 — Aircraft crashes …".
       Schedule offsets are computed relative to the first parseable time. */
    var parseInjectSchedule = function (scenario) {
      var out = [];
      if (!scenario || !Array.isArray(scenario.injects)) return out;
      var base = null;
      scenario.injects.forEach(function (raw, idx) {
        var text = String(raw), offsetMin = null;
        var m = String(raw).match(/^\s*(\d{1,2}):(\d{2})\s*(?:—|–|-|:)?\s*(.*)$/);
        if (m) {
          var mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
          if (base === null) base = mins;
          offsetMin = mins - base;
          if (offsetMin < 0) offsetMin += 24 * 60; // crosses midnight
          if (m[3]) text = m[3];
        }
        if (offsetMin === null) offsetMin = idx * 5; // no time in string → every 5 min
        out.push({ idx: idx, text: text || String(raw), offsetMs: offsetMin * 60000 });
      });
      return out;
    };

    var clockAudioCtx = null;
    var beep = function () {
      try {
        if (!clockAudioCtx) clockAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (clockAudioCtx.state === 'suspended') clockAudioCtx.resume();
        [0, 0.24].forEach(function (t, i) {
          var o = clockAudioCtx.createOscillator();
          var g = clockAudioCtx.createGain();
          o.type = 'sine';
          o.frequency.value = i === 0 ? 880 : 660;
          g.gain.setValueAtTime(0.0001, clockAudioCtx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.22, clockAudioCtx.currentTime + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, clockAudioCtx.currentTime + t + 0.2);
          o.connect(g); g.connect(clockAudioCtx.destination);
          o.start(clockAudioCtx.currentTime + t);
          o.stop(clockAudioCtx.currentTime + t + 0.22);
        });
      } catch (e) {}
    };

    var renderCue = function () {
      var cue = document.getElementById('clockCue');
      var txt = document.getElementById('clockCueText');
      if (!cue || !txt) return;
      txt.textContent = clockCue.text;
      cue.style.display = clockCue.visible ? 'flex' : 'none';
    };

    var showCue = function (text) {
      clockCue.visible = true;
      clockCue.text = text;
      renderCue();
    };

    var releaseInject = function (idx) {
      var sc = getActiveScenarioObj();
      if (!sc) return;
      var sched = parseInjectSchedule(sc);
      var item = sched[idx];
      if (!item || clockState.released.indexOf(idx) !== -1) return;
      clockState.released.push(idx);
      saveClock();
      beep();
      showCue(item.text);
      if (clockState.autoLog) {
        var now = new Date();
        var wallDate = clockState.startWall ? new Date(clockState.startWall + clockElapsed()) : now;
        var wall = wallDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        var tplus = clockState.startWall ? fmtTplus(clockElapsed()) : null;
        addTimelineEvent(wall, item.text, 'inject', tplus);
      }
      renderClockPanel();
    };

    var renderClockPanel = function () {
      var mount = document.getElementById('clockMount');
      if (!mount) return;

      var scId = getActiveScenarioId();
      // Clock state belongs to one scenario — reset when the user switches
      if (scId && clockState.scenarioId && clockState.scenarioId !== scId) {
        resetClockState();
        saveClock();
      }
      if (scId) clockState.scenarioId = scId;

      var sc = getActiveScenarioObj();
      if (!sc) { mount.innerHTML = ''; return; }

      var sched = parseInjectSchedule(sc);
      var isRunning = clockState.running;
      var started = clockState.startWall !== null;

      var html = '<div class="clock-card">';
      html += '<div class="clock-head"><span class="clock-title">⏱ Exercise Clock</span><span id="clockStatus" class="clock-status">Not started</span></div>';
      html += '<div class="clock-main">';
      html += '<div class="clock-tplus" id="clockTplus">T+ 00:00:00</div>';
      html += '<div class="clock-wall" id="clockWall">Start wall time —</div>';
      html += '<div class="clock-btns">';
      html += '<button id="clockStartBtn" class="reset-btn" type="button">' + (isRunning ? '❚❚ Pause' : (started ? '▶ Resume' : '▶ Start')) + '</button>';
      html += '<button id="clockResetBtn" class="reset-btn" type="button">↺ Reset</button>';
      html += '</div>';
      html += '<div class="clock-mode">';
      html += '<label><input type="radio" name="clockPace" value="manual" ' + (clockState.mode !== 'auto' ? 'checked' : '') + '> Manual pacing</label>';
      html += '<label><input type="radio" name="clockPace" value="auto" ' + (clockState.mode === 'auto' ? 'checked' : '') + '> Auto-release</label>';
      html += '<label><input type="checkbox" id="clockAutoLog" ' + (clockState.autoLog ? 'checked' : '') + '> Log injects to timeline</label>';
      html += '</div>';
      html += '</div>';

      html += '<div class="clock-next" id="clockNext"></div>';
      html += '<div class="clock-cue" id="clockCue" role="alert" style="display:none;"><span class="cue-bell">🔔</span><span id="clockCueText"></span><button type="button" id="clockCueClose" aria-label="Dismiss inject">✕</button></div>';

      /* Inject player list */
      html += '<h4 class="clock-inject-h">Exercise Injects</h4>';
      html += '<div class="inject-list">';
      var nextIdx = -1;
      for (var i = 0; i < sched.length; i++) {
        if (clockState.released.indexOf(sched[i].idx) === -1) { nextIdx = i; break; }
      }
      sched.forEach(function (item, i) {
        var released = clockState.released.indexOf(item.idx) !== -1;
        var cls = released ? 'done' : (i === nextIdx ? 'next' : 'future');
        html += '<div class="inject-row ' + cls + '">';
        html += '<span class="inject-badge">' + (released ? '✓' : (i + 1)) + '</span>';
        html += '<span class="inject-time">T+' + fmtTplus(item.offsetMs).replace(/^00:/, '') + '</span>';
        html += '<span class="inject-text">' + item.text + '</span>';
        if (!released && i === nextIdx && clockState.mode !== 'auto') {
          html += '<button class="reset-btn inject-release" type="button" data-idx="' + item.idx + '">Release</button>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      mount.innerHTML = html;
      renderCue(); // restore cue (showCue runs before re-renders)

      /* Controls */
      var startBtn = document.getElementById('clockStartBtn');
      startBtn.addEventListener('click', function () {
        if (clockState.running) {
          clockState.accumulated = clockElapsed();
          clockState.running = false;
          clockState.startedAt = null;
        } else {
          if (clockState.startWall === null) clockState.startWall = Date.now();
          clockState.startedAt = Date.now();
          clockState.running = true;
        }
        saveClock();
        renderClockPanel();
      });

      document.getElementById('clockResetBtn').addEventListener('click', function () {
        if (!confirm('Reset the exercise clock? T+ time and released injects will be cleared (timeline entries already logged are kept).')) return;
        resetClockState();
        saveClock();
        renderClockPanel();
      });

      Array.prototype.forEach.call(document.querySelectorAll('input[name="clockPace"]'), function (r) {
        r.addEventListener('change', function () {
          clockState.mode = r.value;
          saveClock();
          renderClockPanel();
        });
      });

      var autoLogEl = document.getElementById('clockAutoLog');
      if (autoLogEl) {
        autoLogEl.addEventListener('change', function () {
          clockState.autoLog = autoLogEl.checked;
          saveClock();
        });
      }

      Array.prototype.forEach.call(mount.querySelectorAll('.inject-release'), function (b) {
        b.addEventListener('click', function () {
          releaseInject(parseInt(b.getAttribute('data-idx'), 10));
        });
      });

      var cueClose = document.getElementById('clockCueClose');
      if (cueClose) {
        cueClose.addEventListener('click', function () {
          clockCue.visible = false;
          renderCue();
        });
      }

      updateClockLive();
    };

    var updateClockLive = function () {
      var tEl = document.getElementById('clockTplus');
      if (!tEl) return;
      var elapsed = clockElapsed();
      tEl.textContent = 'T+ ' + fmtTplus(elapsed);

      var wallEl = document.getElementById('clockWall');
      wallEl.textContent = clockState.startWall
        ? 'Wall time ' + new Date(clockState.startWall + elapsed).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Wall time —';

      var statusEl = document.getElementById('clockStatus');
      statusEl.textContent = clockState.running ? '● Running' : (clockState.startWall ? '❚❚ Paused' : 'Not started');
      statusEl.classList.toggle('running', clockState.running);

      var startBtn = document.getElementById('clockStartBtn');
      if (startBtn) startBtn.textContent = clockState.running ? '❚❚ Pause' : (clockState.startWall ? '▶ Resume' : '▶ Start');

      /* Next-inject countdown */
      var nextEl = document.getElementById('clockNext');
      var sc = getActiveScenarioObj();
      var sched = parseInjectSchedule(sc);
      var next = null;
      for (var i = 0; i < sched.length; i++) {
        if (clockState.released.indexOf(sched[i].idx) === -1) { next = sched[i]; break; }
      }
      if (!next) {
        nextEl.innerHTML = '<b>All injects released ✓</b>';
      } else if (clockState.mode === 'auto') {
        var due = next.offsetMs - elapsed;
        if (due <= 0) {
          nextEl.innerHTML = '<b>Next inject due now…</b>';
        } else {
          nextEl.innerHTML = 'Next inject in <b>' + fmtTplus(due) + '</b> (auto)';
        }
      } else {
        nextEl.innerHTML = 'Next inject ready — press <b>Release</b> when the controller calls it';
      }
    };

    var checkAutoDue = function () {
      if (clockState.mode !== 'auto' || !clockState.running) return;
      var sc = getActiveScenarioObj();
      var sched = parseInjectSchedule(sc);
      var elapsed = clockElapsed();
      sched.forEach(function (item) {
        if (item.offsetMs <= elapsed && clockState.released.indexOf(item.idx) === -1) {
          releaseInject(item.idx);
        }
      });
    };

    setInterval(function () {
      if (!document.getElementById('clockTplus')) return;
      updateClockLive();
      checkAutoDue();
    }, 1000);

    /* ================= AFTER ACTION REPORT ================= */
    /* Shared print helper: fills #printRoot (shown only in @media print,
       overriding the full-plan print rules) then prints. */
    var printMarkup = function (html) {
      var root = document.getElementById('printRoot');
      if (root) root.innerHTML = html;
      /* body class gates the @media print rules that hide the whole app */
      document.body.classList.add('print-markup');
      window.print();
    };
    var clearPrintMarkup = function () {
      document.body.classList.remove('print-markup');
      var root = document.getElementById('printRoot');
      if (root) root.innerHTML = '';
    };
    window.addEventListener('afterprint', clearPrintMarkup);

    var AAR_NOTES_KEY = 'ttx-aar-notes';
    var currentAarMd = '';

    var aarScenario = function () {
      var sel = document.getElementById('scenarioSelect');
      if (sel && sel.value) {
        var sc = (typeof allScenarios !== 'undefined' ? allScenarios : TTX_DATA.scenarios)
          .find(function (s) { return s.id === sel.value; });
        if (sc) return sc;
      }
      return null;
    };

    var jsonGet = function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return fallback;
    };

    var collectAarData = function () {
      var scenario = aarScenario();
      var now = new Date();

      var checklistState = jsonGet('ttx-checklist-state', []) || [];
      var checklist = TTX_DATA.checklistItems.map(function (item, idx) {
        return { text: item, done: checklistState[idx] === true };
      });
      var doneCount = checklist.filter(function (i) { return i.done; }).length;

      var resArr = jsonGet('ttx-resource-tracker', []) || [];
      if (!Array.isArray(resArr)) resArr = [];
      var casArr = jsonGet('ttx-casualty-tracker', []) || [];
      if (!Array.isArray(casArr)) casArr = [];
      var clock = jsonGet('ttx-clock', null);

      return {
        generatedAt: now,
        scenario: scenario,
        checklist: checklist,
        doneCount: doneCount,
        total: checklist.length,
        timeline: timelineEvents, /* module var, loaded above */
        resources: resArr,
        casualties: casArr,
        clock: clock,
        notes: ''
      };
    };

    var aarCounts = function (d) {
      var count = function (fn) { return d.casualties.filter(fn).length; };
      return {
        red: count(function (c) { return c.triage === 'red'; }),
        yellow: count(function (c) { return c.triage === 'yellow'; }),
        green: count(function (c) { return c.triage === 'green'; }),
        deceased: count(function (c) { return c.triage === 'deceased'; }),
        transported: count(function (c) { return !!c.transported; }),
        total: d.casualties.length,
        resByStatus: d.resources.reduce(function (acc, r) {
          var s = r.status || 'available';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {})
      };
    };

    var aarScenarioLine = function (d) {
      if (!d.scenario) return 'Airport Emergency Exercise (no scenario selected)';
      return d.scenario.name;
    };

    var aarToMarkdown = function (d) {
      var cell = function (s) {
        return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      };
      var L = [];
      L.push('# After Action Report — ' + aarScenarioLine(d));
      L.push('');
      L.push('- **Generated:** ' + d.generatedAt.toLocaleString());
      if (d.scenario) {
        L.push('- **Scenario type:** ' + (d.scenario.category || 'aircraft'));
        if (d.scenario.soulsOnBoard != null) {
          L.push('- **Souls on board:** ' + d.scenario.soulsOnBoard + ' · **Fuel:** ' + d.scenario.fuelLoad);
        }
      }
      if (d.clock && d.clock.startWall) {
        L.push('- **Exercise started:** ' + new Date(d.clock.startWall).toLocaleTimeString() +
          ' (clock ' + (d.clock.running ? 'running' : 'stopped') + ')');
      }
      L.push('');
      L.push('## 1. Checklist Progress');
      L.push('');
      L.push('**' + d.doneCount + ' / ' + d.total + '** items completed');
      L.push('');
      d.checklist.forEach(function (it) {
        L.push('- [' + (it.done ? 'x' : ' ') + '] ' + it.text);
      });
      L.push('');
      L.push('## 2. Exercise Timeline');
      L.push('');
      if (!d.timeline.length) {
        L.push('_No events recorded._');
      } else {
        L.push('| Time | T+ | Category | Event |');
        L.push('|------|----|----------|-------|');
        d.timeline.forEach(function (e) {
          L.push('| ' + cell(e.time) + ' | ' + cell(e.tplus || '—') + ' | ' +
            cell(e.category) + ' | ' + cell(e.text) + ' |');
        });
      }
      L.push('');
      L.push('## 3. Resources');
      L.push('');
      if (!d.resources.length) {
        L.push('_Resource tracker is empty._');
      } else {
        var c = aarCounts(d);
        L.push('**Status summary:** ' + Object.keys(c.resByStatus).map(function (s) {
          return s + ' ' + c.resByStatus[s];
        }).join(' · ') + ' (of ' + d.resources.length + ')');
        L.push('');
        L.push('| Resource | Type | Status | Location |');
        L.push('|----------|------|--------|----------|');
        d.resources.forEach(function (r) {
          L.push('| ' + cell(r.name) + ' | ' + cell(r.type) + ' | ' + cell(r.status) + ' | ' + cell(r.location || '—') + ' |');
        });
      }
      L.push('');
      L.push('## 4. Casualties');
      L.push('');
      if (!d.casualties.length) {
        L.push('_No casualties recorded in the tracker._');
      } else {
        var cc = aarCounts(d);
        L.push('- Red: ' + cc.red + ' · Yellow: ' + cc.yellow + ' · Green: ' + cc.green +
          ' · Deceased: ' + cc.deceased + ' · Transported: ' + cc.transported + ' · **Total: ' + cc.total + '**');
      }
      L.push('');
      L.push('## 5. Facilitator Notes');
      L.push('');
      L.push(d.notes ? d.notes : '_None recorded._');
      L.push('');
      L.push('## 6. Improvement Plan');
      L.push('');
      L.push('| # | Item | Owner | Due |');
      L.push('|---|------|-------|-----|');
      for (var i = 1; i <= 5; i++) L.push('| ' + i + ' |  |  |  |');
      L.push('');
      L.push('---');
      L.push('_Generated by the Airport Emergency Exercise Plan dashboard._');
      return L.join('\n') + '\n';
    };

    var aarToHtml = function (d) {
      var esc = function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
      var h = '';

      h += '<div class="aar-sec"><h3>Overview</h3>' +
        '<div class="aar-grid">' +
        '<div><span>Scenario</span><b>' + esc(aarScenarioLine(d)) + '</b></div>' +
        '<div><span>Generated</span><b>' + esc(d.generatedAt.toLocaleString()) + '</b></div>' +
        (d.scenario ? '<div><span>Type</span><b>' + esc(d.scenario.category || 'aircraft') + '</b></div>' : '') +
        (d.scenario && d.scenario.soulsOnBoard != null
          ? '<div><span>Souls on board</span><b>' + esc(d.scenario.soulsOnBoard) + ' (fuel ' + esc(d.scenario.fuelLoad) + ')</b></div>'
          : '') +
        (d.clock && d.clock.startWall
          ? '<div><span>Exercise started</span><b>' + esc(new Date(d.clock.startWall).toLocaleTimeString()) + '</b></div>'
          : '') +
        '</div></div>';

      h += '<div class="aar-sec"><h3>Checklist Progress <span class="aar-count">' +
        d.doneCount + ' / ' + d.total + '</span></h3><ul class="aar-list">' +
        d.checklist.map(function (it) {
          return '<li class="' + (it.done ? 'done' : '') + '">' +
            '<span class="aar-box">' + (it.done ? '✓' : '') + '</span>' + esc(it.text) + '</li>';
        }).join('') + '</ul></div>';

      h += '<div class="aar-sec"><h3>Exercise Timeline <span class="aar-count">' +
        d.timeline.length + ' events</span></h3>';
      if (!d.timeline.length) {
        h += '<p class="aar-empty">No events recorded.</p>';
      } else {
        h += '<table class="aar-tbl"><thead><tr><th>Time</th><th>T+</th><th>Category</th><th>Event</th></tr></thead><tbody>' +
          d.timeline.map(function (e) {
            return '<tr><td class="mono">' + esc(e.time) + '</td><td class="mono">' + esc(e.tplus || '—') +
              '</td><td><span class="aar-cat c-' + esc(e.category) + '">' + esc(e.category) + '</span></td><td>' +
              esc(e.text) + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
      h += '</div>';

      var c = aarCounts(d);
      h += '<div class="aar-sec"><h3>Resources <span class="aar-count">' + d.resources.length + '</span></h3>';
      if (!d.resources.length) {
        h += '<p class="aar-empty">Resource tracker is empty.</p>';
      } else {
        h += '<div class="aar-pills">' + Object.keys(c.resByStatus).map(function (s) {
          return '<span class="aar-pill s-' + esc(s) + '">' + esc(s) + ' ' + c.resByStatus[s] + '</span>';
        }).join('') + '</div>';
        h += '<table class="aar-tbl"><thead><tr><th>Resource</th><th>Type</th><th>Status</th><th>Location</th></tr></thead><tbody>' +
          d.resources.map(function (r) {
            return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.type) + '</td><td>' +
              esc(r.status) + '</td><td>' + esc(r.location || '—') + '</td></tr>';
          }).join('') + '</tbody></table>';
      }
      h += '</div>';

      h += '<div class="aar-sec"><h3>Casualties</h3>';
      if (!d.casualties.length) {
        h += '<p class="aar-empty">No casualties recorded in the tracker.</p>';
      } else {
        h += '<div class="aar-pills">' +
          '<span class="aar-pill s-red">Red ' + c.red + '</span>' +
          '<span class="aar-pill s-yellow">Yellow ' + c.yellow + '</span>' +
          '<span class="aar-pill s-green">Green ' + c.green + '</span>' +
          '<span class="aar-pill s-deceased">Deceased ' + c.deceased + '</span>' +
          '<span class="aar-pill s-transported">Transported ' + c.transported + '</span>' +
          '<span class="aar-pill s-total">Total ' + c.total + '</span>' +
          '</div>';
      }
      h += '</div>';

      h += '<div class="aar-sec"><h3>Facilitator Notes</h3>' +
        '<p class="aar-notes-body">' + (d.notes ? esc(d.notes).replace(/\n/g, '<br>') : '<i>None recorded.</i>') + '</p></div>';

      h += '<div class="aar-sec"><h3>Improvement Plan</h3>' +
        '<table class="aar-tbl"><thead><tr><th style="width:34px;">#</th><th>Item</th><th style="width:120px;">Owner</th><th style="width:110px;">Due</th></tr></thead><tbody>' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<tr><td class="mono">' + n + '</td><td></td><td></td><td></td></tr>';
        }).join('') + '</tbody></table></div>';

      return h;
    };

    var renderAarPreview = function () {
      var d = collectAarData();
      var notesEl = document.getElementById('aarNotes');
      d.notes = notesEl ? (notesEl.value || '').trim() : '';
      currentAarMd = aarToMarkdown(d);
      var content = document.getElementById('aarContent');
      if (content) content.innerHTML = aarToHtml(d);
    };

    (function () {
      var aarBtn = document.createElement('button');
      aarBtn.className = 'reset-btn';
      aarBtn.type = 'button';
      aarBtn.textContent = '📋 After Action Report';
      aarBtn.style.marginTop = '12px';

      var modal = document.getElementById('aarModal');
      var notesEl = document.getElementById('aarNotes');
      if (!modal) { timelineSection.appendChild(aarBtn); return; }

      var open = function () {
        try { if (notesEl) notesEl.value = localStorage.getItem(AAR_NOTES_KEY) || ''; } catch (e) {}
        renderAarPreview();
        modal.style.display = 'block';
      };
      var close = function () { modal.style.display = 'none'; };

      aarBtn.addEventListener('click', open);
      document.getElementById('closeAarModal').addEventListener('click', close);
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

      if (notesEl) {
        notesEl.addEventListener('input', function () {
          try { localStorage.setItem(AAR_NOTES_KEY, notesEl.value); } catch (e) {}
          renderAarPreview();
        });
      }

      document.getElementById('aarPrintBtn').addEventListener('click', function () {
        printMarkup(document.getElementById('aarContent').innerHTML);
      });

      document.getElementById('aarMdBtn').addEventListener('click', function () {
        var blob = new Blob([currentAarMd], { type: 'text/markdown;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'AAR-' + new Date().toISOString().slice(0, 10) + '.md';
        a.click();
        URL.revokeObjectURL(url);
      });

      document.getElementById('aarCopyBtn').addEventListener('click', function () {
        var btn = document.getElementById('aarCopyBtn');
        var done = function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy Markdown'; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(currentAarMd).then(done, function () {});
        } else {
          var ta = document.createElement('textarea');
          ta.value = currentAarMd;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        }
      });

      timelineSection.appendChild(aarBtn);
    })();

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
      updateDockInfo();
      flashSaved('scenario saved');
    };

    // Keep the bottom dock's basic info in sync
    var updateDockInfo = function () {
      var el = document.getElementById('dockScenarioCount');
      if (!el) return;
      var custom = allScenarios.filter(function (s) { return s.custom; }).length;
      el.textContent = allScenarios.length + ' scenarios' +
        (custom ? ' (' + custom + ' custom)' : '');
    };

    loadCustomScenarios();
    updateDockInfo();

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

      // Session resume: reopen the scenario that was active last time
      try {
        var lastScenario = localStorage.getItem('ttx-active-scenario');
        if (lastScenario && allScenarios.some(function (s) { return s.id === lastScenario; })) {
          scenarioSelect.value = lastScenario;
          scenarioSelect.dispatchEvent(new Event('change'));
        }
      } catch (e) {}
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

      // Add new scenario + compare buttons
      html += '<div style="display:flex;gap:8px;margin-top:12px;">';
      html += '<button id="newScenarioBtn" class="reset-btn" type="button" style="padding:8px 16px;flex:1;">+ New Scenario</button>';
      html += '<button id="compareBtn" class="reset-btn" type="button" style="padding:8px 16px;">⚖ Compare</button>';
      html += '</div>';

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

      var compareBtn = document.getElementById('compareBtn');
      if (compareBtn) {
        compareBtn.addEventListener('click', function () {
          renderCompareSelectors();
          renderCompare();
          compareModal.style.display = 'block';
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
        /* full-plan print: make sure no markup-print state is left over */
        document.body.classList.remove('print-markup');
        var printRootEl = document.getElementById('printRoot');
        if (printRootEl) printRootEl.innerHTML = '';

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
      var scenario = null;
      var sel = document.getElementById('scenarioSelect');
      if (sel && sel.value && typeof allScenarios !== 'undefined') {
        scenario = allScenarios.find(function (s) { return s.id === sel.value; });
      }

      var now = new Date();
      var dateStr = now.toLocaleDateString();
      var timeStr = now.toTimeString().slice(0, 5);
      var incName = scenario ? scenario.name : 'Airport Emergency Exercise';

      var esc = function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      };

      var start = function (num, title) {
        return '<div class="ics-form">' +
          '<div class="ics-form-head"><span class="ics-form-num">' + num + '</span>' +
          '<span class="ics-form-title">' + title + '</span></div><div class="ics-body">';
      };
      var end = '</div></div>';
      var field = function (label, value) {
        return '<div class="ics-field"><div class="ics-label">' + esc(label) +
          '</div><div class="ics-value">' + (value || '&nbsp;') + '</div></div>';
      };
      var wide = function (label, value) {
        return '<div class="ics-field ics-wide"><div class="ics-label">' + esc(label) +
          '</div><div class="ics-value">' + (value || '&nbsp;') + '</div></div>';
      };
      var sign = function () {
        return '<div class="ics-sign"><span>Prepared by</span><span>Approved by</span><span>Date / Time</span></div>';
      };
      var table = function (head, rows) {
        return '<table class="ics-tbl"><thead><tr>' +
          head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + r.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table>';
      };

      var cas = jsonGet('ttx-casualty-tracker', []) || [];
      var res = jsonGet('ttx-resource-tracker', []) || [];
      var countCas = function (t) { return cas.filter(function (c) { return c.triage === t; }).length; };
      var countResType = function (type) { return res.filter(function (r) { return r.type === type; }).length; };

      var html = '';

      /* ---------------- ICS 201 — INCIDENT BRIEFING ---------------- */
      html += start('ICS 201', 'Incident Briefing');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Date / Time Prepared', esc(dateStr + ' ' + timeStr)) +
        field('3. Incident Commander', '') +
        field('4. Agency', 'Airport Emergency Management') +
        field('5. Incident Type', esc(scenario ? (scenario.category || 'aircraft') : 'Exercise')) +
        field('6. Operational Period', esc(dateStr) + ' — ongoing') +
        '</div>';
      html += '<div class="ics-sub">7. Situation Summary</div><div class="ics-grid">' +
        field('Aircraft', esc(scenario ? (scenario.aircraft || 'N/A') : '—')) +
        field('Souls on Board', scenario ? esc(scenario.soulsOnBoard) : '—') +
        field('Fuel Load', scenario ? esc(scenario.fuelLoad) : '—') +
        field('Fire Involved', scenario ? (scenario.fireInvolved ? 'Yes' : 'No') : '—') +
        field('Est. Casualties R/Y/G/D',
          scenario ? [scenario.casualties.red, scenario.casualties.yellow, scenario.casualties.green, scenario.casualties.deceased].join(' / ') : '—') +
        field('Recorded (tracker)',
          cas.length ? esc(countCas('red') + ' / ' + countCas('yellow') + ' / ' + countCas('green') + ' / ' + countCas('deceased')) : '—') +
        '</div>';
      html += '<div class="ics-sub">8. Current Actions</div>';
      if (timelineEvents.length) {
        html += '<ul class="ics-list">' +
          timelineEvents.slice(0, 14).map(function (e) {
            return '<li>[' + esc(e.time) + (e.tplus ? ' · T+' + esc(e.tplus) : '') + '] ' + esc(e.text) + '</li>';
          }).join('') +
          (timelineEvents.length > 14 ? '<li>… ' + (timelineEvents.length - 14) + ' more (see timeline)</li>' : '') +
          '</ul>';
      } else {
        html += '<p class="ics-empty">No actions recorded yet.</p>';
      }
      html += '<div class="ics-sub">9. Resource Requirements</div><div class="ics-grid">' +
        field('ARFF Vehicles', scenario ? esc(scenario.resources.arff) : '—') +
        field('Ambulances', scenario ? esc(scenario.resources.ambulances) : '—') +
        field('Fire Trucks', scenario ? esc(scenario.resources.fireTrucks) : '—') +
        field('Buses', scenario ? esc(scenario.resources.buses) : '—') +
        '</div>';
      html += sign();
      html += end;

      /* ---------------- ICS 202 — INCIDENT OBJECTIVES ---------------- */
      html += start('ICS 202', 'Incident Objectives');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Operational Period', esc(dateStr) + ' — ongoing') +
        '</div>';
      html += '<div class="ics-sub">3. Incident Objectives (in priority order)</div>' +
        '<ol class="ics-list">' +
        ['Establish Incident Command Post and command structure',
          'Ensure life safety — rescue and triage casualties',
          'Contain and control the hazard',
          'Establish hot / warm / cold zones and cordons',
          'Coordinate multi-agency response',
          'Establish Family Assistance Center',
          'Manage media and public information',
          'Document all actions for the After Action Report'
        ].map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') +
        '</ol>';
      html += '<div class="ics-sub">4. Strategy</div><ul class="ics-list">' +
        '<li>Prioritize life safety over property conservation</li>' +
        '<li>Establish unified command with all responding agencies</li>' +
        '<li>Maintain span of control (3–7 subordinates per supervisor)</li>' +
        '</ul>';
      html += sign();
      html += end;

      /* ---------------- ICS 203 — ORGANIZATION ASSIGNMENT LIST ---------------- */
      html += start('ICS 203', 'Organization Assignment List');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Date / Time Prepared', esc(dateStr + ' ' + timeStr)) +
        '</div>';
      var orgGroups = [
        ['Command Staff', ['Incident Commander', 'Safety Officer', 'Public Information Officer', 'Liaison Officer']],
        ['Operations Section', ['Operations Section Chief', 'ARFF Group Supervisor', 'EMS / Triage Group Supervisor', 'Security / Perimeter Group Supervisor']],
        ['Planning Section', ['Planning Section Chief', 'Situation Unit', 'Resources Unit']],
        ['Logistics Section', ['Logistics Section Chief', 'Staging Area Manager', 'Communications Unit Leader']]
      ];
      orgGroups.forEach(function (g) {
        html += '<div class="ics-sub">' + g[0] + '</div><div class="ics-grid">' +
          g[1].map(function (role) { return field(role, ''); }).join('') + '</div>';
      });
      html += sign();
      html += end;

      /* ---------------- ICS 204 — ASSIGNMENT LIST ---------------- */
      html += start('ICS 204', 'Assignment List');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Operational Period', esc(dateStr) + ' — ongoing') +
        '</div>';
      html += table(['Group / Unit', 'Assignment', 'Resources', 'Communications'], [
        ['Command', 'Establish ICP, unified command, overall control', 'ICP, command staff', 'Command channel'],
        ['ARFF', 'Extinguish fire, rescue trapped occupants', 'ARFF × ' + esc(scenario ? scenario.resources.arff : 2), 'Fire ground channel'],
        ['EMS / Triage', 'Triage, treatment, transport', 'Ambulances × ' + esc(scenario ? scenario.resources.ambulances : 3), 'EMS channel'],
        ['Security / Perimeter', 'Establish cordon, control access', 'Police / security unit', 'Security channel'],
        ['Logistics', 'Staging, resupply, communications', 'Staging area, comms unit', 'Logistics channel'],
        ['Family Assistance', 'Support for families and survivors', 'FAC team', 'FAC channel']
      ]);
      html += sign();
      html += end;

      /* ---------------- ICS 205 — COMMUNICATIONS LIST ---------------- */
      html += start('ICS 205', 'Communications List');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Radio System', '') +
        '</div>';
      html += table(['Function', 'Channel / Talkgroup', 'Callsign', 'Remarks'], [
        ['Command', 'CH ______', 'CMD', 'Unified command net'],
        ['Fire / ARFF', 'CH ______', 'FIRE', 'Fire ground operations'],
        ['EMS / Medical', 'CH ______', 'EMS', 'Triage and transport'],
        ['Security / Perimeter', 'CH ______', 'SEC', 'Cordon control'],
        ['Logistics', 'CH ______', 'LOG', 'Staging and resupply'],
        ['Airport Operations', 'CH ______', 'AQD', 'Airfield status / redirects']
      ]);
      html += sign();
      html += end;

      /* ---------------- ICS 206 — MEDICAL PLAN ---------------- */
      html += start('ICS 206', 'Medical Plan');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Operational Period', esc(dateStr) + ' — ongoing') +
        '</div>';
      html += table(['Resource', 'Quantity', 'Base / Location', 'Notes'], [
        ['Ambulances', esc(scenario ? scenario.resources.ambulances : '—'), '', 'Transport to hospital'],
        ['Medical teams', String(countResType('Medical') || '—'), '', 'On-scene treatment'],
        ['Hospital — primary', '1', '', 'Receiving hospital'],
        ['Hospital — secondary', '1', '', 'Backup / overflow']
      ]);
      html += wide('Triage summary (tracker)',
        cas.length
          ? esc('Red ' + countCas('red') + ' · Yellow ' + countCas('yellow') + ' · Green ' + countCas('green') +
            ' · Deceased ' + countCas('deceased') + ' · Total ' + cas.length)
          : 'No casualties recorded.');
      html += sign();
      html += end;

      /* ---------------- ICS 209 — INCIDENT SUMMARY ---------------- */
      html += start('ICS 209', 'Incident Summary');
      html += '<div class="ics-grid">' +
        field('1. Incident Name', esc(incName)) +
        field('2. Date / Time', esc(dateStr + ' ' + timeStr)) +
        field('3. Location', 'Airport Reference Layout — crash site') +
        field('4. Reported By', '') +
        '</div>';
      html += wide('5. Incident description',
        esc(scenario ? ((scenario.aircraft || 'Aircraft') + ' incident — ' + (scenario.category || 'aircraft')) : 'Exercise scenario'));
      html += '<div class="ics-grid">' +
        field('6. Casualties recorded', cas.length ? esc(cas.length + ' total') : '—') +
        field('7. Actions logged', esc(timelineEvents.length + ' timeline events')) +
        field('8. Checklist progress', esc((function () {
          var st = jsonGet('ttx-checklist-state', []) || [];
          var done = TTX_DATA.checklistItems.filter(function (x, i) { return st[i] === true; }).length;
          return done + ' / ' + TTX_DATA.checklistItems.length;
        })())) +
        field('9. Resources active', res.length ? esc(res.length + ' tracked') : '—') +
        '</div>';
      html += wide('10. Attachments', '☐ ICS 201 · ☐ ICS 202 · ☐ ICS 203 · ☐ Timeline · ☐ After Action Report');
      html += sign();
      html += end;

      return html;
    };

    if (icsBtn) {
      icsBtn.addEventListener('click', function () {
        icsModal.style.display = 'block';
        icsContent.innerHTML = generateICSForms();
      });
    }

    var icsPrintBtn = document.getElementById('icsPrintBtn');
    if (icsPrintBtn) {
      icsPrintBtn.addEventListener('click', function () {
        printMarkup(icsContent.innerHTML);
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
        var content = icsContent.innerText; // block layout -> readable lines
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
        var content = icsContent.innerText;
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
      flashSaved('resources');
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
          pushSnapshot('Before resource reset');
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
      flashSaved('casualties');
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
        pushSnapshot('Before clearing casualties');
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

              // Remember the place so the header widget can show it later
              try {
                localStorage.setItem('ttx-wx-place', JSON.stringify({ name: name, lat: lat, lon: lon }));
              } catch (e) {}
              renderWeatherWidget(weatherData);

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

    /* ---------- Inline header weather widget ---------- */
    var weatherWidget = document.getElementById('weatherWidget');
    var WX_CACHE_KEY = 'ttx-wx-cache';
    var WX_PLACE_KEY = 'ttx-wx-place';

    var WX_CODES = {
      0: ['☀️', 'Clear'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
      45: ['🌫️', 'Fog'], 48: ['🌫️', 'Rime fog'],
      51: ['🌦️', 'Light drizzle'], 53: ['🌧️', 'Drizzle'], 55: ['🌧️', 'Dense drizzle'],
      56: ['🌧️', 'Freezing drizzle'], 57: ['🌧️', 'Freezing drizzle'],
      61: ['🌧️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
      66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
      71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['🌨️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
      80: ['🌦️', 'Rain showers'], 81: ['🌧️', 'Rain showers'], 82: ['⛈️', 'Violent showers'],
      85: ['🌨️', 'Snow showers'], 86: ['🌨️', 'Snow showers'],
      95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm + hail'], 99: ['⛈️', 'Severe t-storm']
    };

    var windDirLabel = function (deg) {
      var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      return dirs[Math.round(deg / 22.5) % 16];
    };

    var renderWeatherWidget = function (data, cached) {
      if (!weatherWidget || !data || !data.current) return;
      var c = data.current;
      var code = WX_CODES[c.weather_code] || ['🌡️', '—'];
      var place = '';
      try { place = JSON.parse(localStorage.getItem(WX_PLACE_KEY) || 'null'); } catch (e) {}
      var html = '<span class="wx-icon" title="' + code[1] + '">' + code[0] + '</span>';
      html += '<span class="wx-temp">' + Math.round(c.temperature_2m) + '°C</span>';
      html += '<span class="wx-meta">' + Math.round(c.wind_speed_10m) + ' km/h ' + windDirLabel(c.wind_direction_10m) + '</span>';
      html += '<span class="wx-meta">RH ' + Math.round(c.relative_humidity_2m) + '%</span>';
      if (place && place.name) html += '<span class="wx-cond">' + place.name + '</span>';
      html += '<span class="wx-fresh" title="Data from Open-Meteo">' + (cached ? 'cached' : 'live') + '</span>';
      weatherWidget.innerHTML = html;
      weatherWidget.setAttribute('aria-label',
        'Current weather' + (place && place.name ? ' at ' + place.name : '') + ': ' + code[1] +
        ', ' + Math.round(c.temperature_2m) + ' degrees, wind ' + Math.round(c.wind_speed_10m) +
        ' kilometres per hour ' + windDirLabel(c.wind_direction_10m));
    };

    var loadWeatherWidget = function (force) {
      if (!weatherWidget) return;
      var place = null;
      try { place = JSON.parse(localStorage.getItem(WX_PLACE_KEY) || 'null'); } catch (e) {}
      if (!place || typeof place.lat !== 'number') {
        weatherWidget.innerHTML = '<span class="wx-cond">🌤️ Weather — tap to set location</span>';
        return;
      }
      // Cache for 10 minutes so refreshes don't hammer the API
      if (!force) {
        try {
          var cached = JSON.parse(localStorage.getItem(WX_CACHE_KEY) || 'null');
          if (cached && cached.t && (Date.now() - cached.t) < 10 * 60 * 1000) {
            renderWeatherWidget(cached.data, true);
            return;
          }
        } catch (e) {}
      }
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.lat + '&longitude=' + place.lon +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto';
      fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.current) return;
          try { localStorage.setItem(WX_CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
          renderWeatherWidget(data, false);
        })
        .catch(function () {
          // Offline or blocked — fall back to any cached copy
          try {
            var cached = JSON.parse(localStorage.getItem(WX_CACHE_KEY) || 'null');
            if (cached && cached.data && cached.data.current) renderWeatherWidget(cached.data, true);
          } catch (e) {}
        });
    };

    if (weatherWidget) {
      weatherWidget.addEventListener('click', function () {
        weatherModal.style.display = 'block';
        loadWeatherWidget(true);
      });
    }
    loadWeatherWidget(false);

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

    /* ================= DATA EXPORT/IMPORT ================= */
    var dataExportBtn = document.getElementById('dataExportBtn');
    var dataModal = document.getElementById('dataModal');
    var closeDataModal = document.getElementById('closeDataModal');
    var exportAllBtn = document.getElementById('exportAllBtn');
    var exportScenariosBtn = document.getElementById('exportScenariosBtn');
    var importFile = document.getElementById('importFile');
    var importBtn = document.getElementById('importBtn');
    var dataSummary = document.getElementById('dataSummary');

    var updateDataSummary = function () {
      if (!dataSummary) return;
      var customScenarios = allScenarios.filter(function (s) { return s.custom; }).length;
      var totalScenarios = allScenarios.length;
      var totalResources = resources.length;
      var totalCasualties = casualties.length;
      var totalEvents = timelineEvents.length;

      dataSummary.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">' +
        '<div><strong style="color:var(--text);">' + totalScenarios + '</strong> <span style="color:var(--muted);">Scenarios (' + customScenarios + ' custom)</span></div>' +
        '<div><strong style="color:var(--text);">' + totalResources + '</strong> <span style="color:var(--muted);">Resources</span></div>' +
        '<div><strong style="color:var(--text);">' + totalCasualties + '</strong> <span style="color:var(--muted);">Casualties</span></div>' +
        '<div><strong style="color:var(--text);">' + totalEvents + '</strong> <span style="color:var(--muted);">Timeline Events</span></div>' +
        '</div>';
    };

    /* Full backup key set — everything the dashboard persists */
    var BACKUP_KEYS = [
      'ttx-theme', 'ttx-font-scale',
      'ttx-checklist-state', 'ttx-pin-positions', 'ttx-crash-zone-positions',
      'ttx-custom-scenarios', 'ttx-casualty-tracker', 'ttx-resource-tracker',
      'ttx-timeline-events', 'ttx-restore-points', 'ttx-version-history',
      'ttx-clock', 'ttx-aar-notes', 'ttx-map-config'
    ];

    var exportData = function (type) {
      var data = {};
      if (type === 'all') {
        /* Full snapshot of every persisted key (same format as 💾 Backup) */
        data = { app: 'airport-emergency-exercise-plan', format: 1, exportedAt: new Date().toISOString(), data: {} };
        BACKUP_KEYS.forEach(function (k) {
          var v = localStorage.getItem(k);
          if (v !== null) data.data[k] = v;
        });
      } else {
        data = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          scenarios: allScenarios.filter(function (s) { return s.custom; })
        };
      }

      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (type === 'all' ? 'airport-emergency-backup-' : 'airport-emergency-data-') + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    var importData = function (file) {
      if (!file) {
        alert('Please select a file to import.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);

          /* Full backup format: restore every key, then reload */
          if (data && data.app === 'airport-emergency-exercise-plan' && data.data && typeof data.data === 'object') {
            pushSnapshot('Before backup restore');
            var count = 0;
            Object.keys(data.data).forEach(function (k) {
              if (typeof data.data[k] === 'string') { localStorage.setItem(k, data.data[k]); count++; }
            });
            if (count > 0) {
              alert('Backup restored (' + count + ' entries). Reloading…');
              location.reload();
            } else {
              alert('This file is not a valid dashboard backup.');
            }
            return;
          }

          if (!data.version || !data.scenarios) {
            alert('Invalid file format. Please use a valid export file.');
            return;
          }

          // Snapshot current state so an import can be rolled back
          pushSnapshot('Before data import');

          // Merge scenarios
          if (data.scenarios && Array.isArray(data.scenarios)) {
            data.scenarios.forEach(function (sc) {
              sc.custom = true;
              // Check for ID conflicts
              var existing = allScenarios.findIndex(function (s) { return s.id === sc.id; });
              if (existing >= 0) {
                allScenarios[existing] = sc;
              } else {
                allScenarios.push(sc);
              }
            });
            saveCustomScenarios();
          }

          // Replace resources
          if (data.resources && Array.isArray(data.resources)) {
            resources = data.resources;
            saveResources();
          }

          // Replace casualties
          if (data.casualties && Array.isArray(data.casualties)) {
            casualties = data.casualties;
            saveCasualties();
          }

          // Replace timeline events
          if (data.timelineEvents && Array.isArray(data.timelineEvents)) {
            timelineEvents = data.timelineEvents;
            saveTimeline();
            timelineHistory = [snapshotTimeline()];
            timelineHistoryIndex = 0;
            renderTimeline();
            updateUndoRedoButtons();
          }

          // Refresh scenario selector
          if (scenarioSelect) {
            scenarioSelect.innerHTML = '<option value="">— Select a scenario —</option>';
            allScenarios.forEach(function (s) {
              var opt = document.createElement('option');
              opt.value = s.id;
              opt.textContent = s.name + (s.custom ? ' (custom)' : '');
              scenarioSelect.appendChild(opt);
            });
          }

          updateDataSummary();
          alert('Data imported successfully!');
        } catch (err) {
          alert('Failed to import data: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    if (dataExportBtn) {
      dataExportBtn.addEventListener('click', function () {
        dataModal.style.display = 'block';
        updateDataSummary();
      });
    }

    if (closeDataModal) {
      closeDataModal.addEventListener('click', function () {
        dataModal.style.display = 'none';
      });
    }

    if (dataModal) {
      dataModal.addEventListener('click', function (e) {
        if (e.target === dataModal) dataModal.style.display = 'none';
      });
    }

    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function () {
        exportData('all');
      });
    }

    if (exportScenariosBtn) {
      exportScenariosBtn.addEventListener('click', function () {
        exportData('scenarios');
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', function () {
        if (importFile && importFile.files.length > 0) {
          importData(importFile.files[0]);
        } else {
          alert('Please select a file to import.');
        }
      });
    }

    /* ================= VERSION HISTORY ================= */
    var HISTORY_STORAGE_KEY = 'ttx-version-history';
    var historyBtn = document.getElementById('historyBtn');
    var historyModal = document.getElementById('historyModal');
    var closeHistoryModal = document.getElementById('closeHistoryModal');
    var historyScenarioSelect = document.getElementById('historyScenarioSelect');
    var historyList = document.getElementById('historyList');

    var historyData = {};

    var loadHistory = function () {
      try {
        var raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (raw) {
          historyData = JSON.parse(raw);
        }
      } catch (e) {}
    };

    var saveHistory = function () {
      try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData)); } catch (e) {}
    };

    var addHistoryEntry = function (scenarioId, action, details) {
      if (!historyData[scenarioId]) {
        historyData[scenarioId] = [];
      }
      historyData[scenarioId].push({
        timestamp: new Date().toISOString(),
        action: action,
        details: details
      });
      // Keep only last 50 entries per scenario
      if (historyData[scenarioId].length > 50) {
        historyData[scenarioId] = historyData[scenarioId].slice(-50);
      }
      saveHistory();
    };

    var renderHistoryScenarioSelect = function () {
      if (!historyScenarioSelect) return;
      var html = '<select id="historyScenarioDropdown" style="width:100%;background:var(--stat-bg);border:1px solid var(--line-soft);border-radius:6px;padding:8px 12px;color:var(--text);font:inherit;font-size:13px;">';
      html += '<option value="">— Select a scenario —</option>';
      allScenarios.forEach(function (sc) {
        html += '<option value="' + sc.id + '">' + sc.name + (sc.custom ? ' (custom)' : '') + '</option>';
      });
      html += '</select>';
      historyScenarioSelect.innerHTML = html;

      var dropdown = document.getElementById('historyScenarioDropdown');
      if (dropdown) {
        dropdown.addEventListener('change', function () {
          renderHistoryList(this.value);
        });
      }
    };

    var renderHistoryList = function (scenarioId) {
      if (!historyList) return;

      if (!scenarioId) {
        historyList.innerHTML = '<p style="color:var(--muted);margin:0;">Select a scenario above to view its history.</p>';
        return;
      }

      var entries = historyData[scenarioId] || [];
      if (entries.length === 0) {
        historyList.innerHTML = '<p style="color:var(--muted);margin:0;">No history recorded for this scenario.</p>';
        return;
      }

      var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
      // Show newest first
      entries.slice().reverse().forEach(function (entry) {
        var date = new Date(entry.timestamp);
        var dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        var actionColor = entry.action === 'created' ? 'var(--green)' : entry.action === 'updated' ? 'var(--blue)' : entry.action === 'deleted' ? 'var(--red)' : 'var(--muted)';

        html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
        html += '<div>';
        html += '<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:' + actionColor + ';">' + entry.action + '</span>';
        html += '<div style="font-size:12px;color:var(--muted);margin-top:2px;">' + dateStr + '</div>';
        html += '</div>';
        html += '</div>';
        if (entry.details) {
          html += '<div style="font-size:12px;color:var(--card-text);margin-top:8px;">' + entry.details + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      historyList.innerHTML = html;
    };

    var renderRestoreList = function () {
      var el = document.getElementById('restoreList');
      if (!el) return;

      var points = [];
      try { points = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]'); } catch (e) {}
      if (!Array.isArray(points) || points.length === 0) {
        el.innerHTML = '<p style="color:var(--muted);margin:0;font-size:12.5px;">No restore points yet. One is created automatically before every clear, reset or import — the last 15 are kept here.</p>';
        return;
      }

      var html = '<h3 style="margin:0 0 10px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Restore points</h3>';
      html += '<div style="display:flex;flex-direction:column;gap:8px;">';
      points.slice().reverse().forEach(function (pt) {
        var date = new Date(pt.timestamp);
        var d = pt.data || {};
        var counts = [];
        if (Array.isArray(d.timeline)) counts.push(d.timeline.length + ' timeline');
        if (Array.isArray(d.casualties)) counts.push(d.casualties.length + ' casualties');
        if (Array.isArray(d.resources)) counts.push(d.resources.length + ' resources');
        if (Array.isArray(d.checklist)) {
          counts.push(d.checklist.filter(function (x) { return x; }).length + '/' + d.checklist.length + ' ticks');
        }
        html += '<div style="padding:12px;background:var(--panel2);border:1px solid var(--line-soft);border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">';
        html += '<div style="min-width:0;">';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text);">' + pt.label + '</div>';
        html += '<div style="font-size:12px;color:var(--muted);margin-top:2px;">' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + (counts.length ? ' · ' + counts.join(' · ') : '') + '</div>';
        html += '</div>';
        html += '<button class="reset-btn" style="padding:5px 14px;font-size:12px;" onclick="window.__restorePoint(' + pt.id + ')">↩ Restore</button>';
        html += '</div>';
      });
      html += '</div>';
      html += '<p style="font-size:12px;color:var(--muted);margin:10px 0 0;">Restoring replaces the current timeline, checklist, casualties and resources. Your present state is snapshotted first, so you can switch back.</p>';
      el.innerHTML = html;
    };

    window.__restorePoint = function (id) {
      if (!confirm('Restore this point? The current timeline, checklist, casualties and resources will be replaced (your current state is saved as a restore point first).')) return;
      if (restoreSnapshot(id)) {
        flashSaved('restored');
        setTimeout(function () { location.reload(); }, 350);
      } else {
        alert('That restore point could not be found.');
      }
    };

    if (historyBtn) {
      historyBtn.addEventListener('click', function () {
        historyModal.style.display = 'block';
        renderHistoryScenarioSelect();
        renderHistoryList('');
        renderRestoreList();
      });
    }

    if (closeHistoryModal) {
      closeHistoryModal.addEventListener('click', function () {
        historyModal.style.display = 'none';
      });
    }

    if (historyModal) {
      historyModal.addEventListener('click', function (e) {
        if (e.target === historyModal) historyModal.style.display = 'none';
      });
    }

    loadHistory();

  } catch (err) {
    if (window.console) console.warn('Enhancement script skipped:', err);
  }

  /* ================= BACKUP / RESTORE (one-click header buttons) ================= */
  var backupBtn = document.getElementById('backupBtn');
  if (backupBtn) {
    backupBtn.addEventListener('click', function () {
      exportData('all');
    });
  }

  var restoreBtn = document.getElementById('restoreBtn');
  var restoreFile = document.getElementById('restoreFile');
  if (restoreBtn && restoreFile) {
    restoreBtn.addEventListener('click', function () { restoreFile.click(); });
    restoreFile.addEventListener('change', function () {
      var f = restoreFile.files && restoreFile.files[0];
      if (f) importData(f);
    });
  }

  /* ================= BACK TO TOP ================= */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    var onScrollTop = function () {
      if (window.scrollY > 400) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    };
    window.addEventListener('scroll', onScrollTop, { passive: true });
    onScrollTop();
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================= VERSION HISTORY (changelog) ================= */
  var APP_VERSION = '2026.09.30';
  var CHANGELOG = [
    { v: '2026.09.30', items: [
      'Text size controls (A− / 100% / A+ or Ctrl +/−/0) with instant apply',
      'High-contrast theme — dark → light → HC cycle (Ctrl+T)',
      'Theme and text size applied before first paint (no flash)',
      'Skip link and back-to-top button',
      'One-click 💾 Backup / 📂 Restore of all dashboard data',
      'Live weather widget in the header (Open-Meteo, 10-min cache)',
      'IC Role Cards — 8 Command & General Staff cards',
      'Filterable glossary (20 terms) and regulatory references',
      'Aircraft tab: 9-type comparison, detail cards, sub-nav, passenger & baggage flow, planning implications',
      '⚖ Scenario comparison — any two scenarios side by side',
      '🕘 Version History overlay + version shown in the dock'
    ]},
    { v: '2026.09.29', items: [
      'Sections and dialogs always open from the top',
      'TWR and ARFF station markers are draggable on the map'
    ]},
    { v: '2026.09.28', items: [
      'After Action Report with facilitator notes, .md export, copy and print',
      'Seven ICS forms (201–206, 209) auto-filled from exercise data',
      'Customize Map editor: zone radii, location list, JSON export/import',
      'CI test suite + accessibility: modal focus trap, ARIA, keyboard support'
    ]},
    { v: '2026.09.27', items: [
      'Exercise clock with T+ timer, scheduled inject release and audio cue',
      'PWA: installable, offline support via service worker'
    ]},
    { v: '2026.09.26', items: [
      'Initial release: IC phases, team labels, key locations, incident zones, emergency types, aircraft specs, checklist'
    ]}
  ];

  var changelogBtn = document.getElementById('changelogBtn');
  var changelogModal = document.getElementById('changelogModal');
  var closeChangelogModal = document.getElementById('closeChangelogModal');
  var changelogContent = document.getElementById('changelogContent');
  var footerVer = document.getElementById('footerVer');
  if (footerVer) footerVer.textContent = 'v' + APP_VERSION;

  var renderChangelog = function () {
    if (!changelogContent) return;
    var html = '';
    CHANGELOG.forEach(function (rel) {
      html += '<div class="cl-release"><div class="cl-version">v' + rel.v + '</div><ul>';
      rel.items.forEach(function (item) { html += '<li>' + item + '</li>'; });
      html += '</ul></div>';
    });
    changelogContent.innerHTML = html;
  };

  if (changelogBtn) {
    changelogBtn.addEventListener('click', function () {
      renderChangelog();
      changelogModal.style.display = 'block';
    });
  }
  if (closeChangelogModal) {
    closeChangelogModal.addEventListener('click', function () { changelogModal.style.display = 'none'; });
  }
  if (changelogModal) {
    changelogModal.addEventListener('click', function (e) { if (e.target === changelogModal) changelogModal.style.display = 'none'; });
  }

  /* ================= IC ROLE CARDS (data-driven) ================= */
  var renderRoleCards = function () {
    var grid = document.getElementById('roleGrid');
    if (!grid || !TTX_DATA.roleCards) return;
    var html = '';
    TTX_DATA.roleCards.forEach(function (r) {
      html += '<div class="role-card">';
      html += '<div class="role-head"><span class="role-tag">' + r.tag + '</span><h4>' + r.role + '</h4></div>';
      html += '<p class="role-who">' + r.who + '</p>';
      html += '<ul class="clean">';
      r.duties.forEach(function (d) { html += '<li>' + d + '</li>'; });
      html += '</ul>';
      html += '<div class="role-reports">' + r.reports + '</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
  };

  /* ================= GLOSSARY (data-driven + filter) ================= */
  var glossaryFilter = document.getElementById('glossaryFilter');
  var glossaryGrid = document.getElementById('glossaryGrid');
  var glossaryCount = document.getElementById('glossaryCount');

  var renderGlossary = function (filter) {
    if (!glossaryGrid || !TTX_DATA.glossary) return;
    var q = (filter || '').trim().toLowerCase();
    var terms = TTX_DATA.glossary.filter(function (g) {
      return !q || g.term.toLowerCase().indexOf(q) > -1 || g.def.toLowerCase().indexOf(q) > -1;
    });
    var html = '';
    terms.forEach(function (g) {
      html += '<div class="glossary-card"><div class="glossary-term">' + g.term + '</div><div class="glossary-def">' + g.def + '</div></div>';
    });
    glossaryGrid.innerHTML = html;
    if (glossaryCount) glossaryCount.textContent = terms.length + ' of ' + TTX_DATA.glossary.length + ' terms';
  };

  if (glossaryFilter) {
    glossaryFilter.addEventListener('input', function () { renderGlossary(glossaryFilter.value); });
  }
  renderGlossary('');

  /* ================= REGULATORY REFERENCES (data-driven) ================= */
  var renderReferences = function () {
    var grid = document.getElementById('refGrid');
    if (!grid || !TTX_DATA.references) return;
    var html = '';
    TTX_DATA.references.forEach(function (r) {
      html += '<div class="ref-card"><div class="ref-doc">' + r.doc + '</div><div class="ref-org">' + r.org + '</div><div class="ref-scope">' + r.scope + '</div>';
      if (r.bullets && r.bullets.length) {
        html += '<ul class="ref-bullets">';
        r.bullets.forEach(function (b) { html += '<li>' + b + '</li>'; });
        html += '</ul>';
      }
      html += '</div>';
    });
    grid.innerHTML = html;
  };
  renderReferences();

  /* ================= AIRCRAFT TABLE + CARDS (data-driven) ================= */
  var renderAircraftTable = function () {
    var body = document.getElementById('acTableBody');
    if (!body || !TTX_DATA.aircraftComparison) return;
    var html = '';
    TTX_DATA.aircraftComparison.forEach(function (a) {
      html += '<tr><td class="ac-name">' + a.name + '</td><td class="num">' + a.pax + '</td><td class="num">' + a.crew + '</td><td class="num">' + a.total + '</td><td>' + a.fuel + '</td><td class="num">' + a.wheels + '</td><td>' + a.door + '</td><td>' + a.baggage + '</td></tr>';
    });
    body.innerHTML = html;
  };

  var renderAircraftCards = function () {
    var grid = document.getElementById('acGrid');
    if (!grid || !TTX_DATA.aircraftDetails) return;
    var badges = ['✈️', '✈️', '🛫', '🛩️', '🛩️', '🛩️', '🛫', '🛫', '🛫'];
    var html = '';
    TTX_DATA.aircraftDetails.forEach(function (a, i) {
      html += '<div class="ac-card">';
      html += '<div class="ac-head"><div class="ac-badge">' + (badges[i] || '✈️') + '</div><div><h4>' + a.name + '</h4><p>' + a.operator + '</p></div></div>';
      html += '<div class="stat-grid">';
      html += '<div class="stat"><span class="num">' + a.pax + '</span><span class="lbl">Pax</span></div>';
      html += '<div class="stat"><span class="num">' + a.crew + '</span><span class="lbl">Crew</span></div>';
      html += '<div class="stat"><span class="num">' + a.total + '</span><span class="lbl">Total</span></div>';
      html += '<div class="stat"><span class="num">' + a.wheels + '</span><span class="lbl">Wheels</span></div>';
      html += '</div><div class="spec-rows">';
      a.specs.forEach(function (s) {
        html += '<div class="spec-row"><span class="k">' + s.k + '</span><span class="v">' + s.v + '</span></div>';
      });
      html += '</div></div>';
    });
    grid.innerHTML = html;
  };

  /* ================= SCENARIO COMPARISON ================= */
  var compareBtn = document.getElementById('compareBtn');
  var compareModal = document.getElementById('compareModal');
  var closeCompareModal = document.getElementById('closeCompareModal');
  var cmpA = document.getElementById('cmpA');
  var cmpB = document.getElementById('cmpB');
  var cmpBody = document.getElementById('cmpBody');

  var renderCompareSelectors = function () {
    if (!cmpA || !cmpB) return;
    var opts = allScenarios.map(function (s) {
      return '<option value="' + s.id + '">' + s.name + (s.custom ? ' (custom)' : '') + '</option>';
    }).join('');
    var a = cmpA.value || (allScenarios[0] && allScenarios[0].id) || '';
    var b = cmpB.value || '';
    if (!b || b === a) {
      var other = allScenarios.find(function (s) { return s.id !== a; });
      b = other ? other.id : a;
    }
    cmpA.innerHTML = opts; cmpA.value = a;
    cmpB.innerHTML = opts; cmpB.value = b;
  };

  var renderCompare = function () {
    if (!cmpBody || !cmpA || !cmpB) return;
    var a = allScenarios.find(function (s) { return s.id === cmpA.value; });
    var b = allScenarios.find(function (s) { return s.id === cmpB.value; });
    if (!a || !b) { cmpBody.innerHTML = '<p style="color:var(--muted);margin:0;">Select two scenarios to compare.</p>'; return; }
    var row = function (label, va, vb) {
      return '<div class="cmp-row"><div class="cmp-label">' + label + '</div><div class="cmp-val">' + va + '</div><div class="cmp-val">' + vb + '</div></div>';
    };
    var html = '<div class="cmp-grid">';
    html += '<div class="cmp-row cmp-head"><div class="cmp-label"></div><div class="cmp-val">' + a.name + '</div><div class="cmp-val">' + b.name + '</div></div>';
    html += row('Aircraft', a.aircraft || '—', b.aircraft || '—');
    html += row('Souls on board', a.soulsOnBoard, b.soulsOnBoard);
    html += row('Fuel load', a.fuelLoad || '—', b.fuelLoad || '—');
    html += row('Fire involved', a.fireInvolved ? 'Yes' : 'No', b.fireInvolved ? 'Yes' : 'No');
    html += row('Casualties (R/Y/G/D)',
      a.casualties.red + ' / ' + a.casualties.yellow + ' / ' + a.casualties.green + ' / ' + a.casualties.deceased,
      b.casualties.red + ' / ' + b.casualties.yellow + ' / ' + b.casualties.green + ' / ' + b.casualties.deceased);
    html += row('Resources (ARFF/Amb/Fire/Bus)',
      a.resources.arff + ' / ' + a.resources.ambulances + ' / ' + a.resources.fireTrucks + ' / ' + a.resources.buses,
      b.resources.arff + ' / ' + b.resources.ambulances + ' / ' + b.resources.fireTrucks + ' / ' + b.resources.buses);
    html += row('Injects', a.injects.length, b.injects.length);
    html += '</div>';
    cmpBody.innerHTML = html;
  };

  if (compareBtn) {
    compareBtn.addEventListener('click', function () {
      renderCompareSelectors();
      renderCompare();
      compareModal.style.display = 'block';
    });
  }
  if (cmpA) cmpA.addEventListener('change', renderCompare);
  if (cmpB) cmpB.addEventListener('change', renderCompare);
  if (closeCompareModal) {
    closeCompareModal.addEventListener('click', function () { compareModal.style.display = 'none'; });
  }
  if (compareModal) {
    compareModal.addEventListener('click', function (e) { if (e.target === compareModal) compareModal.style.display = 'none'; });
  }

  /* Render data-driven content sections (after their definitions above) */
  renderRoleCards();
  renderAircraftTable();
  renderAircraftCards();

  /* ================= A11Y — MODAL DIALOGS ================= */
  /* Dialog semantics for every *Modal overlay: role/aria-modal/labelledby,
     focus moves into the dialog on open and returns to the opener on close,
     Tab cycles inside, Escape closes (via each modal's own close button),
     and the page behind gets `inert` while a dialog is up. Visibility
     flips are detected with a MutationObserver because modals open by
     setting style.display. */
  (function () {
    var MODAL_SEL = 'div[id$="Modal"]';
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),' +
      'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    var BG_SEL = 'header.app-header,nav.tabs,main.wrap,.app-dock,.tab-radio';

    var modals = Array.prototype.slice.call(document.querySelectorAll(MODAL_SEL));
    if (!modals.length) return;

    modals.forEach(function (m) {
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.setAttribute('tabindex', '-1');
      var title = m.querySelector('h2');
      if (title) {
        if (!title.id) title.id = m.id + '-title';
        m.setAttribute('aria-labelledby', title.id);
      }
    });

    var getOpen = function () {
      for (var i = 0; i < modals.length; i++) {
        var st = modals[i].style.display;
        if (st && st !== 'none') return modals[i];
      }
      return null;
    };

    var lastFocused = null;

    var setBackgroundInert = function (on) {
      Array.prototype.forEach.call(document.querySelectorAll(BG_SEL), function (el) {
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    };

    var mo = new MutationObserver(function (records) {
      records.forEach(function (rec) {
        var m = rec.target;
        var visible = !!(m.style.display && m.style.display !== 'none');
        if (visible && !m.hasAttribute('data-a11y-open')) {
          m.setAttribute('data-a11y-open', '');
          m.scrollTop = 0; // dialogs always open from the top
          lastFocused = document.activeElement;
          setBackgroundInert(true);
          m.focus();
        } else if (!visible && m.hasAttribute('data-a11y-open')) {
          m.removeAttribute('data-a11y-open');
          setBackgroundInert(false);
          if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
          }
          lastFocused = null;
        }
      });
    });
    modals.forEach(function (m) {
      mo.observe(m, { attributes: true, attributeFilter: ['style'] });
    });

    document.addEventListener('keydown', function (e) {
      var m = getOpen();
      if (!m) return;

      if (e.key === 'Escape' || e.key === 'Esc') {
        var closeBtn = m.querySelector('button[id^="close"]');
        if (closeBtn) closeBtn.click();
        return;
      }
      if (e.key !== 'Tab') return;

      var focusables = Array.prototype.filter.call(m.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null;
      });
      if (!focusables.length) { e.preventDefault(); return; }

      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === m || !m.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || active === m || !m.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  })();

  /* ================= PWA — OFFLINE + UPDATE TOAST ================= */
  (function () {
    if (!('serviceWorker' in navigator)) return;
    var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocal) return;

    var updateRequested = false;
    var refreshing = false;

    var showUpdateToast = function (worker) {
      if (document.getElementById('updateToast')) return;
      var toast = document.createElement('div');
      toast.id = 'updateToast';
      toast.setAttribute('role', 'status');
      toast.innerHTML =
        '<span>🔄 New version ready — reload to update.</span>' +
        '<button type="button" id="updateToastBtn">Reload</button>' +
        '<button type="button" id="updateToastX" aria-label="Dismiss update notice">✕</button>';
      document.body.appendChild(toast);
      document.getElementById('updateToastBtn').addEventListener('click', function () {
        updateRequested = true;
        toast.parentNode.removeChild(toast);
        if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
        else location.reload();
      });
      document.getElementById('updateToastX').addEventListener('click', function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      });
    };

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.update().catch(function () {});

        // A worker may already be waiting from an earlier visit — offer it.
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg.waiting);

        // register() may have ALREADY found an update (updatefound fires
        // before the promise resolves), so watch reg.installing directly
        // as well as future updatefound events.
        var watch = function (w) {
          if (!w) return;
          var check = function () {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(w);
            }
          };
          w.addEventListener('statechange', check);
          check();
        };
        watch(reg.installing);
        reg.addEventListener('updatefound', function () { watch(reg.installing); });
      }).catch(function (err) {
        if (window.console) console.warn('Service worker registration failed:', err);
        /* SW unavailable (e.g. private mode) — app still works online */
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!updateRequested || refreshing) return;
      refreshing = true;
      location.reload();
    });
  })();

})();
