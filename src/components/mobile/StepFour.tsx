'use client';

import type { GeneratedPrompts, PromptVariant, PromptModifier } from '@/types';
import { MODIFIER_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { CopyButton } from '@/components/shared/CopyButton';
import { AdSlot } from '@/components/ads';

interface StepFourProps {
  prompts: GeneratedPrompts;
  activeTab: PromptVariant;
  isGenerating: boolean;
  onTabChange: (tab: PromptVariant) => void;
  onModify: (modifier: PromptModifier) => void;
  onBack: () => void;
  onNew: () => void;
}

const TABS = [
  { key: 'standard' as PromptVariant, label: '標準',  sub: 'バランス型' },
  { key: 'concise'  as PromptVariant, label: '簡潔',  sub: '短め' },
  { key: 'precise'  as PromptVariant, label: '高精度', sub: '詳細型' },
];

const MODIFIERS: PromptModifier[] = ['shorter', 'polish', 'more_specific', 'alternative'];

export function StepFour({
  prompts,
  activeTab,
  isGenerating,
  onTabChange,
  onModify,
  onBack,
  onNew,
}: StepFourProps) {
  const content = prompts[activeTab];

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-ink-muted">
        <GeneratingDots />
        <p className="text-sm">生成しています...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* タブ */}
      <div className="px-4 pt-4 pb-0">
        <h2 className="text-lg font-bold text-ink mb-3">生成されたプロンプト</h2>
        <Tabs
          tabs={TABS}
          active={activeTab}
          onChange={(k) => onTabChange(k as PromptVariant)}
          variant="pill"
        />
      </div>

      {/* スクロール領域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 animate-fade-in">

        {/* プロンプト本文カード */}
        <div className="rounded-card border border-line bg-white overflow-hidden">
          {/* カードヘッダー: コピー操作が主導線 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-[#FAFAFA]">
            <p className="text-xs text-ink-muted">AIにそのままコピーして使えます</p>
            <CopyButton text={content} />
          </div>
          {/* 本文 */}
          <div className="p-4">
            <pre className="text-sm text-ink whitespace-pre-wrap leading-relaxed font-sans break-words">
              {content}
            </pre>
          </div>
        </div>

        {/* 改善アクション: pillチップ */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-ink-muted mb-2.5">調整する</p>
          <div className="flex flex-wrap gap-2">
            {MODIFIERS.map((mod) => (
              <button
                key={mod}
                onClick={() => onModify(mod)}
                className="px-4 py-2 rounded-full border border-line bg-white text-sm font-medium text-ink hover:border-primary hover:text-primary hover:bg-primary-subtle transition-all duration-150 active:scale-[0.97]"
              >
                {MODIFIER_LABELS[mod].label}
              </button>
            ))}
          </div>
        </div>

        {/* 広告スロット: コピー・改善アクション後の自然な区切り */}
        <AdSlot variant="inline" className="mt-5" />

        {/* 全案まとめてコピー */}
        <div className="mt-4 px-4 py-3 rounded-card border border-line bg-[#FAFAFA] flex items-center justify-between gap-4">
          <p className="text-xs text-ink-muted">3案をまとめてコピー</p>
          <CopyButton
            text={`【標準】\n${prompts.standard}\n\n【簡潔】\n${prompts.concise}\n\n【高精度】\n${prompts.precise}`}
          />
        </div>

      </div>

      {/* 下部固定フッター: 細め、操作は主にスクロール内 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-line px-4 pt-2 pb-safe">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="text-sm text-ink-muted hover:text-ink transition-colors py-2"
          >
            ← 戻る
          </button>
          <Button variant="primary" size="md" onClick={onNew}>
            新しく作る
          </Button>
        </div>
      </div>
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
