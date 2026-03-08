'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadHistory, saveHistory } from '@/utils/storage';
import type { HistoryItem, PromptInput, GeneratedPrompts, PromptModifier } from '@/types';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // クライアントサイドでのみ読み込む
  useEffect(() => {
    const items = loadHistory();
    // DEBUG: 読み込んだ履歴の内容を確認（e.trim エラー追跡用）
    console.log('[DIA:history] loaded count:', items.length);
    items.forEach((item, i) => {
      console.log(`[DIA:history] item[${i}]`, {
        id: item.id,
        descType: typeof item.input?.description,
        desc: String(item.input?.description ?? 'MISSING').slice(0, 30),
        artifactType: item.input?.artifactType,
      });
    });
    setHistory(items);
  }, []);

  const addHistory = useCallback(
    (data: { input: PromptInput; prompts: GeneratedPrompts; modifier?: PromptModifier | null }) => {
      const item: HistoryItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        input: data.input,
        prompts: data.prompts,
        modifier: data.modifier,
      };
      setHistory((prev) => {
        const updated = [item, ...prev];
        // setState updater を純粋に保つため、localStorage への書き込みを
        // マクロタスクとして後回しにする（結果表示をブロックしない）
        setTimeout(() => {
          try { saveHistory(updated); } catch { /* quota 超過などを無視 */ }
        }, 0);
        return updated;
      });
    },
    []
  );

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      setTimeout(() => {
        try { saveHistory(updated); } catch { /* non-fatal */ }
      }, 0);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addHistory, removeHistory, clearHistory };
}
