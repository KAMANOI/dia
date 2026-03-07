'use client';

// ============================================================
// AdSlot — 広告プレースホルダーコンポーネント
//
// 使い方:
//   <AdSlot variant="inline" />
//
// 本番広告への差し替え方:
//   1. ADS_ENABLED を true のまま維持
//   2. PlaceholderAd を AdSense / AdMob 等の実コードに置換
//   例: Google AdSense
//     <ins className="adsbygoogle"
//          data-ad-client="ca-pub-XXXXXXXX"
//          data-ad-slot="YYYYYYYY"
//          data-ad-format="auto"
//          data-full-width-responsive="true" />
// ============================================================

export type AdVariant = 'inline' | 'history' | 'footer';

interface AdSlotProps {
  variant: AdVariant;
  className?: string;
}

// 広告表示の有効/無効を切り替えるフラグ
// false にすると全広告スロットが非表示になる
const ADS_ENABLED = true;

// バリアントごとのサイズ設定
const SLOT_CONFIG: Record<AdVariant, { minHeight: string }> = {
  inline:  { minHeight: 'min-h-[90px]' },
  history: { minHeight: 'min-h-[72px]' },
  footer:  { minHeight: 'min-h-[90px]' },
};

export function AdSlot({ variant, className = '' }: AdSlotProps) {
  if (!ADS_ENABLED) return null;

  const { minHeight } = SLOT_CONFIG[variant];

  return (
    // TODO: 本番実装時はこの div の中身を実際の広告 SDK コードに差し替える
    <div
      role="complementary"
      aria-label="広告"
      className={[
        'w-full rounded-card border border-dashed border-line bg-[#FAFAFA]',
        'flex items-center justify-center',
        minHeight,
        className,
      ].join(' ')}
    >
      <span className="text-[11px] text-ink-muted/40 select-none tracking-wide">
        広告
      </span>
    </div>
  );
}
