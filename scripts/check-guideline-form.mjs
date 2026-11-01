#!/usr/bin/env node
// Self-check + side-by-side metrics for the guideline form. Usage: node --no-warnings --import ./scripts/ts-resolve.mjs scripts/check-guideline-form.mjs [--table]
// Metrics are structural only (no LLM is called): whether the output states a trigger, a priority rule, a boundary, a conflict rule.
import assert from 'node:assert/strict';
import { buildPrompts, buildGuidelinePrompt } from '../src/utils/promptBuilder.ts';

const base = { securityLevel: 'level1', markdownLevel: 'md1', targetAI: 'none' };
// DIA-side counterparts of the demo's 5 scenarios.
const cases = [
  ['1 警告が要る(機密)', { ...base, artifactType: 'コード修正依頼', securityLevel: 'level3', description: '顧客の山田さん(090-1234567)のDB移行スクリプトを直して' }],
  ['2 具体的な条件', { ...base, artifactType: 'SNS投稿', description: '20代向けにカフェの新作ドリンクを140字以内で告知' }],
  ['3 入力しだいで動作が変わる', { ...base, artifactType: '企画書', description: '新規事業の企画書。予算は未定' }],
  ['4 範囲の維持', { ...base, artifactType: '要約', markdownLevel: 'md3', description: 'この議事録を要約して。ついでに法律上問題ないかも教えて' }],
  ['5 矛盾する条件', { ...base, artifactType: '文章作成', description: '短く、でも詳しく書いて。丁寧に、でもカジュアルに' }],
];
const ruleCount = (t) => (t.match(/^G\d+　条件：/gm) ?? []).length;
const has = (t, re) => re.test(t);
const rows = [];
for (const [name, input] of cases) {
  const g = buildGuidelinePrompt(input);
  assert.equal(g, buildGuidelinePrompt(input), 'deterministic');
  assert.equal(ruleCount(g), 5 + (input.securityLevel !== 'level1' ? 1 : 0) + (input.markdownLevel !== 'md1' ? 1 : 0));
  assert.match(g, /^G1　条件：常に/m);
  assert.match(g, /番号の小さい方を優先/);
  assert.match(g, /範囲外/);
  assert.match(g, /矛盾している時/);
  const p = buildPrompts(input);
  for (const [label, t] of [['standard', p.standard], ['concise', p.concise], ['precise', p.precise], ['guideline', g]]) {
    rows.push({ case: name, form: label, chars: t.length, triggers: ruleCount(t), priority: has(t, /優先/), boundary: has(t, /範囲外/), conflictRule: has(t, /矛盾/) });
  }
}
// Conditional rules appear only when their input is set: level1/md1 has none of G4/G5; level3+md3 has both.
assert.doesNotMatch(buildGuidelinePrompt(cases[1][1]), /固有名詞/);
assert.match(buildGuidelinePrompt(cases[0][1]), /固有名詞/);
assert.match(buildGuidelinePrompt(cases[3][1]), /プレーンテキスト/);
// Masking still applies in the guideline form (same sanitizer as the other three).
assert.doesNotMatch(buildGuidelinePrompt(cases[0][1]), /1234567/);
// modifier directive is placed first.
assert.match(buildGuidelinePrompt(cases[1][1], 'shorter'), /^【修正指示】/);
console.log('PASS check-guideline-form');
if (process.argv.includes('--table')) console.table(rows);
