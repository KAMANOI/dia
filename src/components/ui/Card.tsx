import React from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
  /** クリック可能なカード */
  onClick?: () => void;
  /** 選択状態（ボーダーをアクセントカラーに） */
  selected?: boolean;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  onClick,
  selected = false,
}: CardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={[
        'rounded-card border bg-white transition-all duration-150',
        selected ? 'border-primary' : 'border-line',
        onClick
          ? 'text-left w-full cursor-pointer hover:border-ink/20 active:scale-[0.99]'
          : '',
        PADDING_CLASSES[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

/** カード内のセクション区切り */
export function CardDivider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-line ${className}`} />;
}
