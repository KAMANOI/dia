// Next.js 16 で `next lint` が廃止され ESLint CLI 直接実行（`npm run lint` = `eslint .`）に移行した。
// eslint-config-next@16 は flat config を既定にしたため、FlatCompat 経由の extends は動かない
// （"Converting circular structure to JSON" で落ちる）。公式推奨の subpath import に切り替えた。
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  // `next lint` が暗黙に除外していたビルド生成物。flat config の既定除外は node_modules のみ。
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  // eslint-config-next@16 が新設した rule。既存の3箇所（src/app/page.tsx・
  // src/hooks/useHistory.ts・src/hooks/useMediaQuery.ts）は localStorage / matchMedia を
  // マウント後に読む SSR ハイドレーション対策の意図的なパターンで、書き換えると
  // 挙動が変わる。自動テストが無いため、この依存更新では warn に留めて可視化だけ残す
  // （useSyncExternalStore への書き換えは別タスク）。
  { rules: { 'react-hooks/set-state-in-effect': 'warn' } },
];

export default eslintConfig;
