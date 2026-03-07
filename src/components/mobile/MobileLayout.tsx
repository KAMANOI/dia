'use client';

import type { PromptInput, GeneratedPrompts, PromptVariant, PromptModifier, HistoryItem } from '@/types';
import { StepZero } from './StepZero';
import type { StartOption } from './StepZero';
import { StepOne } from './StepOne';
import { StepTwo } from './StepTwo';
import { StepFour } from './StepFour';

interface MobileLayoutProps {
  step: number;
  input: PromptInput;
  prompts: GeneratedPrompts | null;
  activeTab: PromptVariant;
  isGenerating: boolean;
  progressStep: number;
  isSlowConnection: boolean;
  generationError: string | null;
  history: HistoryItem[];
  onInputChange: (updates: Partial<PromptInput>) => void;
  onTabChange: (tab: PromptVariant) => void;
  onGenerate: () => void;
  onModify: (modifier: PromptModifier) => void;
  onRetry: () => void;
  onStart: (option?: StartOption) => void;
  onNext: () => void;
  onBack: () => void;
  onNew: () => void;
  onOpenHistory: () => void;
}

const STEP_LABELS = ['成果物タイプ', '概要入力', '生成結果'];

export function MobileLayout({
  step,
  input,
  prompts,
  activeTab,
  isGenerating,
  progressStep,
  isSlowConnection,
  generationError,
  history,
  onInputChange,
  onTabChange,
  onGenerate,
  onModify,
  onRetry,
  onStart,
  onNext,
  onBack,
  onNew,
  onOpenHistory,
}: MobileLayoutProps) {
  // Step 0: Landing — 専用コンポーネントが独自ヘッダーを持つ
  if (step === 0) {
    return (
      <StepZero
        history={history}
        onStart={onStart}
        onOpenHistory={onOpenHistory}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white border-b border-line pt-safe">
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <span className="text-lg font-bold tracking-tight text-ink">DIA</span>
            <span className="text-xs text-ink-muted ml-2">日本語から、AIの指示へ。</span>
          </div>
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-btn hover:bg-[#F7F7F7] transition-colors"
            aria-label="履歴"
          >
            <ClockIcon />
          </button>
        </div>

        {/* ステップインジケーター */}
        <StepIndicator current={step} labels={STEP_LABELS} />
      </header>

      {/* コンテンツ */}
      <main className="flex-1 overflow-hidden">
        {step === 1 && (
          <StepOne
            selected={input.artifactType}
            onSelect={(type) => onInputChange({ artifactType: type })}
            onNext={onNext}
          />
        )}
        {step === 2 && (
          <StepTwo
            description={input.description}
            artifactType={input.artifactType}
            securityLevel={input.securityLevel}
            markdownLevel={input.markdownLevel}
            targetAI={input.targetAI}
            onDescriptionChange={(value) => onInputChange({ description: value })}
            onSecurityChange={(level) => onInputChange({ securityLevel: level })}
            onMarkdownChange={(level) => onInputChange({ markdownLevel: level })}
            onTargetAIChange={(ai) => onInputChange({ targetAI: ai })}
            onBack={onBack}
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            progressStep={progressStep}
            isSlowConnection={isSlowConnection}
            generationError={generationError}
            onRetry={onRetry}
          />
        )}
        {step === 3 && prompts && (
          <StepFour
            prompts={prompts}
            activeTab={activeTab}
            isGenerating={isGenerating}
            onTabChange={onTabChange}
            onModify={onModify}
            onBack={onBack}
            onNew={onNew}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   ステップインジケーター（Step 1–3 用）
   ============================================================ */
function StepIndicator({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  const total = labels.length;
  return (
    <div className="px-4 pb-3">
      {/* プログレスバー */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-0.5 flex-1 rounded-full transition-all duration-300',
              i < current ? 'bg-primary' : 'bg-line',
            ].join(' ')}
          />
        ))}
      </div>
      {/* テキスト */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">
          {current} / {total}
        </span>
        <span className="text-xs text-ink-muted">{labels[current - 1]}</span>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666666"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
