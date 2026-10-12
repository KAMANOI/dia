import type { Metadata } from 'next';
import { MediaPromptPage } from '@/components/shared/MediaPromptPage';

export const metadata: Metadata = {
  title: '動画生成AI向けプロンプト作成 | DIA',
  description: 'Kling・Runway・Luma などの動画生成AI向けプロンプトを、選択肢からブラウザ内で3案作成します。入力内容は送信しません。',
  alternates: { canonical: '/video' },
  openGraph: { type: 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630 }], url: '/video', title: '動画生成AI向けプロンプト作成 | DIA', description: 'Kling・Runway・Luma などの動画生成AI向けプロンプトを、選択肢からブラウザ内で3案作成します。入力内容は送信しません。' },
  twitter: { card: 'summary_large_image', title: '動画生成AI向けプロンプト作成 | DIA', description: 'Kling・Runway・Luma などの動画生成AI向けプロンプトを、選択肢からブラウザ内で3案作成します。入力内容は送信しません。', images: ['/opengraph-image'] },
};

export default function VideoPromptPage() {
  return <MediaPromptPage kind="video" />;
}
