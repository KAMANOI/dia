'use client';

import type { ArtifactType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { safeTrim } from '@/utils/safeTrim';

interface StepThreeProps {
  description: string;
  artifactType: ArtifactType;
  onChange: (value: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PLACEHOLDERS: Partial<Record<ArtifactType, string>> = {
  '文章作成':
    '新しいコーヒーショップのブランドコンセプトを考えたい。ターゲットは20〜30代のビジネスパーソン。',
  '要約':
    '先週の全社会議の内容を要約したい。決定事項とアクションを中心に5分で読める分量で。',
  'アイデア出し':
    '社内コミュニケーションを活性化させるアイデアが欲しい。低コストですぐ実行できるものを中心に。',
  '企画書':
    'オンライン英語学習サービスの事業企画書を作りたい。ターゲットはビジネスパーソン、月額制サブスク。',
  'SNS投稿':
    '新製品のローンチ告知をInstagramとXに投稿したい。購入ページへの誘導も含めて。',
  'コード生成':
    'PythonでCSVを読み込み、特定の列でフィルタリングしてJSON形式で保存するスクリプトを作りたい。',
  'コード修正依頼':
    'ReactのuseEffectで無限ループが起きている。依存配列の問題だと思うが原因と修正方法を教えてほしい。',
  'デザイン指示':
    '健康食品ブランドのLPをリデザインしたい。清潔感・信頼感を重視、30代女性向けのデザインに。',
  '画像生成指示':
    '都市の夜景を背景にした女性のポートレート。映画的でドラマチックな光、アート系の仕上がり。',
  'リサーチ依頼':
    '日本のD2C市場の現状と今後のトレンドを調査したい。成功事例と失敗パターンも含めてほしい。',
};

const DEFAULT_PLACEHOLDER =
  '新しいコーヒーショップのブランドコンセプトを考えたい。\nターゲットは20〜30代のビジネスパーソン。';

export function StepThree({
  description,
  artifactType,
  onChange,
  onBack,
  onGenerate,
  isGenerating,
}: StepThreeProps) {
  const canGenerate = safeTrim(description).length > 0;
  const placeholder = PLACEHOLDERS[artifactType] ?? DEFAULT_PLACEHOLDER;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-36">
        {/* ヘッダー */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-ink">作りたい内容</h2>
          <p className="text-sm text-ink-muted mt-1">日本語で簡単に書いてください。</p>
        </div>

        {/* テキストエリア */}
        <Textarea
          value={description}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          showCount
          className="text-base leading-relaxed"
        />

        {/* ヒント */}
        <div className="mt-4 space-y-1.5">
          {[
            'ターゲット（誰向けか）を書くと精度が上がります',
            '目的・ゴールを具体的に書いてください',
            '文体・トーンの希望があれば加えてください',
          ].map((hint) => (
            <div key={hint} className="flex items-start gap-2 text-xs text-ink-muted">
              <span className="mt-0.5 w-1 h-1 rounded-full bg-line flex-shrink-0" />
              {hint}
            </div>
          ))}
        </div>
      </div>

      {/* 下部固定CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line px-4 pt-3 pb-safe">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={onBack}
            disabled={isGenerating}
            className="flex-none px-5"
          >
            戻る
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
          >
            {isGenerating ? '生成中...' : 'プロンプトを生成'}
          </Button>
        </div>
      </div>
    </div>
  );
}
