/**
 * promptBuilder.ts
 *
 * 責務の流れ:
 *   normalizeInput
 *     → sanitizeBySecurityLevel
 *     → getOutputTypeInstruction / getMarkdownConstraint / getPreferredAIHint
 *     → buildConcisePrompt / buildStandardPrompt / buildPrecisePrompt
 *     → buildPrompts (public API)
 */

import type {
  ArtifactType,
  SecurityLevel,
  MarkdownLevel,
  TargetAI,
  PromptInput,
  GeneratedPrompts,
  PromptModifier,
} from '../types';
import { expandIntent } from './intentExpander';
import type { ExpandedIntent } from './intentExpander';

// ============================================================
// 内部型定義
// ============================================================

/** 成果物タイプごとの指示データ */
interface OutputTypeInstruction {
  /** AIに付与する専門家の役割 */
  role: string;
  /** このタスクのゴール（precise の役割節に使用） */
  goal: string;
  /** concise 版の1行指示文（完結した文） */
  conciseInstruction: string;
  /** standard 版の出力要件（箇条書き文字列） */
  standardOutputSpec: string;
  /** precise 版の出力形式（詳細仕様） */
  preciseOutputSpec: string;
  /** タイプ固有の追加指示（コード系・リサーチ系向け。空文字で省略可） */
  preciseExtra: string;
  /** precise の品質基準セクションに使う注意事項 */
  cautions: string;
}

/** sanitizeBySecurityLevel の返り値 */
interface SanitizeResult {
  /** 処理後のテキスト（level1/2 は原文、level3 は一部マスク済み） */
  text: string;
  /** プロンプト側に追加する情報取り扱い方針文（level1 は空文字） */
  policyNote: string;
}

/** Markdown レベルごとのフォーマット制約 */
interface MarkdownConstraint {
  /** concise 版に末尾インラインで追加する短い注記（md1 は空文字） */
  inlineNote: string;
  /** standard/precise 版のブロック指示（md1 は空文字） */
  blockInstructions: string;
}

/** 優先 AI ごとのトーンヒント */
interface AIHint {
  /** precise 版の冒頭1文（none/general は空文字） */
  preciseOpener: string;
  /** 役割修飾語（「経験豊富な」など。なければ空文字） */
  rolePrefix: string;
}

/** 各 builder に渡す組み立て済みリクエスト */
interface PromptRequest {
  sanitized: SanitizeResult;
  instruction: OutputTypeInstruction;
  markdownConstraint: MarkdownConstraint;
  aiHint: AIHint;
  originalInput: PromptInput;
  expandedIntent: ExpandedIntent;
  modifier?: PromptModifier | null;
}

// ============================================================
// STEP 1: 入力の正規化
// ============================================================

/**
 * ユーザー入力を正規化する。
 * - 前後の空白を除去
 * - CRLF / CR を LF に統一
 * - 3行以上の連続改行を2行に圧縮
 * - 行末の空白を除去
 * - 全角スペースを半角に変換
 * - 連続する句点・読点を単一に正規化
 */
export function normalizeInput(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/　/g, ' ')
    .replace(/。{2,}/g, '。')
    .replace(/、{2,}/g, '、');
}

// ============================================================
// STEP 2: セキュリティレベルごとの抽象化
// ============================================================

/**
 * セキュリティレベルに応じてテキストを処理し、
 * プロンプトに追加すべき取り扱い方針文を返す。
 *
 * level1: テキスト変更なし、方針文なし
 * level2: テキスト変更なし、中程度の方針文を追加
 * level3: 明らかな機密パターンをマスク + 強い方針文を追加
 *
 * 注: v1 では完全な匿名化は行わない。
 *     level 間の差分を明確にすることを優先する。
 */
export function sanitizeBySecurityLevel(
  text: string,
  level: SecurityLevel
): SanitizeResult {
  switch (level) {
    case 'level1':
      return { text, policyNote: '' };

    case 'level2':
      return {
        text, // テキスト自体は変更しない
        policyNote:
          '【情報の取り扱い】固有名詞・組織名・個人名・具体的な数値は、「ある企業」「担当者」「一定規模」などの一般的な表現に置き換えて回答してください。',
      };

    case 'level3': {
      // 明らかなパターンのみ安全にマスクする（過剰な変換はしない）
      const masked = text
        .replace(/\d{7,}/g, '[数値]') // 7桁以上の数字（電話番号・IDなど）
        .replace(/[\w.+%-]+@[\w.-]+\.[a-zA-Z]{2,}/g, '[メールアドレス]')
        .replace(/https?:\/\/\S+/g, '[URL]');

      return {
        text: masked,
        policyNote:
          '【機密情報の取り扱い】本依頼には機密性の高い情報が含まれます。固有名詞・組織名・個人名・具体的な数値・日付はすべて「某社」「関係者」「一定の規模」などの抽象的な表現に置き換えてください。出力に特定可能な情報が残らないよう徹底してください。',
      };
    }
  }
}

// ============================================================
// STEP 3: 成果物タイプごとの instruction データ
// ============================================================

const OUTPUT_TYPE_INSTRUCTIONS: Record<ArtifactType, OutputTypeInstruction> = {
  '文章作成': {
    role: 'プロのライター・コピーライター',
    goal: '読者が最後まで読み切り、行動や思考の変化を促す文章を書く',
    conciseInstruction: '以下の内容で文章を作成してください。',
    standardOutputSpec: `- 導入・本論・結論の3部構成で書いてください
- 各段落に明確なテーマを持たせてください
- 文体（ですます調 / だ・である調）を統一してください
- 一文は60字以内を目安にしてください`,
    preciseOutputSpec: `【構成】
導入（問題提起またはフック） → 本論（主張 → 根拠 → 具体例の繰り返し） → 結論（要約 ＋ 行動促進）

【文体・語彙】
- ですます調 / だ・である調を冒頭で決定し、最後まで統一する
- 専門用語は初出時に括弧内で説明を加える
- 一文60字以内を目安に区切る

【品質チェック】
- 読者が「なぜ重要か」を常に理解できる構成にする
- 感情に訴えるポイントを少なくとも1か所意識的に入れる`,
    preciseExtra: '',
    cautions:
      '著作権・引用ルールを遵守してください。事実と意見の区別を明示してください。',
  },

  '要約': {
    role: '情報設計の専門家',
    goal: '読者が元の内容を読まずとも核心を把握できる、正確で完結な要約を作る',
    conciseInstruction: '以下の内容を要約してください。',
    standardOutputSpec: `- 重要度の高い順に3〜5点のキーポイントを整理してください
- 元の意図・ニュアンスを正確に保持してください
- 繰り返しや冗長な表現を省いてください
- 不明・推測の箇所は「※要確認」と明示してください`,
    preciseOutputSpec: `【構造】
① 冒頭サマリー（3行以内）：「何が・どうなった・何が重要か」を記述する
② 本体：キーポイントを優先度順に3〜7点列挙
   各ポイントの形式 → 事実 ／ 意味・背景 ／ 実務への示唆
③ 末尾：補足が必要な論点を1〜2点挙げる

【精度基準】
- 元の文脈と矛盾しないか都度照合する
- 推測・不確かな情報は「※推測」「※要確認」と明示する
- 専門用語は平易な言葉に置き換え、括弧内に原語を添える`,
    preciseExtra: '',
    cautions:
      '解釈による意味の変質を避けてください。数値・固有名詞は正確に保持してください。',
  },

  'アイデア出し': {
    role: 'クリエイティブディレクター',
    goal: '即実行可能なものから挑戦的なものまで、視野を広げる多様なアイデアを提供する',
    conciseInstruction: '以下のテーマでアイデアを出してください。',
    standardOutputSpec: `- アイデアを5〜8個提案してください
- 各アイデアにキャッチコピー（ひと言）と2〜3行の説明を付けてください
- 即実行可能なものと挑戦的なものをバランスよく含めてください`,
    preciseOutputSpec: `【提案形式（10個以上）】
各アイデアを以下の形式で記述する：
  ■ アイデア名（キャッチコピー）
  概要：2〜3文
  メリット：主な利点を2点
  課題：想定されるリスク・障壁
  難易度：低 / 中 / 高

【分類】
「即実行可能（1週間以内）」「中期施策（1〜3か月）」「挑戦的（3か月以上）」の3カテゴリに整理する

【推薦】
特に推薦するアイデアに ★ を付け、推薦理由を1文添える`,
    preciseExtra: '',
    cautions:
      '実現不可能なアイデアは難易度「高」として明記してください。大きなコストを要する案は必ず明示してください。',
  },

  '企画書': {
    role: 'ビジネスストラテジスト',
    goal: '意思決定者がすぐに承認・却下を判断できる、説得力のある企画書を作る',
    conciseInstruction: '以下の内容で企画書を作成してください。',
    standardOutputSpec: `- 目的・背景・施策・期待効果の4要素を中心に構成してください
- 具体的なKPIや数値目標を含めてください
- リスクと対策を1〜2点盛り込んでください
- 実行スケジュールの概略を添えてください`,
    preciseOutputSpec: `【必須セクション（各見出し付き）】
1. エグゼクティブサマリー（300字以内）
2. 背景・課題（現状分析と問題提起）
3. 目的とKPI（定量目標 ＋ 定性目標）
4. 提案施策（詳細・優先順位付き）
5. 実施スケジュール（フェーズ別 / マイルストーン付き）
6. 必要リソース・予算概算
7. リスクと対策（重要度：高 / 中 / 低 で分類）
8. 成功の定義（何をもって成功とみなすか）

【品質チェック】
- データ・市場情報を根拠として積極的に活用する
- 各施策に「なぜこれか」の理由を明記する`,
    preciseExtra: '',
    cautions:
      '根拠のない楽観的な数値は使わないでください。推計の場合はその旨を明示してください。',
  },

  'SNS投稿': {
    role: 'SNSマーケティングの専門家',
    goal: 'エンゲージメントを最大化しながら、ブランドメッセージを正確に伝える投稿を作る',
    conciseInstruction: '以下の内容でSNS投稿文を作成してください。',
    standardOutputSpec: `- 投稿文を3パターン作成してください（短文型・中文型・感情訴求型）
- 各パターンにハッシュタグを3〜5個提案してください
- ターゲット層とプラットフォームを意識したトーンで書いてください`,
    preciseOutputSpec: `【投稿パターン（5種類）】
① 超短文型（40字以内）：インパクト重視
② スタンダード型（100字前後）：情報をわかりやすく整理
③ ストーリー型：感情に訴える展開
④ 数字・データ訴求型：信頼性と具体性で差別化
⑤ 問いかけ型：コメント・リプライを誘発

【各パターンに付記】
- ハッシュタグ：5〜10個（一般タグ ＋ ニッチタグを混在）
- 想定エンゲージメント効果とターゲット層（1行）
- 推奨投稿日時（曜日・時間帯）`,
    preciseExtra: '',
    cautions:
      '誇大表現・ステルスマーケティングと誤解される表現は避けてください。炎上リスクのある表現は事前に指摘してください。',
  },

  'コード生成': {
    role: 'シニアソフトウェアエンジニア',
    goal: '保守性が高く、すぐに実用できるクリーンなコードを提供する',
    conciseInstruction: '以下の要件でコードを生成してください。',
    standardOutputSpec: `- 完全に動作するコードを生成してください
- 主要なロジックにインラインコメントを付けてください
- 使い方がわかるサンプル（実行例）を含めてください`,
    preciseOutputSpec: `【実装要件】
- 各関数・クラスに docstring / JSDoc を付ける
- エラーハンドリングを適切に実装する（try-catch / Result型 など）
- 入力値のバリデーションを含める

【付随ドキュメント】
- ユニットテストのサンプル（正常系・異常系・境界値の最低3ケース）
- 依存関係とセットアップ手順
- 既知の制限事項
- 改善可能な点（2〜3点）`,
    preciseExtra: `【実装前の前提確認】
言語・フレームワーク・バージョンの指定がない場合、最も一般的・標準的な選択肢を採用し、冒頭でその旨を明示してください。
実装に入る前に設計方針を1〜2文で説明してください。`,
    cautions:
      'SQLインジェクション・XSSなどのセキュリティリスクは回避し、発見した場合は必ず指摘してください。',
  },

  'コード修正依頼': {
    role: 'コードレビュー専門のエンジニア',
    goal: 'バグ・脆弱性・パフォーマンス問題をすべて洗い出し、より良いコードへ改善する',
    conciseInstruction: '以下のコードの問題点を特定し、修正してください。',
    standardOutputSpec: `- 問題箇所を特定し、種類（バグ・パフォーマンス・可読性・セキュリティ）を明示してください
- 修正前と修正後のコードを対比して示してください
- 各修正の理由を簡潔に説明してください`,
    preciseOutputSpec: `【問題一覧（重大度順）】
各問題を以下の形式で記述する：
  ▶ 問題N｜種類：バグ / セキュリティ / パフォーマンス / 可読性
  場所：該当箇所
  原因：なぜ問題か
  修正前：（コード）
  修正後：（コード）
  解説：修正根拠とベストプラクティス

【修正後の完全コード】
すべての修正を反映した最終コードを末尾に提示する

【追加提案（任意）】
さらに改善できる箇所があれば記述する`,
    preciseExtra: `【前提確認】
対象言語・フレームワークが明記されていない場合、コードから推測して冒頭で明示してください。
修正によって既存の動作が変わる場合は必ず警告してください。`,
    cautions:
      '後方互換性の破壊を避けてください。不可避な場合は変更の影響範囲を明示してください。',
  },

  'デザイン指示': {
    role: 'UIデザイナー・クリエイティブディレクター',
    goal: 'デザイナーや実装者が迷わず作業できる、具体的で一貫したデザイン仕様を作る',
    conciseInstruction: '以下の内容でデザイン仕様を作成してください。',
    standardOutputSpec: `- コンセプト・世界観を2〜3文で記述してください
- カラーパレット（メイン・サブ・アクセント）をHEX値とともに指定してください
- タイポグラフィ（フォント・ウェイト・サイズ）の方針を示してください
- レイアウトの基本方針を記述してください`,
    preciseOutputSpec: `【デザイン仕様書の構成】
1. コンセプト（ブランドの言葉・世界観・ターゲット像）
2. カラーパレット（主要5色・HEXコード付き・用途説明付き）
3. タイポグラフィ（フォントファミリー・ウェイト体系・サイズスケール）
4. スペーシング・グリッドシステム（ベースユニット・カラム数）
5. UIコンポーネントスタイル（ボタン・カード・フォーム・アイコン）
6. インタラクション原則（アニメーション速度・フィードバック設計）
7. NGデザイン（避けるべき表現・色・フォント）
8. インスピレーション参考（類似スタイル・方向性）`,
    preciseExtra: '',
    cautions:
      'アクセシビリティ（色覚特性・コントラスト比WCAG2.1基準4.5:1以上）を考慮してください。',
  },

  '画像生成指示': {
    role: '画像生成AIのプロンプトエンジニア',
    goal: 'AIが迷わず解釈でき、意図通りの画像が生成される詳細なプロンプトを作る',
    conciseInstruction: '以下のイメージで画像生成プロンプトを作成してください。',
    standardOutputSpec: `- 被写体・構図・スタイルを明確な言葉で記述してください
- 雰囲気・ムードを表す形容詞を複数含めてください
- 日本語プロンプトと英語プロンプトの両方を提示してください`,
    preciseOutputSpec: `【日本語プロンプト】
被写体の詳細・構図・照明・色調・スタイル・雰囲気をすべて記述する

【英語プロンプト（推奨）】
以下の要素をすべて含めること：
- 被写体の詳細描写（外見・状態・動作）
- 構図・視点・カメラアングル
- 照明・光源・時間帯
- 色調・カラーグレーディング
- アートスタイル・技法（photorealistic / digital art / oil painting 等）
- 品質・解像度（8K / ultra detailed / masterpiece 等）

【ネガティブプロンプト】
除外したい要素を列挙する（低品質ワード・不要な要素・スタイル違反など）`,
    preciseExtra: '',
    cautions:
      '著作権・肖像権に配慮してください。実在する特定人物の生成を誘導する表現は含めないでください。',
  },

  'リサーチ依頼': {
    role: 'リサーチアナリスト',
    goal: '実務での意思決定に直接役立つ、信頼性が高く体系的なリサーチレポートを作る',
    conciseInstruction: '以下のテーマについてリサーチしてください。',
    standardOutputSpec: `- 調査結果を重要度順に整理してください
- 各発見に信頼度（高 / 中 / 低）を付記してください
- 不明点・要確認事項は明示してください`,
    preciseOutputSpec: `【レポート構成】
1. エグゼクティブサマリー（400字以内・非専門家でも読める内容）
2. 調査背景・目的
3. 主要な発見と知見（優先度順・各項目に信頼度 高/中/低 を記載）
4. 詳細分析（データ・事例・比較）
5. 考察・示唆（実務への応用）
6. 結論と推奨アクション
7. 調査の限界・追加調査が必要な領域
8. 参考情報・出典

【記述ルール】
- 一次情報（公式発表・統計・論文）と二次情報（解説記事）を区別して示す
- 推測・不確かな情報は「※推測」「※要確認」と明示する
- 時点情報（「〇年時点」など）を必ず付記する`,
    preciseExtra: `【調査の信頼性基準】
情報の確度に応じて「確認済み」「推測」「要検証」の3段階で信頼度を示してください。
単一の情報源に依存せず、複数の視点を取り入れてください。`,
    cautions:
      '情報の鮮度に注意し、古い情報は年月を明記してください。根拠のない推測と確認済みの事実を明確に区別してください。',
  },
};

/** 成果物タイプの指示データを返す */
export function getOutputTypeInstruction(
  outputType: ArtifactType
): OutputTypeInstruction {
  return OUTPUT_TYPE_INSTRUCTIONS[outputType];
}

// ============================================================
// STEP 4: Markdown レベルごとのフォーマット制約
// ============================================================

const MARKDOWN_CONSTRAINTS: Record<MarkdownLevel, MarkdownConstraint> = {
  md1: {
    inlineNote: '',
    blockInstructions: '',
  },
  md2: {
    inlineNote: '（過度なMarkdown記法は避けてください）',
    blockInstructions:
      '見出し（##）や箇条書き（-）は使用可能ですが、コードブロックや表は最小限にしてください。ネストは2段階まで。',
  },
  md3: {
    inlineNote: '（Markdownを使わず、プレーンテキストで出力してください）',
    blockInstructions:
      '出力はMarkdownを使用せず、プレーンテキストのみで記述してください。見出しは「■」「【】」で代替し、箇条書きは「・」または番号付きで記述してください。太字・斜体・コードブロックは使用禁止です。',
  },
};

/** Markdown レベルのフォーマット制約を返す */
export function getMarkdownConstraint(markdownLevel: MarkdownLevel): MarkdownConstraint {
  return MARKDOWN_CONSTRAINTS[markdownLevel];
}

// ============================================================
// STEP 5: 優先 AI ごとのトーンヒント
//
// 仕様: 差分は軽微にとどめる。やりすぎない。
// ============================================================

const AI_HINTS: Record<TargetAI, AIHint> = {
  none: {
    preciseOpener: '',
    rolePrefix: '',
  },
  chatgpt: {
    preciseOpener:
      'あなたは優秀なプロフェッショナルです。以下の指示に正確に従い、高品質な成果物を提供してください。',
    rolePrefix: '経験豊富な',
  },
  claude: {
    preciseOpener:
      '以下の指示を注意深く読み、各要件を確認しながら丁寧に対応してください。',
    rolePrefix: '',
  },
  gemini: {
    preciseOpener:
      '最新の知識と分析力を活用して、以下の依頼に最善の回答を提供してください。',
    rolePrefix: '',
  },
  general: {
    preciseOpener: '',
    rolePrefix: '',
  },
};

/** 優先 AI のトーンヒントを返す */
export function getPreferredAIHint(preferredAI: TargetAI): AIHint {
  return AI_HINTS[preferredAI];
}

// ============================================================
// 組み立て層: 共通ヘルパー
// ============================================================

/** 空文字列・空白のみの部分を除いてセクションを結合する */
function joinSections(...parts: string[]): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join('\n\n');
}

/** modifier に対応する冒頭指示文を返す */
function getModifierDirective(modifier: PromptModifier | null | undefined): string {
  if (!modifier) return '';
  const directives: Record<PromptModifier, string> = {
    shorter:
      '【修正指示】前回の出力より短く・コンパクトにまとめてください。不要な説明を省き、要点のみに絞ってください。',
    polish:
      '【修正指示】前回の出力に磨きをかけてください。文体・表現をより洗練させ、精度を高めてください。',
    more_specific:
      '【修正指示】前回の出力より具体的にしてください。詳細・条件・背景を補強し、指示をより明確にしてください。',
    alternative:
      '【修正指示】前回とは異なるアプローチで別案を作成してください。視点・構造・切り口を変えた新しいバージョンを提供してください。',
  };
  return directives[modifier];
}

// ============================================================
// 組み立て層: 簡潔 (concise)
//
// 思想: AIは賢い。余分な前置きは省く。
//       指示1行 + 制約インライン注記 + 依頼内容のみ。
//
// 構造:
//   [指示文] [インライン注記]
//
//   [依頼内容]
//
// 情報量: 最小限
// 行数目安: 4〜8行
// ============================================================

export function buildConcisePrompt(request: PromptRequest): string {
  const { sanitized, instruction, markdownConstraint, expandedIntent, modifier } = request;

  const modifierDirective = getModifierDirective(modifier);

  // インライン注記（セキュリティ・フォーマット）をまとめる
  const inlineNotes = [sanitized.policyNote, markdownConstraint.inlineNote]
    .filter(Boolean)
    .join(' ');

  // 対象が検出された場合のみ指示文にインライン付加
  const audienceNote = expandedIntent.targetAudience.length > 0
    ? `（対象：${expandedIntent.targetAudience.join('・')}）`
    : '';

  const instructionLine = audienceNote
    ? `${instruction.conciseInstruction}${audienceNote}`
    : instruction.conciseInstruction;

  const firstLine = inlineNotes
    ? `${instructionLine}\n${inlineNotes}`
    : instructionLine;

  return joinSections(modifierDirective, firstLine, sanitized.text);
}

// ============================================================
// 組み立て層: 標準 (standard)
//
// 思想: 役割を与え、出力条件を明示するが、冗長にしない。
//       実務で「とりあえずこれを貼れば動く」レベルを目指す。
//
// 構造:
//   [役割宣言（1文）]
//
//   [依頼内容]
//
//   [出力要件（4〜5点）]
//   [セキュリティ方針（level2/3 のみ）]
//   [フォーマット制約（md2/3 のみ）]
//
// 情報量: 中程度
// 行数目安: 18〜28行
// ============================================================

export function buildStandardPrompt(request: PromptRequest): string {
  const { sanitized, instruction, markdownConstraint, aiHint, expandedIntent, modifier } = request;

  const modifierDirective = getModifierDirective(modifier);

  const role = `${aiHint.rolePrefix}${instruction.role}`;
  const roleLine = `あなたは${role}です。以下の依頼に対応してください。`;

  // 対象・トーンを検出した場合のみコンテキスト行を追加
  const contextParts: string[] = [];
  if (expandedIntent.targetAudience.length > 0) {
    contextParts.push(`ターゲット：${expandedIntent.targetAudience.join('・')}`);
  }
  if (expandedIntent.tone.length > 0) {
    contextParts.push(`トーン：${expandedIntent.tone.join('・')}`);
  }
  const contextLine = contextParts.length > 0 ? contextParts.join(' ／ ') : '';

  // outputBlueprint を矢印つなぎで出力要件末尾に付加（存在する場合のみ）
  const blueprintLine = expandedIntent.outputBlueprint.length > 0
    ? `\n【推奨構成】${expandedIntent.outputBlueprint.join(' → ')}`
    : '';
  const outputBlock = `【出力要件】\n${instruction.standardOutputSpec}${blueprintLine}`;

  const constraintBlocks = [
    sanitized.policyNote,
    markdownConstraint.blockInstructions
      ? `【出力形式】${markdownConstraint.blockInstructions}`
      : '',
  ].filter(Boolean);

  return joinSections(
    modifierDirective,
    contextLine ? `${roleLine}\n${contextLine}` : roleLine,
    sanitized.text,
    outputBlock,
    ...constraintBlocks
  );
}

// ============================================================
// 組み立て層: 高精度 (precise)
//
// 思想: AIが迷わないよう、役割・目的・制約・出力形式・
//       不足情報の扱いをすべて明示する。
//       不明点は「合理的な仮定を立てて前提を明示する」方針を伝える。
//
// 構造:
//   [AI オープナー（chatgpt/claude/gemini のみ）]
//
//   ## 役割と目的
//   ## 依頼内容
//   ## 出力形式
//   ## 制約（level2/3 または md2/3 のみ）
//   ## 不足情報の扱い
//   ## 品質基準
//
// 情報量: 最大
// 行数目安: 35〜55行
// ============================================================

export function buildPrecisePrompt(request: PromptRequest): string {
  const { sanitized, instruction, markdownConstraint, aiHint, expandedIntent, modifier } = request;
  const sections: string[] = [];

  // modifier 指示（存在する場合のみ冒頭に配置）
  const modifierDirective = getModifierDirective(modifier);
  if (modifierDirective) {
    sections.push(modifierDirective);
  }

  // AI オープナー（指定がある場合のみ）
  if (aiHint.preciseOpener) {
    sections.push(aiHint.preciseOpener);
  }

  // ## 役割と目的
  const role = `${aiHint.rolePrefix}${instruction.role}`;
  sections.push(
    `## 役割と目的\nあなたは${role}として対応してください。\n目的：${instruction.goal}`
  );

  // ## 依頼内容: 原文 + 構造化コンテキスト + contextAmplifiers
  const intentContextParts: string[] = [];
  if (expandedIntent.targetAudience.length > 0) {
    intentContextParts.push(`【対象】${expandedIntent.targetAudience.join('・')}`);
  }
  if (expandedIntent.tone.length > 0) {
    intentContextParts.push(`【トーン・雰囲気】${expandedIntent.tone.join('・')}`);
  }
  if (expandedIntent.keyConstraints.length > 0) {
    intentContextParts.push(`【制約・条件】${expandedIntent.keyConstraints.join('・')}`);
  }
  const intentContext = intentContextParts.length > 0
    ? `\n\n${intentContextParts.join('\n')}`
    : '';

  // contextAmplifiers: 検討すべき観点をカンマ区切りで提示
  const amplifiersNote = expandedIntent.contextAmplifiers.length > 0
    ? `\n\n【検討すべき観点】\n${expandedIntent.contextAmplifiers.map((a) => `- ${a}`).join('\n')}`
    : '';

  sections.push(`## 依頼内容\n${sanitized.text}${intentContext}${amplifiersNote}`);

  // ## 出力形式: outputBlueprint（推奨構成）+ 詳細仕様
  const preciseOutputFull = instruction.preciseExtra
    ? `${instruction.preciseOutputSpec}\n\n${instruction.preciseExtra}`
    : instruction.preciseOutputSpec;

  const blueprintBlock = expandedIntent.outputBlueprint.length > 0
    ? `【推奨構成】\n${expandedIntent.outputBlueprint.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
    : '';

  sections.push(`## 出力形式\n${blueprintBlock}${preciseOutputFull}`);

  // ## 制約（セキュリティ / フォーマットのどちらかが存在する場合のみ）
  const constraintItems = [
    sanitized.policyNote,
    markdownConstraint.blockInstructions
      ? `【出力形式制約】${markdownConstraint.blockInstructions}`
      : '',
  ].filter(Boolean);
  if (constraintItems.length > 0) {
    sections.push(`## 制約\n${constraintItems.join('\n\n')}`);
  }

  // ## 不足情報の扱い: 具体的な ambiguityNotes + inferredAssumptions を使用
  const { ambiguityNotes, inferredAssumptions } = expandedIntent;
  const missingInfoParts: string[] = [];

  if (ambiguityNotes.length > 0) {
    missingInfoParts.push(
      `以下の点が不明なため、合理的な仮定を立てて進め、冒頭で前提を明示してください：\n` +
      ambiguityNotes.map((n) => `- ${n}`).join('\n')
    );
  }
  if (inferredAssumptions.length > 0) {
    missingInfoParts.push(
      `以下の前提を採用してください：\n` +
      inferredAssumptions.map((a) => `- ${a}`).join('\n')
    );
  }
  // どちらも空の場合は汎用メッセージ
  if (missingInfoParts.length === 0) {
    missingInfoParts.push(
      `情報が不明または不足している場合は、最も妥当な仮定を立てて対応し、` +
      `その前提を冒頭で「（前提：〇〇と仮定）」のように明示してください。\n` +
      `推測が含まれる箇所は「（推測）」と記載してください。`
    );
  }
  sections.push(`## 不足情報の扱い\n${missingInfoParts.join('\n\n')}`);

  // ## 品質基準: タイプ固有の注意 + 共通基準 + desiredQualities（検出時）
  const qualityItems = [
    `- ${instruction.cautions}`,
    `- 受け取り手の立場と目的を常に意識する`,
    `- 曖昧な表現を避け、具体的・明確に記述する`,
  ];
  if (expandedIntent.desiredQualities.length > 0) {
    qualityItems.push(`- 特に重視する品質：${expandedIntent.desiredQualities.join('・')}`);
  }
  sections.push(`## 品質基準\n${qualityItems.join('\n')}`);

  return sections.join('\n\n');
}

// ============================================================
// PUBLIC API: パイプラインを通じて3案を生成
// ============================================================

/**
 * PromptInput を受け取り、concise / standard / precise の3案を返す。
 *
 * パイプライン:
 *   normalizeInput
 *     → sanitizeBySecurityLevel
 *     → getOutputTypeInstruction / getMarkdownConstraint / getPreferredAIHint
 *     → buildConcisePrompt / buildStandardPrompt / buildPrecisePrompt
 *
 * @param precomputedIntent - 呼び出し側で事前計算済みの ExpandedIntent。
 *   渡された場合は expandIntent の再実行を省略する。
 *   modifier 再生成など、入力が変わらない場合に活用してパフォーマンスを改善する。
 */
export function buildPrompts(
  input: PromptInput,
  modifier?: PromptModifier | null,
  precomputedIntent?: ExpandedIntent,
): GeneratedPrompts {
  const normalized = normalizeInput(input.description);
  const sanitized = sanitizeBySecurityLevel(normalized, input.securityLevel);
  const instruction = getOutputTypeInstruction(input.artifactType);
  const markdownConstraint = getMarkdownConstraint(input.markdownLevel);
  const aiHint = getPreferredAIHint(input.targetAI);
  const expandedIntent = precomputedIntent ?? expandIntent(input.artifactType, normalized);

  const request: PromptRequest = {
    sanitized,
    instruction,
    markdownConstraint,
    aiHint,
    originalInput: input,
    expandedIntent,
    modifier,
  };

  return {
    standard: buildStandardPrompt(request),
    concise: buildConcisePrompt(request),
    precise: buildPrecisePrompt(request),
  };
}
