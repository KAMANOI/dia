import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // DEBUG: 本番バンドルにソースマップを含める
  // エラーの実ファイル・行番号を追跡するための一時設定
  // 原因特定後は削除すること（バンドルサイズが増加する）
  productionBrowserSourceMaps: true,
};

export default nextConfig;
