import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* ナビゲーション */}
        <div className="flex flex-col sm:flex-row gap-6 mb-5">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-ink-muted mb-1">使い方・ガイド</p>
            <Link href="/how-to" className="text-xs text-ink-muted hover:text-ink transition-colors">DIAの使い方</Link>
            <Link href="/guide-1" className="text-xs text-ink-muted hover:text-ink transition-colors">AIプロンプトとは何か</Link>
            <Link href="/guide-2" className="text-xs text-ink-muted hover:text-ink transition-colors">出力が安定しない理由</Link>
            <Link href="/guide-3" className="text-xs text-ink-muted hover:text-ink transition-colors">文章生成AIのプロンプト設計</Link>
            <Link href="/guide-4" className="text-xs text-ink-muted hover:text-ink transition-colors">画像生成AIのプロンプト</Link>
            <Link href="/guide-5" className="text-xs text-ink-muted hover:text-ink transition-colors">初心者のつまずきポイント</Link>
          </div>
        </div>

        {/* コピーライト・法的リンク */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-muted">
            © 2026 DIA &nbsp;|&nbsp; 運営者: Hiroki Kamanoi
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
      </div>
    </footer>
  );
}
