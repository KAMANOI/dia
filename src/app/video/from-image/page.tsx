import type { Metadata } from 'next';
import { ImageToVideoPage } from '@/components/shared/ImageToVideoPage';

export const metadata: Metadata = {
  title: '画像1枚から動画用プロンプトを起こす | DIA',
  description: '画像1枚を読み解いてカットごとの動画用プロンプトに起こすための指示文を、ブラウザ内で作成します。Seedance・Veo・Runway などに対応。画像は送信しません。',
  alternates: { canonical: '/video/from-image' },
};

export default function ImageToVideoRoute() {
  return <ImageToVideoPage />;
}
