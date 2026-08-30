import type { NextConfig } from 'next';

// 全ページ・全APIに付けるセキュリティヘッダ（docs/SECURITY_DESIGN.md §5）。
// HSTS は Vercel が付与するためここでは扱わない。CSP は AdSense と next/font の
// 棚卸しが終わってから Report-Only で入れる（未実施）。
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
