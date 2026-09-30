/* Generate PWA icons (icon-192.png, icon-512.png) from the favicon design.
   No SVG rasterizer is available on this machine, so this renders the same
   artwork directly: rounded-rect diagonal gradient + top glow + border ring +
   the white airplane path, 4x supersampled, written as a raw PNG via zlib.

   Usage: node scripts/make-icons.js                                     */
'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------------- PNG encoding ---------------- */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- airplane path (64-space) ---------------- */
/* The path from favicon.svg: M/v/l/V/c/S/L/z — flattened to one polygon. */
function flattenAirplane() {
  const d = 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z';
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const pts = [];
  let i = 0;
  let x = 0, y = 0, sx = 0, sy = 0;   // current / subpath start
  let cmd = '';
  let prevCtrl = null;                 // previous cubic control point (for S)

  const num = () => parseFloat(tokens[i++]);
  const push = (px, py) => pts.push([px, py]);
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const x0 = x, y0 = y;
    for (let t = 1; t <= 14; t++) {
      const u = t / 14, v = 1 - u;
      push(
        v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
        v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3
      );
    }
  };

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') {
      x = num(); y = num();
      if (rel) { /* M relative — not used in this path, handled anyway */ }
      sx = x; sy = y; push(x, y);
      cmd = rel ? 'l' : 'L'; // subsequent pairs are lineto
      prevCtrl = null;
    } else if (C === 'L') {
      let nx = num(), ny = num();
      if (rel) { nx += x; ny += y; }
      x = nx; y = ny; push(x, y); prevCtrl = null;
    } else if (C === 'V') {
      let ny = num();
      if (rel) ny += y;
      y = ny; push(x, y); prevCtrl = null;
    } else if (C === 'H') {
      let nx = num();
      if (rel) nx += x;
      x = nx; push(x, y); prevCtrl = null;
    } else if (C === 'C') {
      let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      if (rel) { x1 += x; y1 += y; x2 += x; y2 += y; x3 += x; y3 += y; }
      prevCtrl = [x2, y2];
      cubic(x1, y1, x2, y2, x3, y3);
      x = x3; y = y3;
    } else if (C === 'S') {
      let x2 = num(), y2 = num(), x3 = num(), y3 = num();
      if (rel) { x2 += x; y2 += y; x3 += x; y3 += y; }
      const x1 = prevCtrl ? 2 * x - prevCtrl[0] : x;
      const y1 = prevCtrl ? 2 * y - prevCtrl[1] : y;
      prevCtrl = [x2, y2];
      cubic(x1, y1, x2, y2, x3, y3);
      x = x3; y = y3;
    } else if (C === 'Z') {
      x = sx; y = sy; prevCtrl = null;
      if (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) i++; // no-op safety
    } else {
      throw new Error('Unsupported path command: ' + cmd);
    }
  }
  // favicon transform: translate(14.5, 13.5) scale(1.52)
  return pts.map(([px, py]) => [14.5 + px * 1.52, 13.5 + py * 1.52]);
}

/* nonzero-winding point in polygon */
function inPoly(px, py, poly) {
  let w = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    if (y1 <= py) {
      if (y2 > py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) > 0) w++;
    } else if (y2 <= py && (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1) < 0) {
      w--;
    }
  }
  return w !== 0;
}

/* rounded rect test in 64-space (rect 0,0,64,64 radius r, inset i) */
function inRoundRectStrict(px, py, r, inset) {
  const lo = inset, hi = 64 - inset;
  if (px < lo || px > hi || py < lo || py > hi) return false;
  const rr = Math.max(0.001, r - inset);
  const cx = Math.min(Math.max(px, lo + rr), hi - rr);
  const cy = Math.min(Math.max(py, lo + rr), hi - rr);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= rr * rr;
}

/* ---------------- icon rendering ---------------- */
function renderIcon(size) {
  const plane = flattenAirplane();
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 4; // supersampling
  const stops = [[0x1e, 0x3a, 0x8a], [0x0e, 0x1c, 0x38]]; // #1e3a8a -> #0e1c38
  const glowC = [0x3b, 0x82, 0xf6];
  const borderC = [0x2c, 0x4a, 0x7a];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let covered = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) / size;  // 0..1
          const uy = (py + (sy + 0.5) / SS) / size;
          const X = ux * 64, Y = uy * 64;            // 64-space
          if (!inRoundRectStrict(X, Y, 14, 0)) continue;
          covered++;
          let r, g, b;
          if (!inRoundRectStrict(X, Y, 14, 2)) {
            // border ring (stroke #2c4a7a on top of everything)
            r = borderC[0]; g = borderC[1]; b = borderC[2];
          } else {
            const t = (X + Y) / 128; // diagonal gradient
            r = stops[0][0] + (stops[1][0] - stops[0][0]) * t;
            g = stops[0][1] + (stops[1][1] - stops[0][1]) * t;
            b = stops[0][2] + (stops[1][2] - stops[0][2]) * t;
            const a = 0.55 * (1 - Y / 64); // vertical glow overlay
            r = r * (1 - a) + glowC[0] * a;
            g = g * (1 - a) + glowC[1] * a;
            b = b * (1 - a) + glowC[2] * a;
            if (inPoly(X, Y, plane)) { r = 255; g = 255; b = 255; }
          }
          rSum += r; gSum += g; bSum += b;
        }
      }
      const o = (py * size + px) * 4;
      const total = SS * SS;
      rgba[o + 3] = Math.round((covered / total) * 255);
      if (covered > 0) {
        rgba[o] = Math.min(255, Math.round(rSum / covered));
        rgba[o + 1] = Math.min(255, Math.round(gSum / covered));
        rgba[o + 2] = Math.min(255, Math.round(bSum / covered));
      }
    }
  }
  return encodePNG(size, size, rgba);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = path.join(outDir, 'icon-' + size + '.png');
  fs.writeFileSync(file, renderIcon(size));
  console.log('wrote ' + file + ' (' + fs.statSync(file).size + ' bytes)');
}
