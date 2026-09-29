import type { Metadata } from 'next';
import { MediaPromptPage } from '@/components/shared/MediaPromptPage';

export const metadata: Metadata = {
  title: '画像生成AI向けプロンプト作成 | DIA',
  description: 'Midjourney・Stable Diffusion などの画像生成AI向けプロンプトを、選択肢からブラウザ内で3案作成します。入力内容は送信しません。',
  alternates: { canonical: '/image' },
};

export default function ImagePromptPage() {
  return <MediaPromptPage kind="image" />;
}
