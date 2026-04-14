import type { Metadata } from 'next';
import { GuideLayout } from '@/components/shared/GuideLayout';

export const metadata: Metadata = {
  title: '画像生成AIで使えるプロンプトの考え方 | DIA',
  description: '画像生成AIで思い通りの画像を作るためのプロンプトの組み立て方を解説します。',
};

export default function Guide4Page() {
  return (
    <GuideLayout title="画像生成AIで使えるプロンプトの考え方">
      <p>
        画像生成AIでは、見た目の要素を言語でどう整理するかが重要です。
      </p>

      <h2>要素を分けて考える</h2>
      <p>たとえば、以下のような要素を分けて考えると、指示が組み立てやすくなります。</p>
      <ul>
        <li>被写体</li>
        <li>背景</li>
        <li>時代感</li>
        <li>光の向きや強さ</li>
        <li>色の傾向</li>
        <li>構図</li>
        <li>質感</li>
        <li>雰囲気</li>
      </ul>
      <p>
        一度に全部を詰め込むと不安定になることもあるため、
        まず主題を決めて、そのあとで補足条件を足していく方法が有効です。
      </p>

      <h2>優先順位が重要</h2>
      <p>
        また、参考にしたい方向性がある場合でも、
        単語を並べるだけでなく、何を中心に見せたいのかを明確にすると結果が整いやすくなります。
      </p>
      <p>
        画像生成のプロンプトは、情報量の多さよりも、
        優先順位の付け方で完成度が変わります。
      </p>
    </GuideLayout>
  );
}
