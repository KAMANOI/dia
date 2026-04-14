import type { Metadata } from 'next';
import { GuideLayout } from '@/components/shared/GuideLayout';

export const metadata: Metadata = {
  title: 'AI初心者が最初につまずきやすいポイントと対処法 | DIA',
  description: 'AIを使い始めたばかりの人がよくつまずく場面と、その対処法をわかりやすく解説します。',
};

export default function Guide5Page() {
  return (
    <GuideLayout title="AI初心者が最初につまずきやすいポイントと対処法">
      <p>
        AIを使い始めたばかりのとき、多くの人が似たところでつまずきます。
      </p>

      <h2>よくあるつまずきパターン</h2>

      <h3>指示が短すぎる</h3>
      <p>
        思っていることをAIが当然わかってくれる前提で入力すると、
        期待と違う結果になりやすくなります。
      </p>

      <h3>条件を詰め込みすぎる</h3>
      <p>
        情報が多すぎると、何を優先すべきかが曖昧になり、出力が散らばることがあります。
      </p>

      <h3>1回で完成品を出そうとしすぎる</h3>
      <p>
        AIは一発で仕上げる道具というより、試行錯誤を速くする道具として使う方が
        相性が良い場面が多くあります。
      </p>

      <h2>対処法</h2>
      <ul>
        <li>目的を先に書く</li>
        <li>読者や対象を明確にする</li>
        <li>条件を3〜5個程度に整理する</li>
        <li>出力後に少しずつ修正する</li>
      </ul>
      <p>
        この流れにするだけでも、かなり使いやすくなります。
      </p>
    </GuideLayout>
  );
}
