import type {
  HistoryItem,
  ArtifactType,
  SecurityLevel,
  MarkdownLevel,
  TargetAI,
  PromptModifier,
} from '../types';
import { ARTIFACT_TYPES } from '../types';
import { safeTrim } from './safeTrim';

const STORAGE_KEY = 'dia_history';
const MAX_HISTORY = 50;

/**
 * 現在のストレージスキーマバージョン。
 * フィールド追加・削除などの破壊的変更時にインクリメントする。
 */
const HISTORY_VERSION = 1;

// ── バリデーション用定数 ──────────────────────────────────────
const VALID_SECURITY: readonly SecurityLevel[] = ['level1', 'level2', 'level3'];
const VALID_MARKDOWN: readonly MarkdownLevel[] = ['md1', 'md2', 'md3'];
const VALID_TARGET_AI: readonly TargetAI[] = ['none', 'chatgpt', 'claude', 'gemini', 'general'];
const VALID_MODIFIERS: readonly PromptModifier[] = ['shorter', 'polish', 'more_specific', 'alternative'];

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

/**
 * localStorage から読んだ生データを HistoryItem として検証・補正する。
 *
 * - description / prompts が欠損 → null を返し呼び出し側で除外
 * - enum フィールドが無効値 → 安全なデフォルト値にフォールバック
 * - id / createdAt が欠損 → 代替値を自動生成
 */
function sanitizeItem(raw: unknown): HistoryItem | null {
  if (raw === null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  // ── input ────────────────────────────────────────────────────
  if (r.input === null || typeof r.input !== 'object') return null;
  const inp = r.input as Record<string, unknown>;

  // description は必須。空文字も除外する（生成不能なため）
  // safeTrim の戻り値を string 型の変数に受け、TypeScript の型を確定させる
  const description = safeTrim(inp.description);
  if (!description) return null;

  const artifactType: ArtifactType = ARTIFACT_TYPES.includes(inp.artifactType as ArtifactType)
    ? (inp.artifactType as ArtifactType)
    : '文章作成';

  const securityLevel: SecurityLevel = VALID_SECURITY.includes(inp.securityLevel as SecurityLevel)
    ? (inp.securityLevel as SecurityLevel)
    : 'level2';

  const markdownLevel: MarkdownLevel = VALID_MARKDOWN.includes(inp.markdownLevel as MarkdownLevel)
    ? (inp.markdownLevel as MarkdownLevel)
    : 'md1';

  const targetAI: TargetAI = VALID_TARGET_AI.includes(inp.targetAI as TargetAI)
    ? (inp.targetAI as TargetAI)
    : 'general';

  // ── prompts ──────────────────────────────────────────────────
  // 3案すべて揃っていない場合は表示できないため除外する
  if (r.prompts === null || typeof r.prompts !== 'object') return null;
  const p = r.prompts as Record<string, unknown>;
  if (!isStr(p.standard) || !isStr(p.concise) || !isStr(p.precise)) return null;

  // ── id / createdAt ───────────────────────────────────────────
  const id = isStr(r.id) && r.id ? r.id : String(Date.now());
  const createdAt = isStr(r.createdAt) && r.createdAt ? r.createdAt : new Date().toISOString();

  // ── modifier（省略可） ───────────────────────────────────────
  const modifier: PromptModifier | null = VALID_MODIFIERS.includes(r.modifier as PromptModifier)
    ? (r.modifier as PromptModifier)
    : null;

  return {
    id,
    createdAt,
    input: { artifactType, securityLevel, markdownLevel, targetAI, description },
    prompts: { standard: p.standard, concise: p.concise, precise: p.precise },
    modifier,
  };
}

// ── ストレージエンベロープ ────────────────────────────────────

interface StorageEnvelope {
  /** スキーマバージョン */
  v: number;
  items: unknown[];
}

/**
 * localStorage の生文字列をパースし、アイテム配列と「移行が必要か」を返す。
 *
 * 旧フォーマット: JSON 配列 `[...items]`
 * 現行フォーマット: `{ "v": 1, "items": [...] }`
 */
function parseRaw(raw: string): { rawItems: unknown[]; needsMigration: boolean } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { rawItems: [], needsMigration: false };
  }

  // 旧フォーマット（配列そのまま）→ 移行が必要
  if (Array.isArray(parsed)) {
    return { rawItems: parsed, needsMigration: true };
  }

  // 現行フォーマット
  if (parsed !== null && typeof parsed === 'object') {
    const env = parsed as Record<string, unknown>;
    if (Array.isArray(env.items)) {
      const needsMigration = (env as unknown as StorageEnvelope).v !== HISTORY_VERSION;
      return { rawItems: env.items, needsMigration };
    }
  }

  return { rawItems: [], needsMigration: false };
}

// ── 公開 API ─────────────────────────────────────────────────

export function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const { rawItems, needsMigration } = parseRaw(raw);

    const sanitized = rawItems
      .map(sanitizeItem)
      .filter((item): item is HistoryItem => item !== null);

    // フォーマットが古い、または不正なレコードが除去された場合は書き直す
    const hadInvalidItems = sanitized.length < rawItems.length;
    if (needsMigration || hadInvalidItems) {
      setTimeout(() => {
        try { saveHistory(sanitized); } catch { /* non-fatal */ }
      }, 0);
    }

    return sanitized;
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const envelope: StorageEnvelope = {
      v: HISTORY_VERSION,
      items: items.slice(0, MAX_HISTORY),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // localStorage が満杯などの場合は無視
  }
}
