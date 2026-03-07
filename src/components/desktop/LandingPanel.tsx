'use client';

import type { ArtifactType } from '@/types';

interface LandingPanelProps {
  onSelectType: (type: ArtifactType) => void;
}

const HOW_TO = [
  { step: 1, title: '成果物タイプを選ぶ', desc: '文章・コード・企画書など用途を選択します' },
  { step: 2, title: '日本語で内容を書く', desc: '作りたい内容を日本語でざっくり書くだけです' },
  { step: 3, title: 'プロンプトをコピーして使う', desc: '標準・簡潔・高精度の3案が生成されます' },
];

const FEATURED_TYPES: ArtifactType[] = [
  '文章作成',
  '企画書',
  'SNS投稿',
  'コード生成',
  'コード修正依頼',
  'デザイン指示',
  '画像生成指示',
  'リサーチ依頼',
  'アイデア出し',
  '要約',
];

export function LandingPanel({ onSelectType }: LandingPanelProps) {
  return (
    <div className="space-y-10 animate-fade-in">

      {/* ブランド説明 */}
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">
          DIA
        </h2>
        <p className="text-base font-medium text-ink mb-1.5">
          日本語から、AIの指示へ。
        </p>
        <p className="text-sm text-ink-muted leading-relaxed">
          作りたい内容を左のパネルに日本語で入力するだけで、<br />
          AIにそのまま使えるプロンプトを生成します。
        </p>
      </div>

      {/* 使い方 */}
      <section>
        <h3 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase mb-4">
          使い方
        </h3>
        <div className="space-y-4">
          {HOW_TO.map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-subtle text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 用途から始める */}
      <section>
        <h3 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase mb-3">
          こんな用途に使えます
        </h3>
        <div className="flex flex-wrap gap-2">
          {FEATURED_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className="px-3.5 py-2 rounded-full border border-line bg-white text-sm text-ink hover:border-primary hover:text-primary hover:bg-primary-subtle transition-all duration-150 active:scale-[0.97]"
            >
              {type}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2.5">
          ← タイプをクリックすると左パネルに反映されます
        </p>
      </section>

      {/* Safety note */}
      <p className="text-xs text-ink-muted/60">
        AIへの送信は行いません。コピペ用プロンプトを生成します。
      </p>

    </div>
  );
}
