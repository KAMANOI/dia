import type { MetadataRoute } from 'next';

const SITE_URL = 'https://dia.hdr-ai.com';

// lastModified は各ページの最終コミット日（デプロイ時刻にしない）。ページを直したら日付も更新する。
const PAGES: [path: string, lastModified: string, priority: number][] = [
  ['', '2026-09-29', 1.0],
  ['/how-to', '2026-09-03', 0.8],
  ['/image', '2026-09-29', 0.7],
  ['/video', '2026-09-29', 0.7],
  ['/guide-1', '2026-04-24', 0.6],
  ['/guide-2', '2026-04-24', 0.6],
  ['/guide-3', '2026-04-24', 0.6],
  ['/guide-4', '2026-04-24', 0.6],
  ['/guide-5', '2026-04-24', 0.6],
  ['/about', '2026-09-03', 0.5],
  ['/contact', '2026-09-03', 0.3],
  ['/privacy', '2026-09-03', 0.3],
  ['/terms', '2026-09-03', 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([path, lastModified, priority]) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
  }));
}
