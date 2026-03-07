import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================================
      // ブランドカラーパレット
      // ============================================================
      colors: {
        // テキスト
        ink: {
          DEFAULT: '#111111',
          muted: '#666666',
        },
        // ボーダー・区切り
        line: '#E5E5E5',
        // アクセント（CTA・選択状態）
        primary: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          subtle: '#EEF2FF', // ホバー背景・選択背景
        },
        // セキュリティレベルカラー
        security: {
          1: '#10B981', // 公開向け
          2: '#F59E0B', // 配慮あり
          3: '#EF4444', // 秘匿優先
        },
      },

      // ============================================================
      // フォントファミリー（next/font の CSS 変数を参照）
      // ============================================================
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-jp)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // ============================================================
      // ボーダー半径
      // ============================================================
      borderRadius: {
        card: '12px',
        btn: '10px',
        input: '10px',
      },

      // ============================================================
      // シャドウ（最小限）
      // ============================================================
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06)',
        dropdown: '0 4px 16px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
