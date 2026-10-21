#!/usr/bin/env node
/* Deploy to Cloudflare Pages.

   Every deploy bumps the service worker cache version (eop-YYYYMMDD.N where
   N is the commit count) and the matching ?v= strings on the css/js links in
   index.html, so stale caches are cleaned up and returning visitors silently
   pick up the new version on their next reload. The bump is committed
   first, so the deployed tree always matches the repo.

   Usage:
     $env:CLOUDFLARE_API_TOKEN = '...'   # wrangler API token
     $env:CLOUDFLARE_ACCOUNT_ID = '...'  # account id
     node scripts/deploy.mjs             # bump + commit + deploy
     node scripts/deploy.mjs --no-bump   # deploy as-is (emergency only) */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(fileURLToPath(new URL('..', import.meta.url)));

function run(cmd, silent = false) {
  return execSync(cmd, { cwd: ROOT, stdio: silent ? 'pipe' : 'inherit', encoding: 'utf8' });
}

if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error('✗ CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set.');
  process.exit(1);
}

if (!process.argv.includes('--no-bump')) {
  const swPath = join(ROOT, 'sw.js');
  const sw = readFileSync(swPath, 'utf8');
  const current = (sw.match(/var VERSION = '([^']+)'/) || [])[1];
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let count = '?';
  try { count = run('git rev-list --count HEAD', true).trim(); } catch {}
  const next = `eop-${d}.${count}`;
  if (current !== next) {
    writeFileSync(swPath, sw.replace(/var VERSION = '[^']+';/, `var VERSION = '${next}';`));
    // keep the ?v= cache-busting strings on css/js in step with the sw
    const htmlPath = join(ROOT, 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    const v = next.replace(/^eop-/, '');
    writeFileSync(htmlPath, html.replace(/((?:css|js)\/[\w.-]+\.(?:css|js))\?v=[\w.-]+/g, `$1?v=${v}`));
    run('git add sw.js index.html');
    run(`git commit -m "chore: bump service worker cache to ${next}"`);
    console.log(`✓ sw cache version: ${current} → ${next}`);
  } else {
    console.log(`✓ sw cache version already ${next}`);
  }
}

run('npx wrangler pages deploy . --project-name=airport-emergency --branch=main --commit-dirty=true');
console.log('✓ deployed — remember: git push');
