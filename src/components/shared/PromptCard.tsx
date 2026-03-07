'use client';

import { CopyButton } from './CopyButton';
import type { PromptVariant } from '@/types';

interface PromptCardProps {
  variant: PromptVariant;
  content: string;
}

const VARIANT_META: Record<
  PromptVariant,
  { label: string; description: string; badgeClass: string }
> = {
  standard: {
    label: '標準',
    description: 'バランス型 — 役割・指示・出力要件を整理',
    badgeClass: 'bg-[#EEF2FF] text-primary',
  },
  concise: {
    label: '簡潔',
    description: '短め — 最小限の指示に圧縮',
    badgeClass: 'bg-[#F0F9FF] text-[#0369A1]',
  },
  precise: {
    label: '高精度',
    description: '詳細型 — 役割・制約・出力形式を完全記述',
    badgeClass: 'bg-[#F5F3FF] text-[#6D28D9]',
  },
};

export function PromptCard({ variant, content }: PromptCardProps) {
  const meta = VARIANT_META[variant];

  return (
    <div className="rounded-card border border-line bg-white overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-[#FAFAFA]">
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <span className="text-xs text-ink-muted hidden sm:inline">{meta.description}</span>
        </div>
        <CopyButton text={content} />
      </div>

      {/* 本文 */}
      <div className="p-4">
        <pre className="text-sm text-ink whitespace-pre-wrap leading-relaxed font-sans break-words">
          {content}
        </pre>
      </div>
    </div>
  );
}
