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
const SITE_TITLE = 'DIA — 日本語からAIプロンプトを生成';
const SITE_DESCRIPTION =
  '日本語で書くだけでAIに最適なプロンプトを生成。ChatGPT・Claude対応のプロンプトジェネレーター。';
const OG_IMAGE = `${SITE_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    'AIプロンプト生成',
    'prompt generator',
    'ChatGPT prompt',
    'Claude prompt',
    'AI tool',
    'プロンプト生成',
    'AIツール',
    'ChatGPT',
    'Claude',
    'Gemini',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DIA – 日本語からAIプロンプト生成ツール',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/* ============================================================
   構造化データ（SoftwareApplication schema）
   ============================================================ */
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DIA',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  inLanguage: 'ja',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* Google AdSense — production のみロード。<head> への配置が Google 必須要件 */}
        {process.env.NODE_ENV === 'production' && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9131163948248205"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans`}>
        {children}
        {/* 構造化データ (SoftwareApplication) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
