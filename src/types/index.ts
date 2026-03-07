export type ArtifactType =
  | '文章作成'
  | '要約'
  | 'アイデア出し'
  | '企画書'
  | 'SNS投稿'
  | 'コード生成'
  | 'コード修正依頼'
  | 'デザイン指示'
  | '画像生成指示'
  | 'リサーチ依頼';

export type SecurityLevel = 'level1' | 'level2' | 'level3';
export type MarkdownLevel = 'md1' | 'md2' | 'md3';
export type TargetAI = 'none' | 'chatgpt' | 'claude' | 'gemini' | 'general';
export type PromptVariant = 'standard' | 'concise' | 'precise';
export type PromptModifier = 'shorter' | 'polish' | 'more_specific' | 'alternative';

export const ARTIFACT_TYPES: ArtifactType[] = [
  '文章作成',
  '要約',
  'アイデア出し',
  '企画書',
  'SNS投稿',
  'コード生成',
  'コード修正依頼',
  'デザイン指示',
  '画像生成指示',
  'リサーチ依頼',
];

export const SECURITY_LABELS: Record<SecurityLevel, { label: string; description: string }> = {
  level1: { label: '公開向け', description: '固有名詞などをそのまま使います' },
  level2: { label: '配慮あり', description: '具体情報を少し一般化します' },
  level3: { label: '秘匿優先', description: '機密情報を抽象化します' },
};

export const MARKDOWN_LABELS: Record<MarkdownLevel, { label: string; description: string }> = {
  md1: { label: '制限なし', description: 'Markdownを自由に使用' },
  md2: { label: '軽制限', description: '過度なMarkdownを避ける' },
  md3: { label: 'プレーンのみ', description: 'Markdown使用禁止' },
};

export const MODIFIER_LABELS: Record<PromptModifier, { label: string; desc: string }> = {
  shorter: { label: '短くする', desc: '要点を絞ってコンパクトに' },
  polish: { label: '磨きをかける', desc: '文体・表現を洗練させる' },
  more_specific: { label: 'より具体的に', desc: '詳細・条件を補強する' },
  alternative: { label: '別案を出す', desc: 'アプローチを変えた別案' },
};

export const AI_LABELS: Record<TargetAI, string> = {
  none: '指定なし',
  chatgpt: 'ChatGPT向け',
  claude: 'Claude向け',
  gemini: 'Gemini向け',
  general: '汎用',
};

export interface PromptInput {
  artifactType: ArtifactType;
  securityLevel: SecurityLevel;
  markdownLevel: MarkdownLevel;
  targetAI: TargetAI;
  description: string;
}

export interface GeneratedPrompts {
  standard: string;
  concise: string;
  precise: string;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  input: PromptInput;
  prompts: GeneratedPrompts;
  modifier?: PromptModifier | null;
}
