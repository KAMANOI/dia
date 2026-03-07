import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

/* ============================================================
   フォント設定（next/font で最適化ロード）
   ============================================================ */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
});

/* ============================================================
   メタデータ
   ============================================================ */
const SITE_URL = 'https://dia-wheat.vercel.app';

export const metadata: Metadata = {
  title: 'DIA – 日本語からAIの指示へ',
  description:
    '日本語入力からAI用プロンプトを生成。ChatGPT・Claude・Geminiにそのまま使えるコピペ用プロンプトを作成できます。',
  keywords: ['AI', 'プロンプト', 'ChatGPT', 'Claude', 'Gemini', 'AIツール', 'プロンプト生成', 'AIプロンプト'],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'DIA – 日本語からAIの指示へ',
    description: '日本語入力からAI用プロンプトを生成するツール',
    url: SITE_URL,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIA – 日本語からAIの指示へ',
    description: '日本語入力からAI用プロンプトを生成するツール',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
