'use client';

import type { PromptInput, GeneratedPrompts, PromptModifier, ArtifactType } from '@/types';
import { InputPanel } from './InputPanel';
import { ResultPanel } from './ResultPanel';
import { LandingPanel } from './LandingPanel';

interface DesktopLayoutProps {
  input: PromptInput;
  prompts: GeneratedPrompts | null;
  isGenerating: boolean;
  onInputChange: (updates: Partial<PromptInput>) => void;
  onGenerate: () => void;
  onModify: (modifier: PromptModifier) => void;
  onOpenHistory: () => void;
}

export function DesktopLayout({
  input,
  prompts,
  isGenerating,
  onInputChange,
  onGenerate,
  onModify,
  onOpenHistory,
}: DesktopLayoutProps) {
  const showLanding = !prompts && !isGenerating;

  const handleSelectType = (type: ArtifactType) => {
    onInputChange({ artifactType: type });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-line sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          {/* ブランド */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ink tracking-tight">DIA</span>
            <span className="text-sm text-ink-muted">日本語から、AIの指示へ。</span>
          </div>

          {/* ナビ */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink px-3 py-1.5 rounded-btn hover:bg-[#F7F7F7] transition-colors"
          >
            <ClockIcon />
            履歴
          </button>
        </div>
      </header>

      {/* 2カラムレイアウト */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
        <div className="grid grid-cols-[400px_1fr] gap-8 items-start">
          {/* 左: 入力パネル (sticky) */}
          <div className="sticky top-20">
            <div className="bg-white rounded-card border border-line p-6">
              <InputPanel
                input={input}
                onChange={onInputChange}
                onGenerate={onGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>

          {/* 右: 結果 or ランディング */}
          <div>
            {showLanding ? (
              <div className="bg-white rounded-card border border-line p-8">
                <LandingPanel onSelectType={handleSelectType} />
              </div>
            ) : (
              <ResultPanel
                prompts={prompts}
                isGenerating={isGenerating}
                onModify={onModify}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
