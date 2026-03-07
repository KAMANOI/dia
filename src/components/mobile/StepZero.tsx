'use client';

import Link from 'next/link';
import type { ArtifactType, HistoryItem } from '@/types';
import { ARTIFACT_TYPES } from '@/types';
import { Button } from '@/components/ui/Button';

export type StartOption = {
  artifactType?: ArtifactType;
  description?: string;
};

interface StepZeroProps {
  history: HistoryItem[];
  onStart: (option?: StartOption) => void;
  onOpenHistory: () => void;
}

const EXAMPLES: { text: string; type: ArtifactType }[] = [
  {
    text: '新しいカフェのブランドコンセプトを考えたい。ターゲットは20〜30代のビジネスパーソン。',
    type: '文章作成',
  },
  {
    text: 'ReactのuseEffectで無限ループが起きている。原因と修正方法を教えてほしい。',
    type: 'コード修正依頼',
  },
  {
    text: '新製品のローンチをInstagramとXに投稿したい。購入ページへの誘導も含めて。',
    type: 'SNS投稿',
  },
  {
    text: 'オンライン英語学習サービスの事業企画書を作りたい。月額制サブスク。',
    type: '企画書',
  },
];

const HOW_TO = [
  { num: 1, text: '作りたいものを選ぶ' },
  { num: 2, text: '日本語で内容を書く' },
  { num: 3, text: 'プロンプトをコピーして使う' },
];

export function StepZero({ history, onStart, onOpenHistory }: StepZeroProps) {
  const hasHistory = history.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 pt-safe pb-3">
        <span className="text-base font-bold tracking-tight text-ink">DIA</span>
        <button
          onClick={onOpenHistory}
          className="p-2 rounded-btn hover:bg-[#F7F7F7] transition-colors"
          aria-label="履歴"
        >
          <ClockIcon />
        </button>
      </div>

      {/* スクロール領域 */}
      <div className="flex-1 overflow-y-auto px-5 pb-12">

        {/* Hero */}
        <div className="pt-8 pb-9">
          <h1 className="text-[2.75rem] font-bold tracking-tight text-ink leading-none mb-2.5">
            DIA
          </h1>
          <p className="text-lg font-medium text-ink mb-3 leading-snug">
            日本語から、AIの指示へ。
          </p>
          <p className="text-sm text-ink-muted leading-relaxed mb-7">
            作りたい内容を日本語で入力すると、<br />
            AIにそのまま使えるプロンプトを生成します。
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={() => onStart()}>
            はじめる
          </Button>
          <p className="text-[11px] text-ink-muted/50 text-center mt-3">
            AIへの送信は行いません。コピペ用プロンプトを生成します。
          </p>
        </div>

        {/* 何が作れますか */}
        <section className="mb-9">
          <h2 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase mb-3">
            何が作れますか？
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {ARTIFACT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => onStart({ artifactType: type })}
                className="flex-shrink-0 px-3.5 py-2 rounded-full border border-line bg-white text-sm text-ink hover:border-primary hover:text-primary hover:bg-primary-subtle transition-all duration-150 active:scale-[0.97] whitespace-nowrap"
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* 使い方 */}
        <section className="mb-9">
          <h2 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase mb-3">
            使い方
          </h2>
          <div className="space-y-3.5">
            {HOW_TO.map(({ num, text }) => (
              <div key={num} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-subtle text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {num}
                </span>
                <span className="text-sm text-ink">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 入力例 or 最近の生成 */}
        {hasHistory ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase">
                最近の生成
              </h2>
              <button
                onClick={onOpenHistory}
                className="text-xs text-primary font-medium"
              >
                すべて見る
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              {history.slice(0, 6).map((item) => {
                const preview =
                  item.input.description.length > 30
                    ? item.input.description.slice(0, 30) + '…'
                    : item.input.description;
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      onStart({
                        artifactType: item.input.artifactType,
                        description: item.input.description,
                      })
                    }
                    className="flex-shrink-0 flex flex-col items-start px-3.5 py-2.5 rounded-card border border-line bg-white hover:border-ink/20 transition-colors active:scale-[0.97] text-left w-40"
                  >
                    <span className="text-[10px] text-primary font-semibold mb-1">
                      {item.input.artifactType}
                    </span>
                    <span className="text-xs text-ink leading-snug">{preview}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold text-ink-muted tracking-widest uppercase mb-3">
              入力例
            </h2>
            <div className="space-y-2">
              {EXAMPLES.map(({ text, type }) => {
                const preview = text.length > 40 ? text.slice(0, 40) + '…' : text;
                return (
                  <button
                    key={text}
                    onClick={() => onStart({ artifactType: type, description: text })}
                    className="w-full flex items-start gap-3 px-4 py-3 rounded-card border border-line bg-white hover:border-ink/20 transition-colors active:scale-[0.97] text-left"
                  >
                    <span className="text-[11px] text-primary font-semibold flex-shrink-0 mt-0.5 leading-none">
                      {type}
                    </span>
                    <span className="text-xs text-ink leading-snug">{preview}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* フッターリンク */}
        <div className="flex items-center justify-center gap-4 pt-2 pb-4 border-t border-line mt-6">
          <Link href="/privacy" className="text-xs text-ink-muted hover:text-ink transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="text-xs text-ink-muted hover:text-ink transition-colors">
            利用規約
          </Link>
          <Link href="/contact" className="text-xs text-ink-muted hover:text-ink transition-colors">
            お問い合わせ
          </Link>
        </div>

      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666666"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
