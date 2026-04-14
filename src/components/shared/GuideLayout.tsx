import Link from 'next/link';
import { Footer } from './Footer';
import { AdSlot } from '@/components/ads';

interface GuideLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function GuideLayout({ title, description, children }: GuideLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight text-ink">
            DIA
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/how-to" className="text-sm text-ink-muted hover:text-ink transition-colors">
              使い方
            </Link>
            <Link href="/guide-1" className="text-sm text-ink-muted hover:text-ink transition-colors">
              記事一覧
            </Link>
            <Link href="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
              ← ツールへ
            </Link>
          </nav>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-ink mb-3">{title}</h1>
        {description && (
          <p className="text-sm text-ink-muted mb-8 leading-relaxed">{description}</p>
        )}
        <div className="prose-dia">{children}</div>

        {/* 広告: 記事コンテンツ末尾のみ */}
        <div className="mt-12">
          <AdSlot variant="inline" />
        </div>

        {/* 関連リンク */}
        <div className="mt-10 pt-8 border-t border-line">
          <p className="text-xs font-semibold text-ink-muted mb-3">関連ガイド</p>
          <nav className="flex flex-col gap-2">
            <Link href="/how-to" className="text-sm text-primary hover:underline">DIAの使い方</Link>
            <Link href="/guide-1" className="text-sm text-ink-muted hover:text-ink transition-colors">AIプロンプトとは何か</Link>
            <Link href="/guide-2" className="text-sm text-ink-muted hover:text-ink transition-colors">出力が安定しない理由と改善策</Link>
            <Link href="/guide-3" className="text-sm text-ink-muted hover:text-ink transition-colors">文章生成AIのプロンプト設計</Link>
            <Link href="/guide-4" className="text-sm text-ink-muted hover:text-ink transition-colors">画像生成AIのプロンプトの考え方</Link>
            <Link href="/guide-5" className="text-sm text-ink-muted hover:text-ink transition-colors">初心者がつまずきやすいポイント</Link>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
}
