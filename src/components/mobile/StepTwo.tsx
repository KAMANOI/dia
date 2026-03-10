'use client';

import { useState, useMemo } from 'react';
import type { ArtifactType, SecurityLevel, MarkdownLevel, TargetAI } from '@/types';
import { AI_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { expandIntent } from '@/utils/intentExpander';
import type { ExpandedIntent } from '@/utils/intentExpander';
import { safeTrim } from '@/utils/safeTrim';
import { GeneratingView } from '@/components/shared/GeneratingView';

interface StepTwoProps {
  description: string;
  artifactType: ArtifactType;
  securityLevel: SecurityLevel;
  markdownLevel: MarkdownLevel;
  targetAI: TargetAI;
  onDescriptionChange: (value: string) => void;
  onSecurityChange: (level: SecurityLevel) => void;
  onMarkdownChange: (level: MarkdownLevel) => void;
  onTargetAIChange: (ai: TargetAI) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  progressStep: number;
  isSlowConnection: boolean;
  generationError: string | null;
  onRetry: () => void;
}

const PLACEHOLDERS: Partial<Record<ArtifactType, string>> = {
  '文章作成':
    '新しいコーヒーショップのブランドコンセプトを考えたい。ターゲットは20〜30代のビジネスパーソン。',
  '要約':
    '先週の全社会議の内容を要約したい。決定事項とアクションを中心に5分で読める分量で。',
  'アイデア出し':
    '社内コミュニケーションを活性化させるアイデアが欲しい。低コストですぐ実行できるものを中心に。',
  '企画書':
    'オンライン英語学習サービスの事業企画書を作りたい。ターゲットはビジネスパーソン、月額制サブスク。',
  'SNS投稿':
    '新製品のローンチ告知をInstagramとXに投稿したい。購入ページへの誘導も含めて。',
  'コード生成':
    'PythonでCSVを読み込み、特定の列でフィルタリングしてJSON形式で保存するスクリプトを作りたい。',
  'コード修正依頼':
    'ReactのuseEffectで無限ループが起きている。依存配列の問題だと思うが原因と修正方法を教えてほしい。',
  'デザイン指示':
    '健康食品ブランドのLPをリデザインしたい。清潔感・信頼感を重視、30代女性向けのデザインに。',
  '画像生成指示':
    '都市の夜景を背景にした女性のポートレート。映画的でドラマチックな光、アート系の仕上がり。',
  'リサーチ依頼':
    '日本のD2C市場の現状と今後のトレンドを調査したい。成功事例と失敗パターンも含めてほしい。',
};

const DEFAULT_PLACEHOLDER =
  '新しいコーヒーショップのブランドコンセプトを考えたい。\nターゲットは20〜30代のビジネスパーソン。';

const SECURITY_OPTIONS: { level: SecurityLevel; label: string; desc: string; dot: string }[] = [
  { level: 'level1', label: '公開向け',  desc: '固有名詞などをそのまま使います', dot: 'bg-security-1' },
  { level: 'level2', label: '配慮あり',  desc: '具体情報を少し一般化します',     dot: 'bg-security-2' },
  { level: 'level3', label: '秘匿優先',  desc: '機密情報を抽象化します',         dot: 'bg-security-3' },
];

const MARKDOWN_OPTIONS: { level: MarkdownLevel; label: string }[] = [
  { level: 'md1', label: '制限なし' },
  { level: 'md2', label: '軽制限' },
  { level: 'md3', label: 'プレーンのみ' },
];

// 最小文字数: この長さに達するとプレビューを表示
const PREVIEW_MIN_LENGTH = 10;

export function StepTwo({
  description,
  artifactType,
  securityLevel,
  markdownLevel,
  targetAI,
  onDescriptionChange,
  onSecurityChange,
  onMarkdownChange,
  onTargetAIChange,
  onBack,
  onGenerate,
  isGenerating,
  progressStep,
  isSlowConnection,
  generationError,
  onRetry,
}: StepTwoProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const canGenerate = safeTrim(description).length > 0;
  const placeholder = PLACEHOLDERS[artifactType] ?? DEFAULT_PLACEHOLDER;

  // Prompt Preview: 入力内容からExpandedIntentをリアルタイム計算
  const expandedIntent = useMemo<ExpandedIntent | null>(() => {
    const trimmed = safeTrim(description);
    if (trimmed.length < PREVIEW_MIN_LENGTH) return null;
    return expandIntent(artifactType, trimmed);
  }, [description, artifactType]);

  // 生成中はプログレス画面を全画面表示
  if (isGenerating) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        <GeneratingView
          progressStep={progressStep}
          isSlowConnection={isSlowConnection}
        />
      </div>
    );
  }

  // エラー時はフォームの上部にバナーを表示（フォームは操作可能なまま）

  return (
    <div className="flex flex-col h-full">
      {/* スクロール領域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">

        {/* エラーバナー */}
        {generationError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-card border border-red-200 bg-red-50">
            <span className="text-red-500 text-base mt-0.5 flex-shrink-0">!</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 font-medium">生成に失敗しました</p>
              <p className="text-xs text-red-600 mt-0.5 leading-snug">{generationError}</p>
            </div>
            <button
              onClick={onRetry}
              className="flex-shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2"
            >
              再試行
            </button>
          </div>
        )}

        {/* ヘッダー */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-ink">作りたい内容</h2>
          <p className="text-sm text-ink-muted mt-1">日本語で簡単に書いてください。</p>
        </div>

        {/* テキストエリア */}
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={placeholder}
          rows={7}
          showCount
          className="text-base leading-relaxed"
        />

        {/* Prompt Preview: DIAが理解した内容 */}
        {expandedIntent && (
          <PromptPreview intent={expandedIntent} />
        )}

        {/* 詳細設定（折りたたみ） */}
        <div className="mt-5 border border-line rounded-card overflow-hidden">
          <button
            onClick={() => setAdvancedOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAFA] text-sm font-medium text-ink hover:bg-[#F0F0F0] transition-colors active:scale-[0.99]"
          >
            <span>詳細設定</span>
            <ChevronIcon open={advancedOpen} />
          </button>

          {advancedOpen && (
            <div className="px-4 pt-4 pb-5 space-y-5 border-t border-line">

              {/* 情報の公開レベル */}
              <section>
                <p className="text-xs font-semibold text-ink mb-2">情報の公開レベル</p>
                <div className="space-y-1.5">
                  {SECURITY_OPTIONS.map(({ level, label, desc, dot }) => {
                    const isSelected = securityLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => onSecurityChange(level)}
                        className={[
                          'w-full flex items-center gap-3 px-3.5 py-3 rounded-card border text-left',
                          'transition-all duration-150 active:scale-[0.98]',
                          isSelected
                            ? 'border-primary bg-primary-subtle'
                            : 'border-line bg-white hover:border-ink/20',
                        ].join(' ')}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-ink'}`}>
                            {label}
                          </div>
                          <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
                        </div>
                        {isSelected && <CheckIcon />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 出力形式 */}
              <section>
                <p className="text-xs font-semibold text-ink mb-2">出力形式</p>
                <div className="grid grid-cols-3 gap-2">
                  {MARKDOWN_OPTIONS.map(({ level, label }) => {
                    const isSelected = markdownLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => onMarkdownChange(level)}
                        className={[
                          'flex flex-col items-center py-3 px-2 rounded-card border',
                          'transition-all duration-150 active:scale-[0.97]',
                          isSelected
                            ? 'border-primary bg-primary-subtle'
                            : 'border-line bg-white hover:border-ink/20',
                        ].join(' ')}
                      >
                        <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-ink'}`}>
                          {level.toUpperCase()}
                        </span>
                        <span className="text-xs text-ink-muted mt-0.5 text-center leading-tight">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 優先AI */}
              <section>
                <p className="text-xs font-semibold text-ink mb-2">優先AI（任意）</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(AI_LABELS) as [TargetAI, string][]).map(([ai, label]) => {
                    const isSelected = targetAI === ai;
                    return (
                      <button
                        key={ai}
                        onClick={() => onTargetAIChange(ai)}
                        className={[
                          'py-2.5 px-3 rounded-card border text-sm font-medium text-center',
                          'transition-all duration-150 active:scale-[0.97]',
                          isSelected
                            ? 'border-primary bg-primary-subtle text-primary'
                            : 'border-line bg-white text-ink hover:border-ink/20',
                        ].join(' ')}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>
          )}
        </div>
      </div>

      {/* 下部固定CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line px-4 pt-3 pb-safe">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={onBack}
            disabled={isGenerating}
            className="flex-none px-5"
          >
            戻る
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
          >
            {isGenerating ? '生成中...' : '生成する'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Prompt Preview: DIAが理解した内容
   ============================================================ */
function PromptPreview({ intent }: { intent: ExpandedIntent }) {
  const toneAndQualities = [...intent.tone, ...intent.desiredQualities];

  const rows: { label: string; value: string }[] = [];

  if (intent.primaryGoal) {
    const truncated = intent.primaryGoal.length > 52
      ? intent.primaryGoal.slice(0, 52) + '…'
      : intent.primaryGoal;
    rows.push({ label: '目的', value: truncated });
  }
  if (intent.targetAudience.length > 0) {
    rows.push({ label: 'ターゲット', value: intent.targetAudience.join('・') });
  }
  if (toneAndQualities.length > 0) {
    rows.push({ label: '重視点', value: toneAndQualities.slice(0, 4).join('・') });
  }
  if (intent.keyConstraints.length > 0) {
    rows.push({ label: '制約', value: intent.keyConstraints.join('・') });
  }

  // 目的のみしか出ない場合はプレビューを表示しない（情報量が少なすぎる）
  if (rows.length <= 1 && !intent.targetAudience.length && !toneAndQualities.length) {
    return null;
  }

  return (
    <div className="mt-4 rounded-card border border-line bg-[#FAFAFA] px-4 py-3.5 animate-fade-in">
      <p className="text-[11px] font-semibold text-ink-muted tracking-wide uppercase mb-2.5">
        DIAが理解した内容
      </p>
      <div className="space-y-1.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-xs leading-snug">
            <span className="text-ink-muted flex-shrink-0 min-w-[3.75rem]">{label}</span>
            <span className="text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   小コンポーネント
   ============================================================ */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 text-ink-muted ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4F46E5"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
