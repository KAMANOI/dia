import type { NextConfig } from 'next';

// 全ページ・全APIに付けるセキュリティヘッダ（docs/SECURITY_DESIGN.md §5）。
// HSTS は Vercel が付与するためここでは扱わない。

// CSP は Report-Only（計測段階・ブロックしない）。違反が広告由来のみに収束し、そのホストを許可し切れたら Content-Security-Policy（強制）へ切り替える。棚卸しの根拠は docs/SECURITY_DESIGN.md §5。
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // AdSense の計測に影響しないよう他製品と同じ既定にする（同一オリジンには Referer が残る）
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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
