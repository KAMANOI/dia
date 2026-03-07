/**
 * intentExpander.ts (v2)
 *
 * ユーザーが入力した日本語テキストから意図情報を抽出・推定する層。
 * ルールベース + 軽いヒューリスティック。高度なNLP処理は行わない。
 *
 * 責務の流れ:
 *   extractTargetAudience / extractTone / extractConstraints /
 *   extractDesiredQualities / extractPrimaryGoal
 *     → inferAssumptions / detectAmbiguities
 *     → expandIntent (公開API)
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
// targetAudience 抽出
// ============================================================

const AUDIENCE_KEYWORDS = [
  '初心者', '上級者', '経営者', '経営層', '役員', 'マネージャー',
  'エンジニア', '開発者', 'デザイナー', '学生', '主婦', 'ビジネスパーソン',
  '消費者', '顧客', 'クライアント', 'シニア', '若者', '高齢者', '社会人',
  '新入社員', '管理職', 'マーケター', 'フリーランス', '起業家',
  '一般ユーザー', 'ユーザー', '専門家', '非エンジニア', '読者',
] as const;

/**
 * 「〜向け」で取得した文字列が audience らしいか判定する。
 * 助詞で終わるもの・汎用語を除外してノイズを減らす。
 */
function isLikelyAudience(text: string): boolean {
  if (text.length < 2) return false;
  // 助詞・接続詞で終わる = 名詞句ではない
  if (/[てにはをがのもへで]$/.test(text)) return false;
  // 明らかに対象でない汎用語
  if (['全て', 'すべて', 'それ', 'これ'].includes(text)) return false;
  return true;
}

/**
 * テキストから対象読者・ユーザー層を抽出する。
 *
 * 検出パターン:
 * - 「〜向け」（「向けて」「向かって」は除外）
 * - 「ターゲット / 対象(者|ユーザー|読者)? [接続詞] 〜」
 * - 年代表現（20代, 30〜40代 など）
 * - 職種・属性の既知キーワード
 *
 * 後処理: サブサム重複除去
 *   例）"20〜30代のビジネスパーソン" があれば "20〜30代" と "ビジネスパーソン" を除去
 */
export function extractTargetAudience(text: string): string[] {
  const raw = new Set<string>();

  // 「〜向け」: max 14字, 「向けて」「向かって」は不一致
  const mukeRe = /([^\s、。\n]{2,14})向け(?![てかっ])/g;
  let m: RegExpExecArray | null;
  while ((m = mukeRe.exec(text)) !== null) {
    const v = m[1].trim();
    if (isLikelyAudience(v)) raw.add(v);
  }

  // 「ターゲット / 対象(者|ユーザー|読者)? [は/が/を/：/ ] 〜」
  const targetRe = /(?:ターゲット|対象(?:者|ユーザー|読者)?)[はがを：: ]{0,4}([^\s、。\n]{2,20})/g;
  while ((m = targetRe.exec(text)) !== null) {
    const v = m[1].trim();
    if (isLikelyAudience(v)) raw.add(v);
  }

  // 年代（20代, 30〜40代 など）
  const ageRe = /(\d+代(?:[〜～]\d+代)?)/g;
  while ((m = ageRe.exec(text)) !== null) {
    raw.add(m[1]);
  }

  // 既知キーワードの直接マッチ
  for (const kw of AUDIENCE_KEYWORDS) {
    if (text.includes(kw)) raw.add(kw);
  }

  // サブサム重複除去: 他の要素の部分文字列になっているものを除く
  // 例: "ビジネスパーソン" ⊂ "20〜30代のビジネスパーソン" → 前者を除去
  const all = Array.from(raw);
  return all.filter(
    (item) => !all.some((other) => other !== item && other.includes(item))
  );
}

// ============================================================
// tone: 感情的・審美的雰囲気のみ
//
// ※ 「論理的」「実務的」など機能的品質語は desiredQualities へ分離
// ============================================================

const TONE_KEYWORDS = [
  '落ち着いた', '高級感', '高級な', '親しみやすい', '洗練された',
  'シンプル', 'カジュアル', 'フォーマル', 'モダン', 'クール', 'ポップ',
  'ミニマル', '温かみ', '温かい', '柔らかい', '明るい', 'フレンドリー',
  '真剣', '個性的', 'スタイリッシュ', 'ナチュラル', 'ラグジュアリー',
  'エレガント', 'クラシック', 'ビンテージ', 'チェーン店っぽくない',
] as const;

/**
 * テキストから審美的・感情的トーンを抽出する。
 * 機能的品質（論理的・実務的など）は extractDesiredQualities で取得する。
 */
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
 * テキストから制約・条件表現を抽出する。
 * 以下を検出:
 * - 字数・行数制限（300字以内 など）
 * - 「〜禁止」「〜なし」「〜厳守」
 * - 既知の制約キーワード
 */
export function extractConstraints(text: string): string[] {
  const results = new Set<string>();

  const charLimitRe = /(\d+(?:字|文字|行)(?:以内|程度|まで))/g;
  let m: RegExpExecArray | null;
  while ((m = charLimitRe.exec(text)) !== null) {
    results.add(m[1]);
  }

  const prohibitRe = /([^\s、。\n]{1,10}(?:禁止|なし|不使用|厳守))/g;
  while ((m = prohibitRe.exec(text)) !== null) {
    results.add(m[1]);
  }

  for (const kw of CONSTRAINT_KEYWORDS) {
    if (text.includes(kw)) results.add(kw);
  }

  return Array.from(results);
}

// ============================================================
// desiredQualities: 機能的品質
//
// v2 で tone から分離:
//   論理的・実務的・丁寧・プロフェッショナル などを追加
// ============================================================

const QUALITY_KEYWORDS = [
  // tone から分離した機能的品質語
  '論理的', '分かりやすい', 'わかりやすい', '実務的', '丁寧', 'プロフェッショナル',
  // 元からの品質語
  '読みやすい', '読みやすさ', '説得力', '信頼性', '独自性', '共感',
  '使いやすい', '実用的', '正確', '創造的', 'オリジナル', '革新的', '網羅的',
  '簡潔', '具体的',
] as const;

/**
 * テキストから機能的品質への期待を抽出する。
 */
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
 * 「〜したい」系の文を優先し、なければ最初の文を使う。
 */
export function extractPrimaryGoal(text: string): string {
  for (const ending of GOAL_ENDINGS) {
    const re = new RegExp(`(.{5,50}?${ending})`);
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  const first = text.split(/[。\n]/)[0].trim();
  return first.slice(0, 60) || text.slice(0, 60);
}

// ============================================================
// inferAssumptions
//
// 設計方針:
// - タイプごとに 1〜2 項目（最大3項目）
// - テキスト依存の動的補完は 1 項目まで追加
// - ベース仮定と動的仮定が重複する場合は動的仮定のみを採用
// ============================================================

/**
 * 成果物タイプとテキスト内容から妥当な補完仮定を生成する。
 */
export function inferAssumptions(outputType: ArtifactType, text: string): string[] {
  const items: string[] = [];

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
      if (!/予算|費用|コスト/.test(text)) {
        items.push('費用・予算感は「別途検討」として扱う');
      }
      break;

    case 'SNS投稿':
      items.push('エンゲージメント最大化（拡散・いいね）を主要目的として最適化する');
      if (!/Twitter|X|Instagram|Facebook|LinkedIn|TikTok|YouTube/i.test(text)) {
        // ベース仮定と被らないよう、動的仮定のみを追加
        items.push('プラットフォーム未指定のため汎用的な文体・文字数で複数案を提示する');
      }
      break;

    case 'コード生成':
      items.push('保守性・可読性・エラーハンドリングを実装基準とする');
      if (!/Python|JavaScript|TypeScript|Go|Rust|Java|C#|PHP|Ruby|Swift/i.test(text)) {
        // ベース仮定の「言語〜採用」と表現を変えず、動的側のみ追加
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
//
// 設計方針:
// - 検出条件をより実務的・具体的に
// - メッセージは「〜が不明です」だけでなく、AI が次のアクションを
//   取りやすい形（例を含む・仮定の方向性を示す）にする
// - 強化対象: 企画書・デザイン指示・リサーチ依頼・コード修正依頼
// ============================================================

interface AmbiguityCheck {
  condition: (text: string) => boolean;
  note: string;
}

const AMBIGUITY_CHECKS: Partial<Record<ArtifactType, AmbiguityCheck[]>> = {
  '企画書': [
    {
      // KPI・目標が一切言及されていない場合
      condition: (t) => !/KPI|目標|指標|数値|成果|達成/.test(t),
      note: 'KPI・目標値が未設定です。妥当な指標（例：新規顧客数・売上増減率・完了件数など）を仮置きして提示してください',
    },
    {
      condition: (t) => !/期間|スケジュール|いつまで|フェーズ|ロードマップ|納期/.test(t),
      note: '実施期間・マイルストーンが未設定です。一般的なフェーズ分け（例：Phase1: 1〜3か月 / Phase2: 4〜6か月）で補完してください',
    },
    {
      // 承認者の情報がなく、対象読者の想定が難しい場合
      condition: (t) => !/承認|決裁|経営|役員|部長|マネージャー|上司|意思決定/.test(t),
      note: '意思決定者・承認者の立場が不明です。一般的なビジネス文脈（中間管理職〜役員が読者）を前提として構成してください',
    },
  ],

  'コード生成': [
    {
      condition: (t) => !/Python|JavaScript|TypeScript|Go|Rust|Java|C#|PHP|Ruby|Swift/i.test(t),
      note: '使用言語・フレームワークが指定されていません。最も一般的な選択肢を採用し、冒頭でその理由を明示してください',
    },
    {
      condition: (t) => !/テスト|test|spec/i.test(t),
      note: 'テストコードの要否が不明です。必要な場合は主要な正常系・異常系のサンプルを末尾に追加してください',
    },
  ],

  'コード修正依頼': [
    {
      condition: (t) => !/Python|JavaScript|TypeScript|Go|Rust|Java|C#|PHP|Ruby|Swift/i.test(t),
      note: '対象言語・フレームワークが指定されていません。コードから推測して冒頭で明示してください',
    },
    {
      // 修正目的の手がかりが一切ない場合
      condition: (t) => !/バグ|エラー|error|パフォーマンス|遅い|可読性|読みにくい|セキュリティ|脆弱|最適化|修正目的/i.test(t),
      note: '修正の主目的が不明です。バグ修正・パフォーマンス改善・可読性向上・セキュリティ対策のうち最も可能性が高いものを選び、冒頭で明示してください',
    },
  ],

  'SNS投稿': [
    {
      condition: (t) => !/Twitter|X|Instagram|Facebook|LinkedIn|TikTok|YouTube|プラットフォーム|媒体/i.test(t),
      note: '投稿プラットフォームが指定されていません（X・Instagram・LinkedIn など）。複数媒体向けに文字数・トーンを変えて提案してください',
    },
  ],

  'デザイン指示': [
    {
      condition: (t) => !/Web|サイト|アプリ|印刷|バナー|ロゴ|パッケージ|ポスター|名刺|媒体|用途/i.test(t),
      note: 'デザインの用途・媒体が不明です（例：Webサイト・アプリ画面・印刷物・ロゴなど）。Webデザインを前提として進め、媒体を冒頭で明示してください',
    },
    {
      // NGデザインの指定がない場合
      condition: (t) => !/NG|避け|使わない|禁止|嫌い|やめて|しない/.test(t),
      note: 'NGデザイン・避けたい方向性が未指定です。ターゲット層と目的から一般的に不適切な方向性を仮定し、NGとして明示してください',
    },
  ],

  '画像生成指示': [
    {
      condition: (t) => !/構図|アングル|視点|俯瞰|クローズアップ|全身|上半身|バストアップ/.test(t),
      note: '構図・カメラアングルが不明です。最も一般的な構図（例：正面・バストアップ・三分割構図など）を仮定して指定してください',
    },
    {
      condition: (t) => !/スタイル|テイスト|写真|フォト|イラスト|アート|絵画|3D|アニメ/.test(t),
      note: 'アートスタイルが不明です（例：写真調・イラスト・水彩・3D・アニメ調など）。目的に合う一般的なスタイルを採用して明示してください',
    },
  ],

  'リサーチ依頼': [
    {
      condition: (t) => !/比較|vs|対|競合|他社|選択肢|候補/.test(t),
      note: '比較・調査の対象範囲が不明です（例：競合3社・特定市場・複数手法の比較など）。最も関連性の高い比較軸を設定して進めてください',
    },
    {
      condition: (t) => !/期間|〜年|最新|直近|過去\d+年?/.test(t),
      note: '調査対象の時間軸が未指定です。最新情報を優先しつつ、必要に応じて直近3〜5年の傾向も含めてください',
    },
    {
      // リサーチの活用用途が不明な場合
      condition: (t) => !/目的|用途|活用|使用|なぜ|ため|に向け|意思決定|共有|検討/.test(t),
      note: '調査結果の活用用途が不明です（意思決定資料・社内共有・提案書など用途によって深さが変わります）。汎用的な情報整理として進めてください',
    },
  ],
};

/**
 * 成果物タイプとテキスト内容から不明点・曖昧な点を検出する。
 * 各メッセージは「不明なので〇〇してください」形式で AI への具体的な指示となる。
 */
export function detectAmbiguities(outputType: ArtifactType, text: string): string[] {
  const checks = AMBIGUITY_CHECKS[outputType] ?? [];
  return checks
    .filter((c) => c.condition(text))
    .map((c) => c.note);
}

// ============================================================
// contextAmplifiers: AIが検討すべき観点
//
// 設計方針:
// - 入力が短い・曖昧な場合でも AI が網羅的に検討できるよう補助
// - タイプごとに 4〜6 項目。観点の名称は短く・具体的に
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

// ============================================================
// outputBlueprint: 成果物タイプごとの推奨出力構成
//
// 設計方針:
// - precise の ## 出力形式 冒頭に「推奨構成」として提示
// - standard には矢印つなぎで簡潔に提示
// - 既存の preciseOutputSpec の詳細仕様を補完する骨格として機能
// ============================================================

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
  const targetAudience = extractTargetAudience(text);
  const tone = extractTone(text);
  const keyConstraints = extractConstraints(text);
  const desiredQualities = extractDesiredQualities(text);
  const primaryGoal = extractPrimaryGoal(text);
  const inferredAssumptions = inferAssumptions(outputType, text);
  const ambiguityNotes = detectAmbiguities(outputType, text);
  const contextAmplifiers = CONTEXT_AMPLIFIERS[outputType] ?? [];
  const outputBlueprint = OUTPUT_BLUEPRINTS[outputType] ?? [];

  // outputExpectation: 対象・トーンから導出（両方空の場合は空のまま）
  const outputExpectation: string[] = [];
  if (targetAudience.length > 0) {
    outputExpectation.push(`${targetAudience.join('・')}が理解しやすい内容`);
  }
  if (tone.length > 0) {
    outputExpectation.push(`${tone.join('・')}なトーンで統一`);
  }

  return {
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
}
