'use client';

import { useState, useCallback, useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHistory } from '@/hooks/useHistory';
import { buildPrompts } from '@/utils/promptBuilder';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { DesktopLayout } from '@/components/desktop/DesktopLayout';
import { HistoryPanel } from '@/components/shared/HistoryPanel';
import type { PromptInput, GeneratedPrompts, PromptVariant, PromptModifier, HistoryItem } from '@/types';
import type { StartOption } from '@/components/mobile/StepZero';

const DEFAULT_INPUT: PromptInput = {
  artifactType: '文章作成',
  securityLevel: 'level2',
  markdownLevel: 'md1',
  targetAI: 'general',
  description: '',
};

export default function Home() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { history, addHistory, removeHistory, clearHistory } = useHistory();

  // 生成回数カウンター（インタースティシャル広告の挿入判定に使用）
  // TODO: generationCount が一定値（例: 5回ごと）に達した際に
  //       インタースティシャル広告またはアップセル訴求を表示できる
  //       例: if (generationCount.current % 5 === 0) triggerInterstitial();
  const generationCount = useRef(0);

  // モバイル: 0=Landing, 1=タイプ選択, 2=概要入力, 3=生成結果
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<PromptInput>(DEFAULT_INPUT);
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<PromptVariant>('standard');
  const [showHistory, setShowHistory] = useState(false);

  const handleInputChange = useCallback((updates: Partial<PromptInput>) => {
    setInput((prev) => ({ ...prev, ...updates }));
  }, []);

  // Landing → フロー開始
  // option なし: Step 1 (タイプ選択) へ
  // option.artifactType / description あり: input に反映して Step 2 へ
  const handleStart = useCallback((option?: StartOption) => {
    if (option?.artifactType || option?.description) {
      setInput((prev) => ({
        ...prev,
        ...(option.artifactType ? { artifactType: option.artifactType } : {}),
        ...(option.description !== undefined ? { description: option.description } : {}),
      }));
      if (!isDesktop) setStep(2);
    } else {
      if (!isDesktop) setStep(1);
    }
  }, [isDesktop]);

  const handleGenerate = useCallback(async (modifier?: PromptModifier | null) => {
    if (!input.description.trim()) return;
    setIsGenerating(true);
    generationCount.current += 1;
    // UX: 生成感を演出する短いウェイト
    await new Promise((resolve) => setTimeout(resolve, 700));
    const generated = buildPrompts(input, modifier);
    setPrompts(generated);
    addHistory({ input, prompts: generated, modifier });
    setActiveTab('standard');
    if (!isDesktop) setStep(3);
    setIsGenerating(false);
  }, [input, isDesktop, addHistory]);

  const handleModify = useCallback((modifier: PromptModifier) => {
    handleGenerate(modifier);
  }, [handleGenerate]);

  const handleLoadHistory = useCallback(
    (item: HistoryItem) => {
      setInput(item.input);
      setPrompts(item.prompts);
      setActiveTab('standard');
      if (!isDesktop) setStep(3);
      setShowHistory(false);
    },
    [isDesktop]
  );

  // 新しく作る: ランディングは省略して Step 1 へ（既知ユーザー）
  const handleNew = useCallback(() => {
    setStep(1);
    setInput(DEFAULT_INPUT);
    setPrompts(null);
  }, []);

  const handleNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 3));
  }, []);

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  return (
    <>
      {isDesktop ? (
        <DesktopLayout
          input={input}
          prompts={prompts}
          isGenerating={isGenerating}
          onInputChange={handleInputChange}
          onGenerate={handleGenerate}
          onModify={handleModify}
          onOpenHistory={() => setShowHistory(true)}
        />
      ) : (
        <MobileLayout
          step={step}
          input={input}
          prompts={prompts}
          activeTab={activeTab}
          isGenerating={isGenerating}
          history={history}
          onInputChange={handleInputChange}
          onTabChange={setActiveTab}
          onGenerate={handleGenerate}
          onModify={handleModify}
          onStart={handleStart}
          onNext={handleNext}
          onBack={handleBack}
          onNew={handleNew}
          onOpenHistory={() => setShowHistory(true)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          history={history}
          onLoad={handleLoadHistory}
          onDelete={removeHistory}
          onClearAll={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}
