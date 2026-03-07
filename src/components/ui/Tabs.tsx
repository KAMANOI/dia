'use client';

interface Tab {
  key: string;
  label: string;
  sub?: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  /** underline: ボーダー下線スタイル / pill: 塗りつぶしスタイル */
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex gap-1 bg-[#F7F7F7] rounded-card p-1 ${className}`}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={[
                'flex-1 flex flex-col items-center py-2.5 px-2 rounded-[8px]',
                'transition-all duration-200 select-none',
                isActive
                  ? 'bg-white shadow-card text-ink'
                  : 'text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
              {tab.sub && (
                <span className="text-xs text-ink-muted mt-0.5">{tab.sub}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // underline variant（デフォルト）
  return (
    <div className={`flex border-b border-line ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium',
              'border-b-2 -mb-px transition-colors duration-150 select-none',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
            {tab.sub && (
              <span className="text-xs text-ink-muted ml-1.5">{tab.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
