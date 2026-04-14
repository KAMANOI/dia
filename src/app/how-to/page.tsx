import type { Metadata } from 'next';
import { GuideLayout } from '@/components/shared/GuideLayout';

export const metadata: Metadata = {
  title: 'DIAの使い方 | DIA',
  description: 'DIAの基本的な使い方とコツを解説します。AIプロンプトを簡単に生成するための手順をステップごとに説明します。',
};

export default function HowToPage() {
  return (
    <GuideLayout title="DIAの使い方">
      <p>
        DIAは、AIに渡すためのプロンプトを整理して作るためのツールです。
      </p>

      <h2>基本的な流れ</h2>

      <h3>1. 用途を決める</h3>
      <p>
        文章生成、画像生成、SNS投稿など、まず目的を整理します。
      </p>

      <h3>2. 条件を入力する</h3>
      <p>
        テーマ、雰囲気、文字数、ターゲットなど、必要な条件をできるだけ具体的に入れます。
      </p>

      <h3>3. 生成結果を確認する</h3>
      <p>
        出力されたプロンプトをそのまま使うだけでなく、不要な部分を削ったり、条件を足したりして調整します。
      </p>

      <h3>4. AIサービスに貼り付ける</h3>
      <p>
        ChatGPTなどの生成AIに貼り付けて利用します。
      </p>

      <h2>うまく使うコツ</h2>
      <ul>
        <li>条件は抽象的すぎない方が安定します</li>
        <li>誰向けか、何をしたいかを入れると精度が上がります</li>
        <li>一回で完璧を狙うより、少しずつ調整する方が結果が良くなります</li>
      </ul>
    </GuideLayout>
  );
}
