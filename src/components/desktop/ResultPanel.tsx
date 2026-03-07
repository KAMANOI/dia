'use client';

import type { GeneratedPrompts, PromptVariant, PromptModifier } from '@/types';
import { MODIFIER_LABELS } from '@/types';
import { PromptCard } from '@/components/shared/PromptCard';
import { CopyButton } from '@/components/shared/CopyButton';
import { AdSlot } from '@/components/ads';

interface ResultPanelProps {
  prompts: GeneratedPrompts | null;
  isGenerating: boolean;
  onModify: (modifier: PromptModifier) => void;
}

const VARIANTS: PromptVariant[] = ['standard', 'concise', 'precise'];
const MODIFIERS: PromptModifier[] = ['shorter', 'polish', 'more_specific', 'alternative'];

export function ResultPanel({ prompts, isGenerating, onModify }: ResultPanelProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-ink-muted">
        <GeneratingDots />
        <p className="text-sm">生成しています...</p>
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

  const allPrompts = `【標準】\n${prompts.standard}\n\n【簡潔】\n${prompts.concise}\n\n【高精度】\n${prompts.precise}`;

  return (
    <div className="space-y-4 animate-fade-in">
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

function GeneratingDots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/40"
          style={{ animation: `dia-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
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
