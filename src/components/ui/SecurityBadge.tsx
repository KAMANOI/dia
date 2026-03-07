import type { SecurityLevel } from '@/types';

interface SecurityBadgeProps {
  level: SecurityLevel;
  /** sm: ドット+ラベルのみ / md: ドット+ラベル+説明 */
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const LEVEL_CONFIG: Record<
  SecurityLevel,
  { dot: string; bg: string; text: string; label: string; desc: string }
> = {
  level1: {
    dot: 'bg-security-1',
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#065F46]',
    label: '公開向け',
    desc: '固有名詞などをそのまま使います',
  },
  level2: {
    dot: 'bg-security-2',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#78350F]',
    label: '配慮あり',
    desc: '具体情報を少し一般化します',
  },
  level3: {
    dot: 'bg-security-3',
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#7F1D1D]',
    label: '秘匿優先',
    desc: '機密情報を抽象化します',
  },
};

export function SecurityBadge({
  level,
  size = 'sm',
  showLabel = true,
}: SecurityBadgeProps) {
  const cfg = LEVEL_CONFIG[level];

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {showLabel && cfg.label}
      </span>
    );
  }

  // md size: カード選択肢として使う場合
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div>
        <div className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</div>
        <div className="text-xs text-ink-muted mt-0.5">{cfg.desc}</div>
      </div>
    </div>
  );
}

/** セキュリティレベルの色だけ返すユーティリティ */
export function getSecurityColor(level: SecurityLevel): string {
  return LEVEL_CONFIG[level].dot.replace('bg-', 'bg-security-');
}
