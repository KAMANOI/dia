'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHistory } from '@/hooks/useHistory';
import { buildPrompts, normalizeInput } from '@/utils/promptBuilder';
import { expandIntent } from '@/utils/intentExpander';
import type { ExpandedIntent } from '@/utils/intentExpander';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { DesktopLayout } from '@/components/desktop/DesktopLayout';
import { HistoryPanel } from '@/components/shared/HistoryPanel';
import type { PromptInput, GeneratedPrompts, PromptVariant, PromptModifier, HistoryItem, ArtifactType } from '@/types';
import type { StartOption } from '@/components/mobile/StepZero';
import { safeTrim } from '@/utils/safeTrim';

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
  const [progressStep, setProgressStep] = useState(0);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PromptVariant>('standard');
  const [showHistory, setShowHistory] = useState(false);
  // expandIntent キャッシュ: modifier 再生成時に expandIntent を再実行しないために使用
  // description / artifactType が変わった場合のみ再計算する
  const cachedIntentRef = useRef<{
    description: string;
    artifactType: ArtifactType;
    intent: ExpandedIntent;
  } | null>(null);

  // 生成が長引いた場合(>2.5s)に低速接続メッセージを表示
  useEffect(() => {
    if (!isGenerating) {
      setIsSlowConnection(false);
      return;
    }
    const timer = setTimeout(() => setIsSlowConnection(true), 2500);
    return () => clearTimeout(timer);
  }, [isGenerating]);

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
    if (!safeTrim(input.description)) return;

    setIsGenerating(true);
    setProgressStep(0);
    setGenerationError(null);
    generationCount.current += 1;

    // ── Phase 1: 実処理（同期）──
    let generated: GeneratedPrompts;
    try {
      const normalized = normalizeInput(input.description);

      const cached = cachedIntentRef.current;
      const canReuse =
        modifier != null &&
        cached != null &&
        cached.description === input.description &&
        cached.artifactType === input.artifactType;

      const intent = canReuse
        ? cached.intent
        : expandIntent(input.artifactType, normalized);

      if (!canReuse) {
        cachedIntentRef.current = {
          description: input.description,
          artifactType: input.artifactType,
          intent,
        };
      }

      generated = buildPrompts(input, modifier, intent);
    } catch (computeErr) {
      setGenerationError(
        computeErr instanceof Error
          ? computeErr.message
          : '生成中にエラーが発生しました。再試行してください。'
      );
      setIsGenerating(false);
      return;
    }

    // ── Phase 2: UXアニメーション ──
    const STEP_DELAYS = modifier
      ? [200, 175, 175, 150]
      : [300, 250, 250, 200];

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      setGenerationError('少し時間がかかりすぎています。もう一度試してください。');
      setIsGenerating(false);
    }, 12000);

    try {
      const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

      await delay(STEP_DELAYS[0]);
      if (timedOut) return;
      setProgressStep(1);

      await delay(STEP_DELAYS[1]);
      if (timedOut) return;
      setProgressStep(2);

      await delay(STEP_DELAYS[2]);
      if (timedOut) return;
      setProgressStep(3);

      await delay(STEP_DELAYS[3]);
      if (timedOut) return;

      setPrompts(generated);
      addHistory({ input, prompts: generated, modifier });
      setActiveTab('standard');
      if (!isDesktop) setStep(3);

    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : '生成中にエラーが発生しました。再試行してください。'
      );
    } finally {
      clearTimeout(timeoutId);
      if (!timedOut) setIsGenerating(false);
    }
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
          progressStep={progressStep}
          isSlowConnection={isSlowConnection}
          generationError={generationError}
          onInputChange={handleInputChange}
          onGenerate={handleGenerate}
          onModify={handleModify}
          onRetry={() => handleGenerate()}
          onOpenHistory={() => setShowHistory(true)}
        />
      ) : (
        <MobileLayout
          step={step}
          input={input}
          prompts={prompts}
          activeTab={activeTab}
          isGenerating={isGenerating}
          progressStep={progressStep}
          isSlowConnection={isSlowConnection}
          generationError={generationError}
          history={history}
          onInputChange={handleInputChange}
          onTabChange={setActiveTab}
          onGenerate={handleGenerate}
          onModify={handleModify}
          onRetry={() => handleGenerate()}
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
