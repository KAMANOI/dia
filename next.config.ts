import type { NextConfig } from 'next';

// 全ページ・全APIに付けるセキュリティヘッダ（docs/SECURITY_DESIGN.md §5）。
// HSTS は Vercel が付与するためここでは扱わない。

// CSP は Report-Only（計測段階・ブロックしない）。AdSense は Google がドメイン allowlist 方式の CSP を公式にサポートしない（nonce＋strict-dynamic のみ）ため、強制への本命は middleware で nonce を配る構成。現ポリシーは広告の frame/img/connect を計測対象にしている（許可していない）＝このままでは強制不可。根拠の設計書は非公開（公開リポには置かない方針）。
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
