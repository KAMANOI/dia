#!/usr/bin/env node
// Regression check for the OG image's Japanese font fetch (fetchNotoSansJP in src/app/opengraph-image.tsx). Usage: node scripts/check-og-font.mjs
// Offline: fetch is replaced with a stub that serves fixed CSS / font bytes. Nothing goes to the network.
// The function is read out of the real file (not a copy) so the hash-pinned file in verify-no-ai-calls.mjs stays untouched;
// the .tsx imports next/og and has JSX, so it is sliced to the one function and its types are stripped.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const src = readFileSync(new URL('../src/app/opengraph-image.tsx', import.meta.url), 'utf8');
const start = src.indexOf('async function fetchNotoSansJP('), end = src.indexOf('export default async function OGImage');
assert.ok(start > 0 && end > start, 'fetchNotoSansJP not found in opengraph-image.tsx');
const load = new Function('fetch', 'URL', stripTypeScriptTypes(src.slice(start, end)) + '\nreturn fetchNotoSansJP;');
const fetchNotoSansJP = (impl) => load(impl, URL)();

const FONT = new Uint8Array([0, 1, 0, 0, 0x4e, 0x4f]).buffer; // dummy font bytes
const cssFor = (url, format) => `@font-face {\n  font-family: 'Noto Sans JP';\n  font-weight: 700;\n  src: url(${url}) format('${format}');\n}\n`;

/** Stub fetch: first call returns the CSS, later calls return the font. Records every call. */
function stub(css, { fontOk = true, cssThrows = false } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (calls.length === 1) {
      if (cssThrows) throw new Error('offline');
      return { text: async () => css };
    }
    return { ok: fontOk, arrayBuffer: async () => FONT };
  };
  return { impl, calls };
}

const GSTATIC = 'https://fonts.gstatic.com/s/notosansjp/v53/abc.ttf';

// 1. Bug repro (2026-11-04): with UA Mozilla/5.0 Google answers format('truetype'). Must fetch the font, not fall back.
{
  const { impl, calls } = stub(cssFor(GSTATIC, 'truetype'));
  assert.equal(await fetchNotoSansJP(impl), FONT);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, GSTATIC);
  assert.deepEqual(calls[1].init, { redirect: 'error' }); // redirects are not followed
  assert.match(calls[0].url, /^https:\/\/fonts\.googleapis\.com\/css2\?/);
}

// 2. Formats that worked before keep working.
for (const format of ['woff2', 'opentype']) {
  const url = `https://fonts.gstatic.com/s/notosansjp/v53/abc.${format}`;
  const { impl, calls } = stub(cssFor(url, format));
  assert.equal(await fetchNotoSansJP(impl), FONT, format);
  assert.equal(calls[1].url, url);
}

// 3. Host restriction (SSRF guard) still holds for every accepted format: the font URL is never requested.
for (const format of ['truetype', 'woff2']) {
  for (const url of [
    'https://evil.example/abc.ttf',
    'http://fonts.gstatic.com/abc.ttf',
    'https://fonts.gstatic.com:8443/abc.ttf',
    'https://fonts.gstatic.com.evil.example/abc.ttf',
    'https://169.254.169.254/latest/meta-data',
  ]) {
    const { impl, calls } = stub(cssFor(url, format));
    assert.equal(await fetchNotoSansJP(impl), null, `${format} ${url}`);
    assert.equal(calls.length, 1, `${format} ${url} must not be fetched`);
  }
}

// 4. Unknown format / no src / CSS fetch failure / font not ok → null (English fallback), never throws.
{
  const unknown = stub(cssFor(GSTATIC, 'svg'));
  assert.equal(await fetchNotoSansJP(unknown.impl), null);
  assert.equal(unknown.calls.length, 1);
  assert.equal(await fetchNotoSansJP(stub('/* empty */').impl), null);
  assert.equal(await fetchNotoSansJP(stub('', { cssThrows: true }).impl), null);
  assert.equal(await fetchNotoSansJP(stub(cssFor(GSTATIC, 'truetype'), { fontOk: false }).impl), null);
}

console.log('check-og-font: ok');
