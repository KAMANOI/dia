import type { MetadataRoute } from 'next';

// 公開ページはすべてクロール可（AI検索のbotも含む）。個別指定はしない＝既定で許可。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://dia.hdr-ai.com/sitemap.xml',
  };
}
