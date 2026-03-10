'use client';

// ============================================================
// AdSlot — Google AdSense 広告スロットコンポーネント
//
// 使い方:
//   <AdSlot variant="inline" />
//
// 新しい広告位置を追加する手順:
//   1. AdVariant に新しいキーを追加
//   2. SLOT_CONFIG に slotId・minHeight を追加
//   3. AdSense 管理画面で対応する広告ユニットを作成し slotId に設定
// ============================================================

import { useEffect } from 'react';

// ── AdSense 設定 ─────────────────────────────────────────────
// TODO: AdSense 管理画面の Publisher ID に置き換えてください
const AD_CLIENT = 'ca-pub-9131163948248205';

export type AdVariant = 'inline' | 'history' | 'footer';

interface SlotConfig {
  /** AdSense 広告ユニット ID（管理画面で取得） */
  slotId: string;
  /** CLS 防止用の最小高さ（広告ロード前のスペース確保） */
  minHeight: number;
}

// バリアントごとの設定
// TODO: AdSense 管理画面で各広告ユニットを作成し、slotId を置き換えてください
const SLOT_CONFIG: Record<AdVariant, SlotConfig> = {
  inline:  { slotId: '9112546878', minHeight: 90 },
  history: { slotId: 'ZZZZZZZZ', minHeight: 72 },
  footer:  { slotId: 'WWWWWWWW', minHeight: 90 },
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdSlotProps {
  variant: AdVariant;
  className?: string;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function AdSlot({ variant, className = '' }: AdSlotProps) {
  useEffect(() => {
    if (!IS_PRODUCTION) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // adsbygoogle がロードされていない場合は無視
    }
  }, []);

  // 開発環境ではプレースホルダーを表示して広告位置を確認できるようにする
  if (!IS_PRODUCTION) {
    const { minHeight } = SLOT_CONFIG[variant];
    return (
      <div
        role="complementary"
        aria-label="広告"
        style={{ minHeight }}
        className={[
          'w-full rounded-card border border-dashed border-line bg-[#FAFAFA]',
          'flex items-center justify-center',
          className,
        ].join(' ')}
      >
        <span className="text-[11px] text-ink-muted/40 select-none tracking-wide">
          広告（開発環境）
        </span>
      </div>
    );
  }

  const { slotId, minHeight } = SLOT_CONFIG[variant];

  return (
    // minHeight でスペースを事前確保し、広告ロード前後の CLS を防ぐ
    <div
      role="complementary"
      aria-label="広告"
      style={{ minHeight }}
      className={['w-full overflow-hidden', className].join(' ')}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
