/**
 * intentExpander.ts (v3)
 *
 * v2 からの変更:
 * - すべての RegExp をモジュールレベル定数として1回だけコンパイル
 * - extractPrimaryGoal: 18回の RegExp 生成 → indexOf ベースの O(n) スキャン
 * - extractTargetAudience: mukeRe → indexOf ベースの O(n) スキャン
 * - extractConstraints: prohibitRe → indexOf ベースのサフィックススキャン
 * - isLikelyAudience: 末尾判定を Set ルックアップに変換
 * - detectAmbiguities / inferAssumptions: regex alternation → includesAny ヘルパー
 * - 全操作が O(n) 以下。カタストロフィックバックトラッキングなし。
 */

import type { ArtifactType } from '../types';

// ============================================================
// 公開型定義
// ============================================================

export interface ExpandedIntent {
  /** 何をしたいか（1文） */
  primaryGoal: string;
  /** 誰向けか */
  targetAudience: string[];
  /** どんな雰囲気・審美的トーンか */
  tone: string[];
  /** 重要な制約・条件 */
  keyConstraints: string[];
  /** 重視したい機能的品質 */
  desiredQualities: string[];
  /** 期待する成果物の特性（対象・トーンから導出） */
  outputExpectation: string[];
  /** 不明・曖昧な点（AIへの具体的な指示として機能する） */
  ambiguityNotes: string[];
  /** タイプ別の妥当な補完仮定（最大3項目） */
  inferredAssumptions: string[];
  /** AIが検討すべき観点（入力が短い・曖昧な場合の補助ヒント） */
  contextAmplifiers: string[];
  /** 成果物タイプごとの推奨出力構成 */
  outputBlueprint: string[];
}

// ============================================================
// ヘルパー関数
// ============================================================

/** 複数キーワードのいずれかが text に含まれるか（大文字小文字区別あり） */
function includesAny(text: string, words: readonly string[]): boolean {
  for (const w of words) {
    if (text.includes(w)) return true;
  }
  return false;
}

/**
 * 複数キーワードのいずれかが text に含まれるか（大文字小文字区別なし）
 * textLC は呼び出し側で text.toLowerCase() を渡す（重複 toLowerCase を避けるため）
 */
function includesAnyLC(textLC: string, lowerWords: readonly string[]): boolean {
  for (const w of lowerWords) {
    if (textLC.includes(w)) return true;
  }
  return false;
}

// ============================================================
// モジュールレベル定数（正規表現は1回だけコンパイル）
// ============================================================

// ── targetAudience ──
// 「ターゲット / 対象(者|ユーザー|読者)? [接続詞] 〜」
const TARGET_RE = /(?:ターゲット|対象(?:者|ユーザー|読者)?)[はがを：: ]{0,4}([^\s、。\n]{2,20})/g;

// 年代（20代, 30〜40代 など）— \d+ は全数字マッチで安全、バックトラックなし
const AGE_RE = /(\d+代(?:[〜～]\d+代)?)/g;

// ── keyConstraints ──
// 字数・行数制限: \d+ + 単位リテラル — バックトラックなし
const CHAR_LIMIT_RE = /(\d+(?:字|文字|行)(?:以内|程度|まで))/g;

// ── isLikelyAudience: 助詞終端チェック ──
// Set ルックアップで O(1)、正規表現不要
const PARTICLE_ENDINGS = new Set(['て', 'に', 'は', 'を', 'が', 'の', 'も', 'へ', 'で']);

// ── 向け スキャン用: 文境界文字 ──
const MUKE_BOUNDARY = new Set([
  ' ', '\t', '　', '、', '。', '\n', '！', '!', '？', '?', '・', '「', '」', '（', '）', '(', ')',
]);
// 「向けて」「向かって」「向けっ」など否定先読み対象
const MUKE_SKIP_NEXT = new Set(['て', 'か', 'っ']);

// ── prohibitSuffix スキャン用: 文境界文字 ──
const PROHIBIT_BOUNDARY = new Set([' ', '\t', '　', '、', '。', '\n', '！', '!', '？', '?']);
const PROHIBIT_SUFFIXES = ['禁止', 'なし', '不使用', '厳守'] as const;

// ── extractPrimaryGoal: 文境界文字 ──
const GOAL_BOUNDARY = new Set(['。', '\n']);

// ── inferAssumptions / detectAmbiguities: キーワードリスト ──
// すべて小文字で格納（includesAnyLC 用）
const SNS_PLATFORMS_LC = ['twitter', 'x', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'];
const CODE_LANGS_LC = ['python', 'javascript', 'typescript', 'go', 'rust', 'java', 'c#', 'php', 'ruby', 'swift'];

// リサーチ依頼: 「過去\d+年?」のみ正規表現が必要な箇所（シンプルで安全）
const PAST_DURATION_RE = /過去\d+年?/;

// ============================================================
// targetAudience 抽出
// ============================================================

const AUDIENCE_KEYWORDS = [
  '初心者', '上級者', '経営者', '経営層', '役員', 'マネージャー',
  'エンジニア', '開発者', 'デザイナー', '学生', '主婦', 'ビジネスパーソン',
  '消費者', '顧客', 'クライアント', 'シニア', '若者', '高齢者', '社会人',
  '新入社員', '管理職', 'マーケター', 'フリーランス', '起業家',
  '一般ユーザー', 'ユーザー', '専門家', '非エンジニア', '読者',
] as const;

const EXCLUDED_AUDIENCE = new Set(['全て', 'すべて', 'それ', 'これ']);

/**
 * 「〜向け」で取得した文字列が audience らしいか判定する。
 * 助詞・汎用語を除外してノイズを減らす。
 * Set ルックアップで O(1)、正規表現なし。
 */
function isLikelyAudience(text: string): boolean {
  if (text.length < 2) return false;
  if (PARTICLE_ENDINGS.has(text[text.length - 1])) return false;
  if (EXCLUDED_AUDIENCE.has(text)) return false;
  return true;
}

/**
 * 「〜向け」パターンを indexOf ベースでスキャンする。
 * 計算量: O(n)、バックトラッキングなし。
 *
 * 元の mukeRe = /([^\s、。\n]{2,14})向け(?![てかっ])/g の完全な置き換え。
 */
function scanMuke(text: string, out: Set<string>): void {
  let pos = 0;
  while (pos < text.length) {
    const idx = text.indexOf('向け', pos);
    if (idx < 0) break;
    pos = idx + 2; // 次の検索開始位置を先に進める

    // 否定先読み: 「向けて」「向かって」「向けっ」を除外
    const nextCh = text[idx + 2];
    if (nextCh !== undefined && MUKE_SKIP_NEXT.has(nextCh)) continue;

    // 「向け」の直前から最大14文字を逆方向スキャン（境界文字で停止）
    let start = idx;
    while (start > 0 && idx - start < 14 && !MUKE_BOUNDARY.has(text[start - 1])) {
      start--;
    }
    const len = idx - start;
    if (len >= 2) {
      const v = text.slice(start, idx);
      if (isLikelyAudience(v)) out.add(v);
    }
  }
}

/**
 * テキストから対象読者・ユーザー層を抽出する。
 * 全操作 O(n)、正規表現バックトラッキングなし。
 */
export function extractTargetAudience(text: string): string[] {
  const raw = new Set<string>();

  // 「〜向け」: indexOf ベーススキャン
  scanMuke(text, raw);

  // 「ターゲット / 対象...」: 先頭リテラルで位置固定、境界付きキャプチャ
  TARGET_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TARGET_RE.exec(text)) !== null) {
    const captured = m[1];
    if (typeof captured !== 'string') continue;
    const v = captured.trim();
    if (v && isLikelyAudience(v)) raw.add(v);
  }

  // 年代（20代, 30〜40代 など）
  AGE_RE.lastIndex = 0;
  while ((m = AGE_RE.exec(text)) !== null) {
    raw.add(m[1]);
  }

  // 既知キーワードの直接マッチ: includes は O(n)
  for (const kw of AUDIENCE_KEYWORDS) {
    if (text.includes(kw)) raw.add(kw);
  }

  // サブサム重複除去: 他の要素の部分文字列になっているものを除く
  const all = Array.from(raw);
  return all.filter(
    (item) => !all.some((other) => other !== item && other.includes(item))
  );
}

// ============================================================
// tone: 感情的・審美的雰囲気のみ
// ============================================================

const TONE_KEYWORDS = [
  '落ち着いた', '高級感', '高級な', '親しみやすい', '洗練された',
  'シンプル', 'カジュアル', 'フォーマル', 'モダン', 'クール', 'ポップ',
  'ミニマル', '温かみ', '温かい', '柔らかい', '明るい', 'フレンドリー',
  '真剣', '個性的', 'スタイリッシュ', 'ナチュラル', 'ラグジュアリー',
  'エレガント', 'クラシック', 'ビンテージ', 'チェーン店っぽくない',
] as const;

/** テキストから審美的・感情的トーンを抽出する。includes のみ、O(n×k)。 */
export function extractTone(text: string): string[] {
  return TONE_KEYWORDS.filter((kw) => text.includes(kw));
}

// ============================================================
// keyConstraints 抽出
// ============================================================

const CONSTRAINT_KEYWORDS = [
  '短く', '簡潔に', '具体的に', '箇条書き', '英語で', '日本語のみ',
  '番号付き', 'サンプルなし', 'コードなし', '一枚で',
] as const;

/**
 * 「〜禁止」「〜なし」「〜不使用」「〜厳守」パターンを indexOf ベースでスキャン。
 * 計算量: O(n × suffix数)、バックトラッキングなし。
 *
 * 元の prohibitRe = /([^\s、。\n]{1,10}(?:禁止|なし|不使用|厳守))/g の置き換え。
 */
function scanProhibitSuffixes(text: string, out: Set<string>): void {
  for (const suffix of PROHIBIT_SUFFIXES) {
    let pos = 0;
    while (pos < text.length) {
      const idx = text.indexOf(suffix, pos);
      if (idx < 0) break;
      pos = idx + suffix.length;

      // サフィックスの直前から最大10文字を逆方向スキャン
      let start = idx;
      while (start > 0 && idx - start < 10 && !PROHIBIT_BOUNDARY.has(text[start - 1])) {
        start--;
      }
      if (idx > start) {
        out.add(text.slice(start, idx + suffix.length));
      }
    }
  }
}

/**
 * テキストから制約・条件表現を抽出する。
 * 全操作 O(n)、正規表現バックトラッキングなし。
 */
export function extractConstraints(text: string): string[] {
  const results = new Set<string>();

  // 字数・行数制限: \d+ は数字のみマッチ、バックトラックなし
  CHAR_LIMIT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CHAR_LIMIT_RE.exec(text)) !== null) {
    results.add(m[1]);
  }

  // 「〜禁止」「〜なし」等: indexOf スキャン
  scanProhibitSuffixes(text, results);

  // 既知の制約キーワード
  for (const kw of CONSTRAINT_KEYWORDS) {
    if (text.includes(kw)) results.add(kw);
  }

  return Array.from(results);
}

// ============================================================
// desiredQualities: 機能的品質
// ============================================================

const QUALITY_KEYWORDS = [
  '論理的', '分かりやすい', 'わかりやすい', '実務的', '丁寧', 'プロフェッショナル',
  '読みやすい', '読みやすさ', '説得力', '信頼性', '独自性', '共感',
  '使いやすい', '実用的', '正確', '創造的', 'オリジナル', '革新的', '網羅的',
  '簡潔', '具体的',
] as const;

/** テキストから機能的品質への期待を抽出する。includes のみ、O(n×k)。 */
export function extractDesiredQualities(text: string): string[] {
  return QUALITY_KEYWORDS.filter((kw) => text.includes(kw));
}

// ============================================================
// primaryGoal 抽出
// ============================================================

const GOAL_ENDINGS = [
  'したい', '作りたい', '考えたい', '整理したい', '改善したい',
  '提案したい', '作成したい', '執筆したい', '分析したい', '調べたい',
  'まとめたい', '生成したい', '開発したい', '設計したい', '確認したい',
  '修正したい', '変更したい', '理解したい',
];

/**
 * テキストから主要な目標（やりたいこと）を1文で抽出する。
 *
 * v2 との差分:
 * - new RegExp() を18回ループ内で生成していた処理を indexOf スキャンに置き換え
 * - .{5,50}? による潜在的な O(n×50×18) の試行を除去
 * - 計算量: O(n × ending数)、正規表現なし
 */
export function extractPrimaryGoal(text: string): string {
  for (const ending of GOAL_ENDINGS) {
    const idx = text.indexOf(ending);
    if (idx < 0) continue;

    // ending の直前に少なくとも5文字必要
    if (idx < 5) continue;

    // 最大50文字を逆方向スキャンして文境界（。\n）を探す
    const lookbackStart = Math.max(0, idx - 50);
    let start = lookbackStart;
    for (let j = idx - 1; j >= lookbackStart; j--) {
      if (GOAL_BOUNDARY.has(text[j])) {
        start = j + 1; // 境界文字の直後から
        break;
      }
    }

    const len = idx - start;
    if (len < 5) continue; // prefix が短すぎる

    const extracted = text.slice(start, idx + ending.length).trim();
    if (extracted.length >= 5) return extracted;
  }

  // フォールバック: 最初の文を返す（indexOf で O(n)）
  let firstEnd = text.length;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '。' || text[i] === '\n') {
      firstEnd = i;
      break;
    }
  }
  const first = text.slice(0, firstEnd).trim();
  return first.slice(0, 60) || text.slice(0, 60);
}

// ============================================================
// inferAssumptions
// ============================================================

/**
 * 成果物タイプとテキスト内容から妥当な補完仮定を生成する。
 * regex alternation を includesAny / includesAnyLC に置き換え。
 */
export function inferAssumptions(outputType: ArtifactType, text: string): string[] {
  const items: string[] = [];
  const textLC = text.toLowerCase(); // toLowerCase は1回だけ

  switch (outputType) {
    case '文章作成':
      items.push('読みやすさと文体の一貫性を重視する');
      break;

    case '要約':
      items.push('元の数値・固有名詞を正確に保持することを優先する');
      break;

    case 'アイデア出し':
      items.push('即実行可能なものと挑戦的なものをバランスよく含める');
      break;

    case '企画書':
      items.push('意思決定者が承認・却下を判断しやすい構成を前提とする');
      if (!includesAny(text, ['予算', '費用', 'コスト'])) {
        items.push('費用・予算感は「別途検討」として扱う');
      }
      break;

    case 'SNS投稿':
      items.push('エンゲージメント最大化（拡散・いいね）を主要目的として最適化する');
      if (!includesAnyLC(textLC, SNS_PLATFORMS_LC)) {
        items.push('プラットフォーム未指定のため汎用的な文体・文字数で複数案を提示する');
      }
      break;

    case 'コード生成':
      items.push('保守性・可読性・エラーハンドリングを実装基準とする');
      if (!includesAnyLC(textLC, CODE_LANGS_LC)) {
        items.push('言語未指定のため最も一般的な選択肢を採用し冒頭で明示する');
      }
      break;

    case 'コード修正依頼':
      items.push('後方互換性を維持した修正を優先する');
      items.push('修正箇所の意図と影響範囲を説明に含める');
      break;

    case 'デザイン指示':
      items.push('ターゲット層に合ったビジュアル言語・配色を優先する');
      items.push('アクセシビリティ（コントラスト比 WCAG 4.5:1 以上）への配慮を含める');
      break;

    case '画像生成指示':
      items.push('日本語・英語の両プロンプトを提示する');
      break;

    case 'リサーチ依頼':
      items.push('確認済み情報と推測・未確認情報を明確に区別する');
      items.push('単一情報源への依存を避け、複数の視点から検証する');
      break;
  }

  return items;
}

// ============================================================
// detectAmbiguities
// ============================================================

interface AmbiguityCheck {
  condition: (text: string, textLC: string) => boolean;
  note: string;
}

// すべての条件を includesAny / includesAnyLC で記述
// regex alternation を完全に排除
const AMBIGUITY_CHECKS: Partial<Record<ArtifactType, AmbiguityCheck[]>> = {
  '企画書': [
    {
      condition: (t) => !includesAny(t, ['KPI', '目標', '指標', '数値', '成果', '達成']),
      note: 'KPI・目標値が未設定です。妥当な指標（例：新規顧客数・売上増減率・完了件数など）を仮置きして提示してください',
    },
    {
      condition: (t) => !includesAny(t, ['期間', 'スケジュール', 'いつまで', 'フェーズ', 'ロードマップ', '納期']),
      note: '実施期間・マイルストーンが未設定です。一般的なフェーズ分け（例：Phase1: 1〜3か月 / Phase2: 4〜6か月）で補完してください',
    },
    {
      condition: (t) => !includesAny(t, ['承認', '決裁', '経営', '役員', '部長', 'マネージャー', '上司', '意思決定']),
      note: '意思決定者・承認者の立場が不明です。一般的なビジネス文脈（中間管理職〜役員が読者）を前提として構成してください',
    },
  ],

  'コード生成': [
    {
      condition: (_, tl) => !includesAnyLC(tl, CODE_LANGS_LC),
      note: '使用言語・フレームワークが指定されていません。最も一般的な選択肢を採用し、冒頭でその理由を明示してください',
    },
    {
      condition: (_, tl) => !includesAnyLC(tl, ['テスト', 'test', 'spec']),
      note: 'テストコードの要否が不明です。必要な場合は主要な正常系・異常系のサンプルを末尾に追加してください',
    },
  ],

  'コード修正依頼': [
    {
      condition: (_, tl) => !includesAnyLC(tl, CODE_LANGS_LC),
      note: '対象言語・フレームワークが指定されていません。コードから推測して冒頭で明示してください',
    },
    {
      condition: (_, tl) => !includesAnyLC(tl, ['バグ', 'エラー', 'error', 'パフォーマンス', '遅い', '可読性', '読みにくい', 'セキュリティ', '脆弱', '最適化', '修正目的']),
      note: '修正の主目的が不明です。バグ修正・パフォーマンス改善・可読性向上・セキュリティ対策のうち最も可能性が高いものを選び、冒頭で明示してください',
    },
  ],

  'SNS投稿': [
    {
      condition: (t, tl) => !includesAnyLC(tl, SNS_PLATFORMS_LC) && !includesAny(t, ['プラットフォーム', '媒体']),
      note: '投稿プラットフォームが指定されていません（X・Instagram・LinkedIn など）。複数媒体向けに文字数・トーンを変えて提案してください',
    },
  ],

  'デザイン指示': [
    {
      condition: (t) => !includesAny(t, ['Web', 'サイト', 'アプリ', '印刷', 'バナー', 'ロゴ', 'パッケージ', 'ポスター', '名刺', '媒体', '用途']),
      note: 'デザインの用途・媒体が不明です（例：Webサイト・アプリ画面・印刷物・ロゴなど）。Webデザインを前提として進め、媒体を冒頭で明示してください',
    },
    {
      condition: (t) => !includesAny(t, ['NG', '避け', '使わない', '禁止', '嫌い', 'やめて', 'しない']),
      note: 'NGデザイン・避けたい方向性が未指定です。ターゲット層と目的から一般的に不適切な方向性を仮定し、NGとして明示してください',
    },
  ],

  '画像生成指示': [
    {
      condition: (t) => !includesAny(t, ['構図', 'アングル', '視点', '俯瞰', 'クローズアップ', '全身', '上半身', 'バストアップ']),
      note: '構図・カメラアングルが不明です。最も一般的な構図（例：正面・バストアップ・三分割構図など）を仮定して指定してください',
    },
    {
      condition: (t) => !includesAny(t, ['スタイル', 'テイスト', '写真', 'フォト', 'イラスト', 'アート', '絵画', '3D', 'アニメ']),
      note: 'アートスタイルが不明です（例：写真調・イラスト・水彩・3D・アニメ調など）。目的に合う一般的なスタイルを採用して明示してください',
    },
  ],

  'リサーチ依頼': [
    {
      condition: (t) => !includesAny(t, ['比較', 'vs', '対', '競合', '他社', '選択肢', '候補']),
      note: '比較・調査の対象範囲が不明です（例：競合3社・特定市場・複数手法の比較など）。最も関連性の高い比較軸を設定して進めてください',
    },
    {
      // 「期間」「〜年」「最新」「直近」のいずれか、または「過去X年」パターン
      condition: (t) => !includesAny(t, ['期間', '〜年', '最新', '直近']) && !PAST_DURATION_RE.test(t),
      note: '調査対象の時間軸が未指定です。最新情報を優先しつつ、必要に応じて直近3〜5年の傾向も含めてください',
    },
    {
      condition: (t) => !includesAny(t, ['目的', '用途', '活用', '使用', 'なぜ', 'ため', 'に向け', '意思決定', '共有', '検討']),
      note: '調査結果の活用用途が不明です（意思決定資料・社内共有・提案書など用途によって深さが変わります）。汎用的な情報整理として進めてください',
    },
  ],
};

/**
 * 成果物タイプとテキスト内容から不明点・曖昧な点を検出する。
 * textLC を1回だけ計算して各 condition に渡す。
 */
export function detectAmbiguities(outputType: ArtifactType, text: string): string[] {
  const checks = AMBIGUITY_CHECKS[outputType] ?? [];
  if (checks.length === 0) return [];
  const textLC = text.toLowerCase(); // 1回だけ
  return checks
    .filter((c) => c.condition(text, textLC))
    .map((c) => c.note);
}

// ============================================================
// contextAmplifiers / outputBlueprint（変更なし）
// ============================================================

const CONTEXT_AMPLIFIERS: Record<ArtifactType, string[]> = {
  '文章作成': [
    '読者の想定と知識レベル',
    '伝えたい核心メッセージ',
    '感情的なフック・引き込み',
    '根拠・具体例の質',
    '締めのメッセージと行動促進',
  ],
  '要約': [
    '要点の優先順位づけ',
    '保持すべき数値・固有名詞',
    '省略可能な詳細の判断基準',
    '対象読者の前提知識レベル',
  ],
  'アイデア出し': [
    '実現可能性の幅（即実行〜長期）',
    '類似事例・参考になる先行事例',
    '想定される障壁と解決策',
    '斬新さ・差別化のレベル感',
    'ターゲットへの刺さり方',
  ],
  '企画書': [
    '背景・現状の課題整理',
    '提案内容の具体化と優先順位',
    'KPI・成功指標の設定',
    'リスクと対策の想定',
    '実行可能性・リソース確認',
    '意思決定者が気にするポイント',
  ],
  'SNS投稿': [
    'フック（最初の一文で止める工夫）',
    '訴求ポイントの選択と絞り込み',
    'ハッシュタグ戦略（一般タグ＋ニッチタグ）',
    'エンゲージメント誘発要素',
    'CTA（コメント・保存・シェアの促し）',
  ],
  'コード生成': [
    '要件・入出力の明確化',
    '設計方針・アーキテクチャ選択',
    'エラーケースと例外処理',
    'テスト観点（正常系・異常系・境界値）',
    '依存関係・セットアップ手順',
  ],
  'コード修正依頼': [
    '問題箇所の特定と原因分析',
    '修正方針（バグ修正 or リファクタ）',
    '後方互換性と影響範囲の確認',
    '修正前後の動作比較',
    '既存テストへの影響',
  ],
  'デザイン指示': [
    'ターゲット層が受け取る第一印象',
    '色・配色の方向性と制約',
    '形状・レイアウトのリズム感',
    '雰囲気・世界観のキーワード',
    '避けたい表現・NG方向',
  ],
  '画像生成指示': [
    '被写体の詳細描写',
    '構図・カメラアングル',
    '照明・光源・時間帯',
    'アートスタイル・技法',
    'ネガティブ要素（除外したいもの）',
  ],
  'リサーチ依頼': [
    '技術・サービスの概要',
    '市場動向・規模感',
    '主要プレイヤー・競合',
    '実際の活用事例',
    '将来展望・課題',
  ],
};

const OUTPUT_BLUEPRINTS: Record<ArtifactType, string[]> = {
  '文章作成': [
    '導入（問題提起・フック）',
    '本論（主張 → 根拠 → 具体例）',
    '結論（まとめ ＋ 行動促進）',
  ],
  '要約': [
    '冒頭サマリー（3行以内）',
    'キーポイント（優先度順）',
    '補足・要確認事項',
  ],
  'アイデア出し': [
    '即実行可能案（〜1週間）',
    '中期施策（1〜3か月）',
    '挑戦的アイデア（3か月以上）',
    '推薦案 ＋ 理由',
  ],
  '企画書': [
    'エグゼクティブサマリー',
    '背景・課題',
    '目的・KPI',
    '提案内容',
    '実施計画',
    'リスクと対策',
  ],
  'SNS投稿': [
    '超短文型（〜40字）',
    'スタンダード型（〜100字）',
    'ストーリー型',
    '数字・データ訴求型',
    '問いかけ型',
  ],
  'コード生成': [
    '設計方針の説明',
    '実装コード（コメント付き）',
    '使用例・実行例',
    'テストサンプル',
    '既知の制限・改善点',
  ],
  'コード修正依頼': [
    '問題一覧（重大度順）',
    '修正前 → 修正後 対比',
    '修正後の完全コード',
    '追加改善提案（任意）',
  ],
  'デザイン指示': [
    'コンセプト・世界観',
    'カラーパレット（HEX付き）',
    'タイポグラフィ方針',
    'UIコンポーネント指針',
    'NGデザイン',
  ],
  '画像生成指示': [
    '日本語プロンプト',
    '英語プロンプト（推奨）',
    'ネガティブプロンプト',
  ],
  'リサーチ依頼': [
    'エグゼクティブサマリー',
    '主要な発見（信頼度付き）',
    '比較分析',
    '考察・示唆',
    '結論と推奨アクション',
    '調査の限界・補足',
  ],
};

// ============================================================
// PUBLIC API: expandIntent
// ============================================================

/**
 * 成果物タイプとテキストから ExpandedIntent を生成する。
 *
 * @param outputType 成果物タイプ
 * @param text       normalizeInput 済みのユーザー入力テキスト
 */
export function expandIntent(outputType: ArtifactType, text: string): ExpandedIntent {
  // DEBUG: enter/exit log（e.trim 追跡用）
  console.log('[enter] expandIntent | outputType:', outputType, '| text type:', typeof text, '| text:', String(text ?? 'UNDEFINED').slice(0, 40));
  const targetAudience = extractTargetAudience(text);
  const tone = extractTone(text);
  const keyConstraints = extractConstraints(text);
  const desiredQualities = extractDesiredQualities(text);
  const primaryGoal = extractPrimaryGoal(text);
  const inferredAssumptions = inferAssumptions(outputType, text);
  const ambiguityNotes = detectAmbiguities(outputType, text);
  const contextAmplifiers = CONTEXT_AMPLIFIERS[outputType] ?? [];
  const outputBlueprint = OUTPUT_BLUEPRINTS[outputType] ?? [];

  const outputExpectation: string[] = [];
  if (targetAudience.length > 0) {
    outputExpectation.push(`${targetAudience.join('・')}が理解しやすい内容`);
  }
  if (tone.length > 0) {
    outputExpectation.push(`${tone.join('・')}なトーンで統一`);
  }

  const result = {
    primaryGoal,
    targetAudience,
    tone,
    keyConstraints,
    desiredQualities,
    outputExpectation,
    ambiguityNotes,
    inferredAssumptions,
    contextAmplifiers,
    outputBlueprint,
  };
  console.log('[exit] expandIntent | primaryGoal:', result.primaryGoal.slice(0, 40));
  return result;
}
