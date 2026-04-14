import type { Metadata } from 'next';
import { GuideLayout } from '@/components/shared/GuideLayout';

export const metadata: Metadata = {
  title: '文章生成AIを使うときに意識したいプロンプト設計 | DIA',
  description: '文章生成AIで安定した出力を得るためのプロンプト設計の考え方を解説します。',
};

export default function Guide3Page() {
  return (
    <GuideLayout title="文章生成AIを使うときに意識したいプロンプト設計">
      <p>
        文章生成AIを使うときは、いきなり完成文を求めるより、
        まず構成や方向性を整える方がうまくいきます。
      </p>

      <h2>依頼の順番</h2>
      <p>たとえば、以下の順で依頼すると結果が安定しやすくなります。</p>
      <ul>
        <li>テーマを伝える</li>
        <li>読者層を伝える</li>
        <li>文体を指定する</li>
        <li>見出し構成を作らせる</li>
        <li>その後に本文を書かせる</li>
      </ul>
      <p>
        このように段階を分けると、意図とズレた文章が出にくくなります。
      </p>

      <h2>下書きとして使う</h2>
      <p>
        また、最初から厳密な完成品を期待するよりも、
        下書き、たたき台、構成案として使う方が実用的です。
      </p>
      <p>
        AIは発想の補助や整理に向いています。
        人が最後に整える前提で使うと、作業効率が上がりやすくなります。
      </p>
    </GuideLayout>
  );
}
