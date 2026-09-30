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
  await app.waitForSelector('#checkGrid .check-item', { timeout: 15000 });

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
} catch (err) {
  failed = true;
  console.error('Runner error:', err);
} finally {
  await browser.close();
  server.close();
}

console.log(failed ? '\nCI FAILED' : '\nCI PASSED');
process.exit(failed ? 1 : 0);
