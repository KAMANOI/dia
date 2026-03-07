'use client';

const STEPS = [
  '入力内容を整理しています',
  '意図と条件を分析しています',
  'プロンプトを組み立てています',
  '3パターンを仕上げています',
];

interface GeneratingViewProps {
  progressStep: number;       // 0–3
  isSlowConnection: boolean;
  compact?: boolean;          // true: 横幅が狭いコンテキスト向け
}

export function GeneratingView({
  progressStep,
  isSlowConnection,
  compact = false,
}: GeneratingViewProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${compact ? 'py-8' : 'py-16'}`}>
      <GeneratingDots />

      <div className="space-y-2 text-center">
        {STEPS.map((step, i) => {
          const isDone = i < progressStep;
          const isCurrent = i === progressStep;
          return (
            <p
              key={step}
              className={[
                'text-sm transition-all duration-400',
                isCurrent
                  ? 'text-ink font-medium opacity-100'
                  : isDone
                  ? 'text-ink-muted opacity-50'
                  : 'text-ink-muted opacity-20',
              ].join(' ')}
            >
              {isDone && (
                <span className="mr-1.5 text-primary text-xs">✓</span>
              )}
              {step}
            </p>
          );
        })}
      </div>

      {isSlowConnection && (
        <p className="text-xs text-ink-muted text-center max-w-[220px] leading-relaxed animate-fade-in">
          少し時間がかかっています。
          <br />
          通信状況によっては数秒かかることがあります。
        </p>
      )}
    </div>
  );
}

function GeneratingDots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/40"
          style={{ animation: `dia-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}
