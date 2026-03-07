'use client';

import type { GeneratedPrompts, PromptVariant, PromptModifier } from '@/types';
import { MODIFIER_LABELS } from '@/types';
import { PromptCard } from '@/components/shared/PromptCard';
import { CopyButton } from '@/components/shared/CopyButton';
import { AdSlot } from '@/components/ads';
import { GeneratingView } from '@/components/shared/GeneratingView';

interface ResultPanelProps {
  prompts: GeneratedPrompts | null;
  isGenerating: boolean;
  progressStep: number;
  isSlowConnection: boolean;
  generationError: string | null;
  onModify: (modifier: PromptModifier) => void;
  onRetry: () => void;
}

const VARIANTS: PromptVariant[] = ['standard', 'concise', 'precise'];
const MODIFIERS: PromptModifier[] = ['shorter', 'polish', 'more_specific', 'alternative'];

export function ResultPanel({ prompts, isGenerating, progressStep, isSlowConnection, generationError, onModify, onRetry }: ResultPanelProps) {
  if (isGenerating) {
    return (
      <div className="space-y-4">
        {/* プログレス表示 */}
        <div className="bg-white rounded-card border border-line p-6">
          <GeneratingView
            progressStep={progressStep}
            isSlowConnection={isSlowConnection}
            compact
          />
        </div>
        {/* スケルトンカード × 3 */}
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (generationError && !prompts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-full max-w-sm rounded-card border border-red-200 bg-red-50 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-red-700 mb-1">生成に失敗しました</p>
          <p className="text-xs text-red-600 mb-4 leading-snug">{generationError}</p>
          <button
            onClick={onRetry}
            className="px-5 py-2 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            再試行する
          </button>
        </div>
      </div>
    );
  }

  if (!prompts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <FileIcon />
        <div className="text-center">
          <p className="text-sm font-medium text-ink-muted">結果がここに表示されます</p>
          <p className="text-xs text-ink-muted mt-1 opacity-70">
            左パネルで設定して生成してください
          </p>
        </div>
      </div>
    );
  }

  // 既存の結果がある場合、エラーバナーを結果の上に表示
  const errorBanner = generationError ? (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-card border border-red-200 bg-red-50 mb-4">
      <p className="text-xs text-red-700 leading-snug">
        <span className="font-semibold">再生成に失敗しました。</span>前回の結果を表示中。
      </p>
      <button
        onClick={onRetry}
        className="flex-shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2"
      >
        再試行
      </button>
    </div>
  ) : null;

  const allPrompts = `【標準】\n${prompts.standard}\n\n【簡潔】\n${prompts.concise}\n\n【高精度】\n${prompts.precise}`;

  return (
    <div className="space-y-4 animate-fade-in">
      {errorBanner}
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">生成されたプロンプト</h2>
          <p className="text-xs text-ink-muted mt-0.5">AIにそのまま貼り付けて使えます。</p>
        </div>
        <CopyButton text={allPrompts} size="sm" />
      </div>

      {/* 各プロンプトカード */}
      {VARIANTS.map((variant) => (
        <PromptCard key={variant} variant={variant} content={prompts[variant]} />
      ))}

      {/* 改善アクション */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-ink-muted mb-2">プロンプトを調整する</p>
        <div className="flex gap-2 flex-wrap">
          {MODIFIERS.map((mod) => {
            const { label, desc } = MODIFIER_LABELS[mod];
            return (
              <button
                key={mod}
                onClick={() => onModify(mod)}
                className="flex flex-col items-start px-3.5 py-2.5 rounded-card border border-line bg-white hover:border-primary hover:bg-primary-subtle transition-all duration-150 active:scale-[0.97] text-left"
              >
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="text-xs text-ink-muted">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 広告スロット: 結果・コピー・改善アクションの後 */}
      {/* 配置意図: プロンプト生成フローが完了した後の自然な区切り位置 */}
      <AdSlot variant="inline" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card border border-line p-5 space-y-3 animate-pulse">
      <div className="h-3 w-14 rounded bg-ink/8" />
      <div className="space-y-2">
        <div className="h-3 rounded bg-ink/5 w-full" />
        <div className="h-3 rounded bg-ink/5 w-11/12" />
        <div className="h-3 rounded bg-ink/5 w-4/5" />
        <div className="h-3 rounded bg-ink/5 w-3/4" />
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E5E5E5" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
