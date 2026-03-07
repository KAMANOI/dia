'use client';

import { Fragment } from 'react';
import type { HistoryItem, PromptVariant } from '@/types';
import { SecurityBadge } from '@/components/ui/SecurityBadge';
import { AdSlot } from '@/components/ads';

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onClearAll,
  onClose,
}: HistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* パネル */}
      <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col border-l border-line shadow-dropdown">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-base font-semibold text-ink">履歴</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              過去に作ったプロンプト
              <span className="ml-1 text-ink-muted">（{history.length}件）</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-[#EF4444] hover:bg-[#FEF2F2] px-2.5 py-1.5 rounded-btn transition-colors"
              >
                全削除
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-btn hover:bg-[#F7F7F7] transition-colors text-ink-muted"
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* リスト */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-ink-muted">
              <EmptyIcon />
              <p className="text-sm">まだ履歴がありません</p>
            </div>
          ) : (
            <ul className="p-4 flex flex-col gap-2.5">
              {history.map((item, index) => (
                <Fragment key={item.id}>
                  <HistoryCard
                    item={item}
                    onLoad={() => onLoad(item)}
                    onDelete={() => onDelete(item.id)}
                  />
                  {index === 1 && history.length >= 3 && (
                    <li aria-hidden="true">
                      <AdSlot variant="history" />
                    </li>
                  )}
                </Fragment>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   履歴カード
   ============================================================ */
const VARIANT_LABELS: Record<PromptVariant, string> = {
  standard: '標準',
  concise: '簡潔',
  precise: '高精度',
};

function HistoryCard({
  item,
  onLoad,
  onDelete,
}: {
  item: HistoryItem;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const d = new Date(item.createdAt);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const preview =
    item.input.description.length > 55
      ? item.input.description.slice(0, 55) + '…'
      : item.input.description;

  return (
    <li className="rounded-card border border-line bg-white overflow-hidden hover:border-ink/20 transition-colors">
      {/* クリックでロード */}
      <button onClick={onLoad} className="w-full text-left px-4 py-3.5 block">
        {/* 上段: タイプバッジ + 日時 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold bg-primary-subtle text-primary px-2 py-0.5 rounded-full">
            {item.input.artifactType}
          </span>
          <span className="text-xs text-ink-muted flex-shrink-0">{dateStr}</span>
        </div>

        {/* 概要プレビュー */}
        <p className="text-sm text-ink leading-snug">{preview}</p>

        {/* オプションバッジ群 */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <SecurityBadge level={item.input.securityLevel} size="sm" />
          <span className="text-xs text-ink-muted bg-[#F7F7F7] border border-line px-2 py-0.5 rounded-full">
            {item.input.markdownLevel.toUpperCase()}
          </span>
          {item.input.targetAI !== 'none' && (
            <span className="text-xs text-ink-muted bg-[#F7F7F7] border border-line px-2 py-0.5 rounded-full">
              {item.input.targetAI === 'chatgpt' ? 'GPT'
                : item.input.targetAI === 'claude' ? 'Claude'
                : item.input.targetAI === 'gemini' ? 'Gemini'
                : '汎用'}
            </span>
          )}
        </div>

        {/* 生成済みバリアント */}
        <div className="flex gap-1 mt-2">
          {(Object.keys(item.prompts) as PromptVariant[]).map((v) => (
            <span
              key={v}
              className="text-xs text-ink-muted border border-line px-1.5 py-0.5 rounded bg-white"
            >
              {VARIANT_LABELS[v]}
            </span>
          ))}
        </div>
      </button>

      {/* 削除ボタン */}
      <div className="border-t border-line px-4 py-2 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-xs text-[#EF4444] hover:bg-[#FEF2F2] px-2.5 py-1.5 rounded-btn transition-colors flex items-center gap-1"
        >
          <TrashIcon />
          削除
        </button>
      </div>
    </li>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function EmptyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
