#!/usr/bin/env node
/**
 * /api/media-prompt のガードを実測で確認する最小テスト。
 *
 *   node scripts/verify-media-prompt-guard.mjs     （事前に `npm run build` が必要）
 *
 * 確認するのは3点：
 *   ① DIA_MEDIA_PROMPT_ENABLED 未設定 → 503 / code E503（既定オフのフェイルクローズ）
 *   ② Origin が自サイト以外            → 403 / code E403
 *   ③ 同一IPから21回目                 → 429 / code E429
 *
 * Gemini 本体は呼ばない：②③のフェーズは DIA_MEDIA_PROMPT_ENABLED=1 かつ
 * APIキーを子プロセスの環境から明示的に外して起動するため、通過しても 500(E500) で止まる。
 */
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 3987;
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN = 'https://dia-wheat.vercel.app';
const IP = '203.0.113.9';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
}

function post({ origin, ip = IP } = {}) {
  const args = ['-s', '-o', '-', '-w', '\n%{http_code}', '-X', 'POST', `${BASE}/api/media-prompt`,
    '-H', 'Content-Type: application/json',
    '-H', `X-Forwarded-For: ${ip}`];
  if (origin) args.push('-H', `Origin: ${origin}`);
  args.push('--data', JSON.stringify({ type: 'image', tool: 'midjourney', params: { subject: 'test' } }));
  const out = execFileSync('curl', args, { encoding: 'utf8' });
  const idx = out.lastIndexOf('\n');
  const bodyText = out.slice(0, idx);
  let body = {};
  try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }
  return { status: Number(out.slice(idx + 1)), body };
}

async function startServer(extraEnv) {
  const env = { ...process.env, PORT: String(PORT), ...extraEnv };
  // 実際に Gemini を叩かないよう、キーは子プロセスの環境から必ず外す
  delete env.GEMINI_API_KEY;
  delete env.GOOGLE_API_KEY;
  for (const k of Object.keys(extraEnv)) if (extraEnv[k] === undefined) delete env[k];

  // npx 経由だとラッパーを kill しても孫プロセスがポートを掴んだまま残るため、
  // next の bin を node で直接起動し、プロセスグループごと落とす。
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env,
    detached: true,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  try {
    execFileSync('curl', ['-s', '-o', '/dev/null', '-f', '--retry', '40', '--retry-delay', '1',
      '--retry-connrefused', '--max-time', '10', `${BASE}/`], { encoding: 'utf8' });
  } catch {
    await stopServer(child);
    throw new Error('next start がポート ' + PORT + ' で起動しませんでした');
  }
  return child;
}

async function stopServer(child) {
  try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
  await new Promise(r => setTimeout(r, 1500));
}

async function main() {
  // ── フェーズA：既定オフ（DIA_MEDIA_PROMPT_ENABLED 未設定）
  let child = await startServer({ DIA_MEDIA_PROMPT_ENABLED: undefined });
  try {
    const r = post({ origin: ORIGIN });
    check('① env未設定 → 503 E503', r.status === 503 && r.body.code === 'E503',
      `status=${r.status} code=${r.body.code}`);
  } finally {
    await stopServer(child);
  }

  // ── フェーズB：有効化（ただしAPIキーなし）
  child = await startServer({ DIA_MEDIA_PROMPT_ENABLED: '1' });
  try {
    const bad = post({ origin: 'https://evil.example' });
    check('② Origin不一致 → 403 E403', bad.status === 403 && bad.body.code === 'E403',
      `status=${bad.status} code=${bad.body.code}`);

    const none = post({});
    check('②b Origin/Referer なし → 403 E403', none.status === 403 && none.body.code === 'E403',
      `status=${none.status} code=${none.body.code}`);

    let last = null;
    for (let i = 1; i <= 20; i++) last = post({ origin: ORIGIN });
    check('③a 20回目まではレート制限を通過（APIキー無しで500 E500に到達）',
      last.status === 500 && last.body.code === 'E500',
      `20回目: status=${last.status} code=${last.body.code}`);

    const over = post({ origin: ORIGIN });
    check('③b 21回目 → 429 E429', over.status === 429 && over.body.code === 'E429',
      `status=${over.status} code=${over.body.code}`);

    const otherIp = post({ origin: ORIGIN, ip: '198.51.100.4' });
    check('③c 別IPは影響を受けない', otherIp.status === 500 && otherIp.body.code === 'E500',
      `status=${otherIp.status} code=${otherIp.body.code}`);
  } finally {
    await stopServer(child);
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
