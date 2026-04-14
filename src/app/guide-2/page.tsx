import type { Metadata } from 'next';
import { GuideLayout } from '@/components/shared/GuideLayout';

export const metadata: Metadata = {
  title: 'AIの出力が安定しない理由。プロンプト改善の基本 | DIA',
  description: 'AIの出力がぶれる原因と、プロンプトを改善するための具体的な方法を解説します。',
};

export default function Guide2Page() {
  return (
    <GuideLayout title="AIの出力が安定しない理由。プロンプト改善の基本">
      <p>
        AIを使っていて、毎回出力がぶれると感じることがあります。
        その原因の多くは、AIそのものではなく、指示の曖昧さにあります。
      </p>
      <p>たとえば、</p>
      <ul>
        <li>誰向けに書くのか</li>
        <li>どのくらいの長さにしたいのか</li>
        <li>どんな雰囲気にしたいのか</li>
        <li>何を優先したいのか</li>
      </ul>
      <p>
        こうした条件が抜けていると、AIは広い解釈をしてしまいます。
      </p>

      <h2>改善の基本</h2>
      <p>
        改善の基本は、条件を増やすことではなく、重要な条件を整理することです。
        特に有効なのは以下です。
      </p>
      <ul>
        <li>目的を最初に書く</li>
        <li>読者や対象を明確にする</li>
        <li>文体やトーンを指定する</li>
        <li>出力形式を指定する</li>
        <li>入れてほしい要素、避けたい要素を書く</li>
      </ul>
      <p>
        プロンプトは長ければ良いわけではありません。
        必要な条件が整理されていることの方が重要です。
      </p>
    </GuideLayout>
  );
}
