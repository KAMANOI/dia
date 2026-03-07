import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-6xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} DIA
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="text-xs text-ink-muted hover:text-ink transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/terms" className="text-xs text-ink-muted hover:text-ink transition-colors">
            利用規約
          </Link>
          <Link href="/contact" className="text-xs text-ink-muted hover:text-ink transition-colors">
            お問い合わせ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
