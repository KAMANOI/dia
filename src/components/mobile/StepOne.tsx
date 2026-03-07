'use client';

import React from 'react';
import type { ArtifactType } from '@/types';
import { ARTIFACT_TYPES } from '@/types';
import { Button } from '@/components/ui';

interface StepOneProps {
  selected: ArtifactType;
  onSelect: (type: ArtifactType) => void;
  onNext: () => void;
}

const ARTIFACT_ICONS: Record<ArtifactType, React.ReactNode> = {
  '文章作成': <PenIcon />,
  '要約': <ListIcon />,
  'アイデア出し': <BulbIcon />,
  '企画書': <ChartIcon />,
  'SNS投稿': <ShareIcon />,
  'コード生成': <CodeIcon />,
  'コード修正依頼': <WrenchIcon />,
  'デザイン指示': <PaletteIcon />,
  '画像生成指示': <ImageIcon />,
  'リサーチ依頼': <SearchIcon />,
};

export function StepOne({ selected, onSelect, onNext }: StepOneProps) {
  return (
    <div className="flex flex-col h-full">
      {/* スクロール領域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
        {/* ヘッダーコピー */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-ink">何を作りますか？</h2>
          <p className="text-sm text-ink-muted mt-1">
            用途を選ぶと、最適なプロンプト構造を作ります。
          </p>
        </div>

        {/* タイプグリッド */}
        <div className="grid grid-cols-2 gap-2.5">
          {ARTIFACT_TYPES.map((type) => {
            const isSelected = selected === type;
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={[
                  'flex flex-col items-start gap-3 p-4 rounded-card border text-left',
                  'transition-all duration-150 active:scale-[0.97]',
                  isSelected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-line bg-white hover:border-ink/20',
                ].join(' ')}
              >
                {/* アイコン */}
                <span
                  className={[
                    'p-2 rounded-[8px] transition-colors',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-[#F7F7F7] text-ink-muted',
                  ].join(' ')}
                >
                  {ARTIFACT_ICONS[type]}
                </span>
                {/* ラベル */}
                <span
                  className={[
                    'text-sm font-medium leading-tight',
                    isSelected ? 'text-primary' : 'text-ink',
                  ].join(' ')}
                >
                  {type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 下部固定CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line px-4 pt-3 pb-safe">
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          次へ
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   アイコン群
   ============================================================ */
function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
