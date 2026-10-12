// Image → video prompt mode. Pure functions only: the browser reads the image locally,
// this file turns the readings into a copy-paste instruction prompt. Nothing is sent anywhere.

// Lengths per single generation, checked against vendor docs on 2026-10-13:
// Seedance: docs.byteplus.com/en/docs/byteplus_las/video_gen_enhanced
// Veo: ai.google.dev/gemini-api/docs/veo / Runway: docs.dev.runwayml.com/api-details/api_changelog/
// Hailuo・H3: platform.minimax.io/docs/api-reference/video-generation-i2v, /docs/guides/video-generation
// Kling (no readable official value) and Sora 2 (API removal announced for 2026-09-24) are left out.
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
export const I2V_MODELS = [
  { id: 'seedance-2.0', label: 'Seedance 2.0', durations: range(4, 15), hint: '被写体と動き → 背景 → カメラの動き → 光と質感 の順に、短い英文で書く。' },
  { id: 'seedance-2.5', label: 'Seedance 2.5', durations: range(4, 30), hint: '被写体と動き → 背景 → カメラの動き → 光と質感 の順に、短い英文で書く。' },
  { id: 'veo-3.1', label: 'Veo 3.1', durations: [4, 6, 8], hint: '添付画像は最初のフレームとして使われる。画像の再説明より、そこから何が起きるかを書く。1080p・4K で作る場合は 8 秒のみ。' },
  { id: 'runway-gen4.5', label: 'Runway Gen-4.5', durations: range(2, 10), hint: '画像に写っている物の再説明は短くし、カメラの動きと被写体の動きを中心に書く。' },
  { id: 'hailuo-2.3', label: 'Hailuo 2.3', durations: [6, 10], hint: '1080P で作る場合は 6 秒のみ。動きは1つに絞って具体的に書く。' },
  { id: 'minimax-h3', label: 'MiniMax H3', durations: range(4, 15), hint: '被写体の動き・カメラの動き・光の変化を、それぞれ1文ずつ書く。' },
] as const;
export type I2VModelId = (typeof I2V_MODELS)[number]['id'];
export const modelById = (id: string) => I2V_MODELS.find(m => m.id === id) ?? I2V_MODELS[0];
// The policy is "generate each cut long, cut it down in the editor"; cap the default at 15 s so a 30 s model doesn't default to 30.
export const defaultDuration = (id: string) => Math.max(...modelById(id).durations.filter(d => d <= 15));

// Layer and camera vocabulary are KONTE's own keys (konte/src/constants.ts), so the JSON can be imported
// into KONTE or reused by a later "draw it in JS" mode without renaming.
export const KONTE_LAYERS = [['sky', '空'], ['bg_far', '遠景'], ['bg_mid', '中景'], ['ground', '地面'], ['character', '人物'], ['protagonist', '主役'], ['prop', '小道具']] as const;
export const KONTE_TEXT_KINDS = [['subtitle', '字幕'], ['telop', 'テロップ'], ['sign', '看板・画面内の文字']] as const;
export const KONTE_CAMERA = { framing: ['wide', 'normal', 'tele'], height: ['low', 'eye', 'high', 'aerial'], movement: ['fixed', 'pan', 'tilt', 'zoom', 'dolly', 'handheld'] } as const;

// Shape the pasted-into AI must return. Field names follow docs/prompt-library/format-schema.json jsonTemplate.
export const IMAGE_READING_JSON = `{
  "version": 1,
  "subject": "主な被写体（英語）",
  "style": "写真・画風の特徴（英語。作家名・作品名は使わない）",
  "layout": "構図（英語）",
  "lighting": { "direction": "", "quality": "hard | soft", "color_temperature_k": 0, "time_of_day": "" },
  "camera": { "framing": "${KONTE_CAMERA.framing.join(' | ')}", "height": "${KONTE_CAMERA.height.join(' | ')}", "focal_length_mm_35": 0, "depth_of_field": "" },
  "atmosphere": "",
  "palette": [{ "hex": "#RRGGBB", "role": "主役 | 背景 | アクセント" }],
  "constraints": ["カットをまたいで変えてはいけない見た目（英語）"],
  "scenes": [{
    "scene_id": "S1",
    "summary": "",
    "layers": [{ "type": "${KONTE_LAYERS.map(([k]) => k).join(' | ')}", "label": "", "description": "", "bbox": [0, 0, 1, 1], "colors": ["#RRGGBB"], "material": "", "motion": "" }],
    "texts": [{ "kind": "${KONTE_TEXT_KINDS.map(([k]) => k).join(' | ')}", "content": "", "bbox": [0, 0, 1, 1] }],
    "cuts": [{ "cut": 1, "generate_sec": 0, "use_in_sec": 0, "use_out_sec": 0, "start_frame": "source_image | previous_cut_last_frame | text_only", "camera": { "framing": "", "height": "", "movement": "${KONTE_CAMERA.movement.join(' | ')}", "detail": "" }, "subject_motion": "", "prompt": "", "transition_to_next": "" }]
  }]
}`;

export interface ImageFacts {
  width: number;
  height: number;
  colors: string[];
  focalLength?: number;
  focal35?: number;
}
export interface I2VInput {
  model: string;
  generateSec: number;
  cuts: number;
  ratio: string; // 'auto' = follow the image
  intent: string;
  facts: ImageFacts | null;
}

const RATIOS = [[16, 9], [9, 16], [1, 1], [4, 3], [3, 4], [21, 9], [3, 2], [2, 3]] as const;
export function nearestRatio(width: number, height: number): string {
  const r = width / height;
  const [w, h] = RATIOS.reduce((best, c) => Math.abs(Math.log(c[0] / c[1] / r)) < Math.abs(Math.log(best[0] / best[1] / r)) ? c : best);
  return `${w}:${h}`;
}

// ponytail: fixed 3-bit-per-channel buckets, not k-means; good enough to name 5 main colours.
export function dominantColors(rgba: ArrayLike<number>, count = 5): string[] {
  const buckets = new Map<number, [number, number, number, number]>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const key = (rgba[i] >> 5) << 6 | (rgba[i + 1] >> 5) << 3 | rgba[i + 2] >> 5;
    const b = buckets.get(key) ?? [0, 0, 0, 0];
    b[0] += rgba[i]; b[1] += rgba[i + 1]; b[2] += rgba[i + 2]; b[3]++;
    buckets.set(key, b);
  }
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return [...buckets.values()].sort((a, b) => b[3] - a[3]).slice(0, count)
    .map(([r, g, b, n]) => `#${hex(r / n)}${hex(g / n)}${hex(b / n)}`.toUpperCase());
}

// Reads FocalLength (0x920A) and FocalLengthIn35mmFilm (0xA405) from a JPEG's EXIF block. Anything else → {}.
export function readExifFocal(buffer: ArrayBuffer): { focalLength?: number; focal35?: number } {
  const v = new DataView(buffer);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return {};
  let p = 2;
  while (p + 4 <= v.byteLength && v.getUint8(p) === 0xff) {
    const marker = v.getUint8(p + 1), size = v.getUint16(p + 2);
    if (marker === 0xe1 && p + 10 <= v.byteLength && v.getUint32(p + 4) === 0x45786966) return readTiff(v, p + 10, p + 2 + size);
    if (marker === 0xda) break;
    p += 2 + size;
  }
  return {};
}
function readTiff(v: DataView, t: number, end: number) {
  const out: { focalLength?: number; focal35?: number } = {};
  if (end > v.byteLength || t + 8 > end) return out;
  const le = v.getUint16(t) === 0x4949;
  const u16 = (o: number) => v.getUint16(o, le), u32 = (o: number) => v.getUint32(o, le);
  const entries = (ifd: number, visit: (tag: number, e: number) => void) => {
    if (ifd + 2 > end) return;
    const n = u16(ifd);
    for (let i = 0; i < n && ifd + 2 + i * 12 + 12 <= end; i++) visit(u16(ifd + 2 + i * 12), ifd + 2 + i * 12);
  };
  let exif = 0;
  entries(t + u32(t + 4), (tag, e) => { if (tag === 0x8769) exif = t + u32(e + 8); });
  if (exif) entries(exif, (tag, e) => {
    if (tag === 0x920a && t + u32(e + 8) + 8 <= end) {
      const at = t + u32(e + 8), den = u32(at + 4);
      if (den) out.focalLength = Math.round(u32(at) / den * 10) / 10;
    }
    if (tag === 0xa405) out.focal35 = u16(e + 8) || undefined;
  });
  return out;
}

export function buildImageToVideoInstruction(input: I2VInput): string {
  const model = modelById(input.model);
  const sec = model.durations.includes(input.generateSec as never) ? input.generateSec : defaultDuration(model.id);
  const pad = Math.min(sec >= 8 ? 1.5 : 1, sec / 4); // keep at least half the clip usable on 2–3 s models
  const f = input.facts;
  const ratio = input.ratio !== 'auto' ? input.ratio : f ? nearestRatio(f.width, f.height) : '添付画像に近い比率';
  const allowed = model.durations.length > 4 ? `${model.durations[0]}〜${model.durations.at(-1)}秒` : `${model.durations.join('・')}秒`;
  const focal = f?.focal35 ? `${f.focal35}mm（35mm判換算・撮影情報より）` : f?.focalLength ? `${f.focalLength}mm（実焦点距離・35mm判換算は不明）` : '撮影情報なし（画像から推定してください）';
  const facts = f ? [
    `- 縦横: ${f.width}×${f.height}px（近い比率 ${nearestRatio(f.width, f.height)}）`,
    `- 主要な色（多い順）: ${f.colors.join(' / ') || '取得できず'}`,
    `- 焦点距離: ${focal}`,
  ].join('\n') : '- 画像の情報は読み取っていません（画像から判断してください）';
  const intent = input.intent.trim() || '指定なし。画像から自然に起こせる動きを、無理のない範囲で提案してください。';
  return `あなたは映像監督と撮影監督を兼ねる担当者です。添付した画像1枚を読み解き、動画生成AI「${model.label}」で使う動画用プロンプトを、カットごとに書き起こしてください。

## 制作の前提
- 1カットずつ長めに生成し、動画編集アプリで良い区間だけを切り出して結合します。
- 各カットの生成の長さ: ${sec}秒（${model.label} が1回で生成できる長さは ${allowed}）
- 編集で使う区間は生成の長さより短くし、前後に余白を残してください（目安: 頭と尻にそれぞれ${pad}秒以上）。動き出しと止まり際は不安定になりやすいため使いません。
- カット数: ${input.cuts}
- 画面比率: ${ratio}（${model.label} が対応していない比率の場合は、最も近い対応比率にしてください）
- 1カット目は添付画像を開始フレームにします（画像から動画を作る使い方）。2カット目以降は、前のカットの最後のフレーム（編集アプリで静止画として書き出して使う）から始めるか、文章だけで作るかを、カットごとに選んで書いてください。迷う場合は文章だけで作る方にしてください。

## ブラウザで読み取った画像の情報（参考値）
${facts}
画像を見た結果と食い違う場合は、画像を優先してください。

## 作りたい動画
${intent}

## 出力してほしいもの（この順で）

### 1. 画像の読み取り（日本語・箇条書き）
- 被写体: 何が・どこに・どんな状態で写っているか
- 光: 向き・硬さ（硬い/柔らかい）・色温度の目安・時間帯
- レンズと画角: 推定焦点距離（35mm判換算）・被写界深度・カメラの高さ
- 構図: 主役の位置・視線の流れ・余白
- 色: 主要な色と、それぞれの役割（主役/背景/アクセント）

### 2. レイヤーとシーンの構造（JSON）
次の形のJSONを、コードブロック1つで出してください。scenes は1つ、その中の cuts はちょうど${input.cuts}件にします。
- layers の type は次から選びます: ${KONTE_LAYERS.map(([k, ja]) => `${k}（${ja}）`).join('、')}。主役は protagonist、それ以外の人物は character。画像に無いレイヤーは出しません。
- 画面内の文字は texts に入れます（kind: ${KONTE_TEXT_KINDS.map(([k, ja]) => `${k}=${ja}`).join('、')}）。読めない文字は content を「判読不可」にします。
- bbox は [左, 上, 幅, 高さ] を画面に対する割合（0〜1）で書きます。
- camera の値は framing: ${KONTE_CAMERA.framing.join('/')}、height: ${KONTE_CAMERA.height.join('/')}、movement: ${KONTE_CAMERA.movement.join('/')} から選びます。
- cuts の generate_sec は ${sec}、use_in_sec と use_out_sec は生成した動画の中の秒数です。
\`\`\`json
${IMAGE_READING_JSON}
\`\`\`

### 3. カットごとの動画用プロンプト
カットごとに次を書いてください。
- カット番号と狙い（日本語1行）
- 生成する長さ: ${sec}秒
- 編集で使う区間: 生成した動画の◯秒〜◯秒（使う長さ◯秒）
- 開始フレーム: 添付画像／前のカットの最後のフレーム／文章のみ
- カメラワーク: 区分（例: normal・eye・dolly）と、具体的な動き（方向・速さ・始まりと終わりの位置）
- 被写体の動き: 何がどう動くか（1カットにつき1〜2つまで）
- ${model.label} に貼るプロンプト（英語・コードブロック・JSONの prompt と同じ文）
  書き方: ${model.hint}

出力が途中で切れた場合は、こちらが「続き」と送ったら、切れたところから続けてください。

### 4. 編集用のカット表
表で出してください: カット順｜使う区間（生成動画の中の秒）｜使う長さ｜次のカットへのつなぎ方（そのまま切り替える／ディゾルブ＝重ねながら切り替える／動きでつなぐ 等）｜つなぎの狙い
最後に、仕上がりの合計の長さを書いてください。

## 守ること
- 画像に写っていないことを事実のように書かない（人物の素性・場所の特定・ブランド名など）。推測は「推定」と書く。
- 画風は実在の作家名・作品名・スタジオ名で指定せず、特徴の言葉で書く。
- 人物の見た目・服装・光の向き・色は、カットをまたいで変えない。
- 各カットのプロンプトは、そのカットだけで意味が通るように書く（前のカットを参照する言い方をしない）。`;
}
