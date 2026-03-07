'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadHistory, saveHistory } from '@/utils/storage';
import type { HistoryItem, PromptInput, GeneratedPrompts, PromptModifier } from '@/types';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // クライアントサイドでのみ読み込む
  useEffect(() => {
    setHistory(loadHistory());
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
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const removeHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addHistory, removeHistory, clearHistory };
}
