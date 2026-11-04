#!/usr/bin/env node
// Self-check + side-by-side metrics for the guideline form. Usage: node --no-warnings --import ./scripts/ts-resolve.mjs scripts/check-guideline-form.mjs [--table]
// Metrics are structural only (no LLM is called): whether the output states a trigger, a priority rule, a boundary, a conflict rule.
import assert from 'node:assert/strict';
import { buildPrompts, buildGuidelinePrompt } from '../src/utils/promptBuilder.ts';
import { expandIntent } from '../src/utils/intentExpander.ts';

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
  assert.match(g, /^G\d　条件：常に/m);
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
// Security rule outranks type defaults: with 要約 (which says keep numbers/names exact) + level3 it must be G1.
assert.match(buildGuidelinePrompt({ ...base, artifactType: '要約', securityLevel: 'level3', description: '田中さんの売上500万円の報告を要約' }), /G1　条件：回答に固有名詞.*日付/);
assert.match(buildGuidelinePrompt({ ...base, artifactType: '要約', securityLevel: 'level2', description: 'x' }), /G1　条件：回答に固有名詞・組織名・個人名・具体的な数値が出てくる時/);
// modifier directive is placed first.
assert.match(buildGuidelinePrompt(cases[1][1], 'shorter'), /^【修正指示】/);
// level3: 意図の抽出（対象・トーン等）からマスク済みの値が戻らない（ASTRA r1 guideline-mask-bypass）。既存 3 案も同じ口を通る。
{
  const leak = { ...base, artifactType: '文章作成', securityLevel: 'level3', description: '対象:alice@example.com 向けに案内を書く。https://example.com/x と 09012345678 も' };
  const all = [buildGuidelinePrompt(leak), ...Object.values(buildPrompts(leak))];
  for (const p of all) assert.doesNotMatch(p, /alice@example\.com|https:\/\/example\.com|09012345678/);
  assert.match(all[0], /\[メールアドレス\]/);
  // 切り出しで URL の形が崩れる例（ASTRA r2 guideline-mask-truncation）と、呼び出し側が未加工の入力から事前計算した意図を渡す例（HomeClient の形）
  const cut = { ...leak, description: 'https://x.test/secret-token42向けに案内を書く' };
  const rawIntent = expandIntent(cut.artifactType, cut.description);
  assert.match(rawIntent.targetAudience.join(), /secret-token42/); // 前提：未加工から抽出すると漏れる形であること
  for (const p of [buildGuidelinePrompt(cut), buildGuidelinePrompt(cut, null, rawIntent), ...Object.values(buildPrompts(cut)), ...Object.values(buildPrompts(cut, null, rawIntent))]) {
    assert.doesNotMatch(p, /secret-token42|x\.test/);
  }
}
console.log('PASS check-guideline-form');
if (process.argv.includes('--table')) console.table(rows);
