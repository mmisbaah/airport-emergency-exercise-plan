#!/usr/bin/env node
/* CI runner — serves the repo on a random local port, loads tests.html in
   headless Chromium, and fails the build if any test fails or the page
   throws. Also boots index.html as a smoke test (app must render with no
   console/page errors).

   Usage:  node scripts/ci-tests.mjs   (requires: npm i playwright) */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = normalize(fileURLToPath(new URL('..', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(ROOT, pathname));
    if (!file.startsWith(ROOT)) throw new Error('path traversal');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
console.log(`Serving ${ROOT} at ${base}`);

let failed = false;

const browser = await chromium.launch();

/* ---- 1. unit test suite -------------------------------------------- */
try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(`${base}/tests/tests.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.results && window.results.total > 0, undefined, { timeout: 30000 });
  const results = await page.evaluate(() => ({
    pass: window.results.pass,
    fail: window.results.fail,
    total: window.results.total,
    detail: document.getElementById('results').innerText
  }));

  console.log(`\ntests.html: ${results.pass}/${results.total} passed, ${results.fail} failed`);
  if (results.fail > 0) {
    failed = true;
    console.error('--- failures ---\n' + results.detail);
  }
  if (pageErrors.length) {
    failed = true;
    console.error('tests.html page errors:\n' + pageErrors.join('\n'));
  }
  await page.close();

  /* ---- 2. app smoke test ------------------------------------------- */
  const app = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const appErrors = [];
  app.on('pageerror', (err) => appErrors.push('pageerror: ' + String(err)));
  app.on('console', (msg) => { if (msg.type() === 'error') appErrors.push('console: ' + msg.text()); });

  await app.goto(`${base}/index.html`, { waitUntil: 'load' });
  // attached (not visible): the checklist lives on a tab that is hidden
  // until selected — rendering the items proves the app booted
  await app.waitForSelector('#checkGrid .check-item', { state: 'attached', timeout: 15000 });

  const boot = await app.evaluate(() => ({
    checklist: document.querySelectorAll('#checkGrid .check-item').length,
    pins: document.querySelectorAll('#pinLayer .pin').length,
    tabs: document.querySelectorAll('.tabs .tab').length,
    modals: document.querySelectorAll('[id$="Modal"][role="dialog"]').length
  }));

  console.log(`app smoke: ${boot.checklist} checklist items, ${boot.pins} pins, ${boot.tabs} tabs, ${boot.modals} labelled dialogs`);

  if (boot.checklist === 0 || boot.pins === 0 || boot.tabs === 0) {
    failed = true;
    console.error('App smoke check failed — core UI did not render.');
  }
  if (boot.modals < 5) {
    failed = true;
    console.error(`Expected dialogs to carry role=dialog, found ${boot.modals}.`);
  }
  if (appErrors.length) {
    failed = true;
    console.error('App console/page errors:\n' + appErrors.join('\n'));
  }
  await app.close();

  /* ---- 3. behavior (end-to-end) tests ------------------------------- */
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
  const behavior = async (label, fn) => {
    try { await fn(); console.log(`  ✓ ${label}`); }
    catch (err) { failed = true; console.error(`  ✗ ${label}: ${err.message}`); }
  };
  /* fresh context per test = clean localStorage */
  const newAppPage = async () => {
    const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', (e) => p.errors.push('pageerror: ' + String(e)));
    p.on('console', (m) => { if (m.type() === 'error') p.errors.push('console: ' + m.text()); });
    await p.goto(`${base}/index.html`, { waitUntil: 'load' });
    await p.waitForSelector('#checkGrid .check-item', { state: 'attached', timeout: 15000 });
    return { ctx, p };
  };

  await behavior('home = Emergency Types, onboarding gated to TTX tab, ? shortcut', async () => {
    const { ctx, p } = await newAppPage();
    assert(await p.isChecked('#ttx-tab-emergencies'), 'home page should open on Emergency Types');
    // the start guide must NOT show on the home tab
    assert(!(await p.isVisible('#scenarioPanel .onboard')), 'onboarding should be hidden on the default tab');
    // …but it appears on TTX Flow & Checklist (7th tab)
    await p.click('.tabs .tab >> nth=6');
    await p.waitForSelector('#scenarioPanel .onboard', { state: 'visible', timeout: 3000 });
    await p.keyboard.press('Shift+Slash');
    await p.waitForSelector('#shortcutsModal', { state: 'visible', timeout: 3000 });
    await p.keyboard.press('Escape');
    await p.waitForSelector('#shortcutsModal', { state: 'hidden', timeout: 3000 });
    assert(p.errors.length === 0, p.errors.join('; '));
    await ctx.close();
  });

  await behavior('active tab + checklist tick persist across reload', async () => {
    const { ctx, p } = await newAppPage();
    await p.click('.tabs .tab >> nth=2'); // Incident Zones — not the default tab
    await p.evaluate(() => document.querySelectorAll('#checkGrid .check-input')[0].click());
    await p.reload({ waitUntil: 'load' });
    await p.waitForSelector('#checkGrid .check-item', { state: 'attached', timeout: 15000 });
    const state = await p.evaluate(() => ({
      tab: document.getElementById('ttx-tab-zones').checked,
      tick: document.querySelectorAll('#checkGrid .check-input')[0].checked
    }));
    assert(state.tab, 'active tab not restored after reload');
    assert(state.tick, 'checklist tick not restored after reload');
    assert(p.errors.length === 0, p.errors.join('; '));
    await ctx.close();
  });

  await behavior('escapes hostile scenario data + tracker counts persist', async () => {
    const { ctx, p } = await newAppPage();
    const evil = '<img src=x onerror=alert(1)>';
    await p.evaluate((name) => {
      localStorage.setItem('ttx-custom-scenarios', JSON.stringify([{
        id: 'custom-xss', name: name, aircraft: '<b>bad aircraft</b>',
        soulsOnBoard: 12, fuelLoad: '" onmouseover="alert(2)',
        fireInvolved: false, category: 'Runway Excursion',
        casualties: { red: 1, yellow: 2, green: 3, deceased: 0 },
        resources: { arff: 2, ambulances: 3, fireTrucks: 1, buses: 1 },
        injects: ['<script>evil()</script>'], custom: true
      }]));
      localStorage.setItem('ttx-active-scenario', 'custom-xss');
    }, evil);
    await p.reload({ waitUntil: 'load' });
    await p.waitForSelector('#scenarioPanel h3', { timeout: 10000 });

    const panel = await p.evaluate(() => {
      const h3 = document.querySelector('#scenarioPanel h3');
      return {
        text: h3.textContent,
        hasImg: !!h3.querySelector('img'),
        raw: document.getElementById('scenarioPanel').innerHTML.indexOf('<img src=x') !== -1,
        rows: document.querySelectorAll('#scenarioResTracker [onclick*="__bumpScenarioRes"]').length
      };
    });
    assert(panel.text === evil, `panel title should be literal, got: ${panel.text}`);
    assert(!panel.hasImg, 'injected <img> element found in panel title');
    assert(!panel.raw, 'unescaped <img src=x markup present in panel HTML');
    assert(panel.rows > 0, 'scenario resources tracker rows missing');

    const t1 = await p.textContent('#scenarioResTracker');
    await p.evaluate(() => {
      const plus = Array.prototype.find.call(
        document.querySelectorAll('#scenarioResTracker [onclick*="__bumpScenarioRes"]'),
        (b) => (b.getAttribute('onclick') || '').indexOf(",1'") !== -1
      );
      if (plus) plus.click();
    });
    const t2 = await p.textContent('#scenarioResTracker');
    assert(t2 !== t1, 'committing a unit did not change the tracker text');
    await p.reload({ waitUntil: 'load' });
    await p.waitForSelector('#scenarioResTracker', { timeout: 10000 });
    const t3 = await p.textContent('#scenarioResTracker');
    assert(t3 === t2, 'tracker counts not persisted across reload');
    assert(p.errors.length === 0, p.errors.join('; '));
    await ctx.close();
  });

  await behavior('backup download roundtrip + reminder toast', async () => {
    const { ctx, p } = await newAppPage();
    await p.evaluate(() => {
      document.querySelectorAll('#checkGrid .check-input')[0].click();
      localStorage.setItem('ttx-scenario-resources', JSON.stringify({ 'custom-x': { arff: 1 } }));
    });
    await p.click('#dataExportBtn');
    await p.waitForSelector('#exportAllBtn', { state: 'visible', timeout: 5000 });
    const [dl] = await Promise.all([
      p.waitForEvent('download', { timeout: 10000 }),
      p.click('#exportAllBtn')
    ]);
    const json = JSON.parse(await readFile(await dl.path(), 'utf8'));
    assert(json.app === 'airport-emergency-exercise-plan', 'backup .app field wrong');
    assert(json.data && 'ttx-checklist-state' in json.data, 'backup missing ttx-checklist-state');
    assert('ttx-scenario-resources' in json.data, 'backup missing ttx-scenario-resources');

    // reminder toast: appears (6s) when there is data and no recent dismissal
    await p.evaluate(() => {
      localStorage.setItem('ttx-timeline-events', JSON.stringify([
        { id: 'a', time: '10:00', text: 'one', category: 'inject' },
        { id: 'b', time: '10:05', text: 'two', category: 'decision' },
        { id: 'c', time: '10:10', text: 'three', category: 'milestone' }
      ]));
    });
    await p.reload({ waitUntil: 'load' });
    await p.waitForSelector('#backupNudge', { state: 'visible', timeout: 12000 });
    await p.click('#nudgeCloseBtn');
    await p.waitForSelector('#backupNudge', { state: 'hidden', timeout: 3000 });
    assert(p.errors.length === 0, p.errors.join('; '));
    await ctx.close();
  });

  await behavior('phone viewport: collapsible ☰ nav panel', async () => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 760 } });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', (e) => p.errors.push('pageerror: ' + String(e)));
    p.on('console', (m) => { if (m.type() === 'error') p.errors.push('console: ' + m.text()); });
    await p.goto(`${base}/index.html`, { waitUntil: 'load' });
    await p.waitForSelector('#checkGrid .check-item', { state: 'attached', timeout: 15000 });

    // strip collapses into the toggle on phones
    assert(await p.isVisible('#navToggle'), 'hamburger toggle missing at 375px');
    assert(!(await p.isVisible('.tabs .tab >> nth=0')), 'tab strip should be hidden at 375px');
    assert((await p.textContent('#navCurrentTab')).includes('Emergency Types'),
      'toggle should show the home section');

    // open → sections + quick actions listed, active section highlighted
    await p.click('#navToggle');
    await p.waitForSelector('body.nav-open', { state: 'visible', timeout: 3000 });
    // wait (retry) rather than single isVisible — the drawer slides in over .25s
    await p.waitForSelector('#navDrawer .nav-item[for="ttx-tab-zones"]', { state: 'visible', timeout: 3000 });
    assert(await p.isVisible('#navDrawer .nav-q[data-target="guideBtn"]'), 'drawer quick actions missing');
    assert((await p.getAttribute('#navToggle', 'aria-expanded')) === 'true', 'aria-expanded not set');

    // pick a section → tab switches, drawer closes, toggle label updates
    await p.click('#navDrawer .nav-item[for="ttx-tab-zones"]');
    await p.waitForFunction(() => !document.body.classList.contains('nav-open'), null, { timeout: 3000 });
    assert(await p.isChecked('#ttx-tab-zones'), 'section did not switch from the drawer');
    assert((await p.textContent('#navCurrentTab')).includes('Incident Zones'), 'toggle label not updated');

    // scrim closes it too; Escape closes it as well
    await p.click('#navToggle');
    await p.waitForSelector('body.nav-open', { state: 'visible', timeout: 3000 });
    await p.click('#navScrim', { position: { x: 360, y: 400 } });
    await p.waitForFunction(() => !document.body.classList.contains('nav-open'), null, { timeout: 3000 });
    await p.click('#navToggle');
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => !document.body.classList.contains('nav-open'), null, { timeout: 3000 });

    assert(p.errors.length === 0, p.errors.join('; '));
    await ctx.close();
  });
} catch (err) {
  failed = true;
  console.error('Runner error:', err);
} finally {
  await browser.close();
  server.close();
}

console.log(failed ? '\nCI FAILED' : '\nCI PASSED');
process.exit(failed ? 1 : 0);
