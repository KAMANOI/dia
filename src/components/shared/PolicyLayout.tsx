import Link from 'next/link';
import { Footer } from './Footer';

interface PolicyLayoutProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function PolicyLayout({ title, updatedAt, children }: PolicyLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight text-ink">
            DIA
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-ink transition-colors"
          >
            ← アプリに戻る
          </Link>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-ink mb-1">{title}</h1>
        <p className="text-xs text-ink-muted mb-10">最終更新: {updatedAt}</p>
        <div className="prose-dia">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
