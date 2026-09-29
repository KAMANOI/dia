#!/usr/bin/env node
// Dependency-free, conservative source guard. Run from any working directory.
// This is a static regression check, not a proof against deliberately obfuscated code.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'src');
const files = [];
const links = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) links.push(relative(root, path));
    else if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) files.push({ path: relative(root, path).split('\\').join('/'), text: readFileSync(path, 'utf8') });
  }
}
let failed = false;
function check(name, violations) {
  console.log(`${violations.length ? 'FAIL' : 'PASS'} ${name}`);
  // Print paths only, never source lines (which could contain credentials).
  for (const path of violations) console.log(`  ${path}`);
  if (violations.length) failed = true;
}
if (existsSync(sourceRoot)) walk(sourceRoot);
check('Source tree present and readable without symlinks', [...(!files.length ? ['src missing or empty'] : []), ...links]);
check('No src/app/api directory or routes', existsSync(join(root, 'src/app/api')) ? ['src/app/api'] : []);

// Decode common literal escapes so bracket-property access is checked too.
const decoded = text => text.replace(/\\u\{([\da-f]{1,6})\}|\\u([\da-f]{4})|\\x([\da-f]{2})/gi,
  (whole, a, b, c) => { const n = Number.parseInt(a || b || c, 16); return n <= 0x10ffff ? String.fromCodePoint(n) : whole; });
const matching = expression => files.filter(file => expression.test(decoded(file.text))).map(file => file.path);
check('No server actions', matching(/use\s+server/i));

// Pin the entire reviewed OG file: never exempt every request in a named file.
// It contains ONLY the existing Google Fonts CSS + referenced font fetches.
// Any edit to this file requires reviewing the exception again.
const ogPath = 'src/app/opengraph-image.tsx';
const ogHash = 'd92e817494291bf5687ee7e0703fafdda939da4799a0377bed250a9b28040939';
const network = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|axios|ky|ofetch|undici)\b|(?:node:)?https?['"]|next\/script/i;
check('No network APIs except the pinned OG font fetch', files.filter(file => {
  if (!network.test(decoded(file.text))) return false;
  return !(file.path === ogPath && createHash('sha256').update(file.text).digest('hex') === ogHash);
}).map(file => file.path));
check('No AI hosts or SDK strings', matching(/generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|api\.(?:openai|anthropic|mistral|cohere)\.com|api\.replicate\.com|(?:from|import|require)\s*\(?\s*['"](?:openai|@anthropic-ai\/[\w-]+|@google\/(?:genai|generative-ai)|@google-cloud\/vertexai|replicate|ai|@ai-sdk\/[\w-]+)['"]|@ai-sdk|huggingface|inference\.run|api\.together|api\.groq|fal\.ai|fal-ai|bedrock-runtime/i));
check('Image and video pages restored', ['image', 'video'].filter(kind => !existsSync(join(root, `src/app/${kind}/page.tsx`))).map(kind => `src/app/${kind}/page.tsx`));
check('No adult options in media pages, shared UI or builder', files.filter(file => (
  /^src\/app\/(image|video)\//.test(file.path) || file.path === 'src/components/shared/MediaPromptPage.tsx' || file.path === 'src/utils/mediaPromptBuilder.ts'
) && /nsfw|sexy|nude|erotic|sensual|hentai|\br-?18\b|セクシー|官能|性的|アダルト|エロ|ヌード/i.test(decoded(file.text))).map(file => file.path));
process.exitCode = failed ? 1 : 0;
