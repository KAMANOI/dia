'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { Footer } from './Footer';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { buildMediaPrompts, clean, initialMediaInput, IMAGE_TOOLS, VIDEO_TOOLS, STYLES, MOODS, LIGHTING, COMPOSITION, CAMERAS, MOTIONS, RATIOS, type MediaKind, type MediaInput, type MediaVariant } from '@/utils/mediaPromptBuilder';

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void }) {
  return <label className="block space-y-1.5 text-sm font-medium text-ink">
    <span>{label}</span>
    <select className="block w-full rounded-input border border-line bg-white px-3 py-2.5 focus:border-primary" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
    </select>
  </label>;
}

export function MediaPromptPage({ kind }: { kind: MediaKind }) {
  const [input, setInput] = useState(() => initialMediaInput(kind));
  const [variants, setVariants] = useState<MediaVariant[]>([]);
  const [status, setStatus] = useState('');
  const isVideo = kind === 'video';
  const tools = isVideo ? VIDEO_TOOLS : IMAGE_TOOLS;
  const update = (field: keyof MediaInput, value: string) => {
    setInput(previous => ({ ...previous, [field]: value }));
    setVariants([]);
    setStatus('');
  };
  const optionalSelect = (label: string, field: keyof MediaInput, options: readonly (readonly [string, string])[]) => (
    <Select label={label} value={input[field]} options={[[ '', '指定なし' ], ...options]} onChange={value => update(field, value)} />
  );
  const canBuild = Boolean(clean(input.subject) || (isVideo && clean(input.scene)));
  return <div className="min-h-screen bg-[var(--color-surface)]">
    <header className="border-b border-line bg-white">
      <nav aria-label="メインナビゲーション" className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-5 text-sm">
        <Link href="/" className="mr-auto text-xl font-bold">DIA</Link>
        <Link href="/image" aria-current={!isVideo ? 'page' : undefined} className={!isVideo ? 'font-bold text-primary' : ''}>画像</Link>
        <Link href="/video" aria-current={isVideo ? 'page' : undefined} className={isVideo ? 'font-bold text-primary' : ''}>動画</Link>
      </nav>
    </header>
    <main className="mx-auto max-w-5xl space-y-7 px-5 py-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-ink">{isVideo ? '動画' : '画像'}生成プロンプト</h1>
        <p className="text-sm text-ink-muted">選択内容からブラウザ内で3案を組み立てます。入力内容の送信やAIの呼び出しは行いません。画像・動画そのものは生成しません。</p>
        <p className="text-sm text-ink-muted">選択肢は英語の定型句に変換します。自由入力は翻訳せずそのまま使います。英語のプロンプトにしたい場合は英語で入力してください。</p>
      </div>
      <form className="space-y-5 rounded-card border border-line bg-white p-5 sm:p-7" onSubmit={event => {
        event.preventDefault();
        const nextVariants = buildMediaPrompts(input);
        setVariants(nextVariants);
        setStatus(nextVariants.length ? `${nextVariants.length}案を作成しました` : `作成できる内容がありません。${isVideo ? '被写体またはシーン' : '被写体・シーン'}を入力してください。`);
      }}>
        <Select label="使用するツール" value={input.tool} options={tools} onChange={value => update('tool', value)} />
        <Textarea label={isVideo ? '被写体（被写体またはシーンを入力）' : '被写体・シーン（必須）'} value={input.subject} onChange={e => update('subject', e.target.value)} rows={3} maxLength={1500} placeholder="例: a small café beside a quiet river" />
        {isVideo && <>
          <Textarea label="シーン・場所" value={input.scene} onChange={e => update('scene', e.target.value)} rows={2} maxLength={1500} />
          <Input label="被写体の動作" value={input.action} onChange={e => update('action', e.target.value)} maxLength={500} placeholder="例: leaves drift across the water" />
        </>}
        <div className="grid gap-4 sm:grid-cols-2">
          {optionalSelect('スタイル', 'style', STYLES)}
          {optionalSelect('雰囲気', 'mood', MOODS)}
          {optionalSelect('照明', 'lighting', LIGHTING)}
          {!isVideo && optionalSelect('構図', 'composition', COMPOSITION)}
          {isVideo && <>
            <Select label="カメラの動き" value={input.camera} options={CAMERAS} onChange={value => update('camera', value)} />
            <Select label="動きの表現" value={input.motion} options={MOTIONS} onChange={value => update('motion', value)} />
            <Select label="動画の長さ" value={input.duration} options={[[ 'auto', 'ツール側で指定' ], ...['3', '5', '6', '8', '10'].map(v => [v, `${v}秒`] as const)]} onChange={value => update('duration', value)} />
          </>}
          <Select label="画面比率" value={input.ratio} options={RATIOS.map(v => [v, v])} onChange={value => update('ratio', value)} />
          {!isVideo && input.tool === 'midjourney' && optionalSelect('バージョン指定', 'version', [[ '6.1', '6.1' ], [ '6', '6' ]])}
        </div>
        <Textarea label="追加の詳細" value={input.details} onChange={e => update('details', e.target.value)} rows={2} maxLength={1500} />
        {!isVideo && <Input label="避けたい要素" value={input.negative} onChange={e => update('negative', e.target.value)} maxLength={500} hint="タグ形式のツールは別のネガティブ欄、Midjourney系は --no、その他は文章に反映します。" />}
        <p className="text-xs text-ink-muted">ツールやモデルによって対応する比率・バージョン・長さは異なります。利用先の設定に合わせて調整してください。</p>
        <Button type="submit" disabled={!canBuild} fullWidth>プロンプトを3案作成</Button>
        {!canBuild && <p className="text-xs text-ink-muted">{isVideo ? '被写体またはシーン' : '被写体・シーン'}を入力すると作成できます。</p>}
      </form>
      <p role="status" className="text-sm text-ink-muted empty:sr-only">{status}</p>
      <section aria-label="作成したプロンプト" className="space-y-5">
        {variants.map(variant => <article key={variant.name} aria-labelledby={`${kind}-${variant.name}`} className="space-y-4 rounded-card border border-line bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><h2 id={`${kind}-${variant.name}`} className="text-lg font-semibold">{variant.name}</h2><CopyButton text={variant.prompt} label={`${variant.name}のプロンプトをコピー`} /></div>
          <p className="text-xs text-ink-muted">{variant.name === 'Standard' ? '標準：選択内容を中心に構成' : variant.name === 'Creative' ? '創作：奥行きや表現の工夫を追加' : '詳細：質感や整合性の指示を追加'}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{variant.prompt}</p>
          {variant.negative && <div className="space-y-2 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">ネガティブプロンプト</h3><CopyButton text={variant.negative} label={`${variant.name}のネガティブプロンプトをコピー`} /></div>
            <p className="break-words text-sm">{variant.negative}</p>
          </div>}
          {variant.settings && <p className="text-xs text-ink-muted">{variant.settings}</p>}
        </article>)}
      </section>
    </main>
    <Footer />
  </div>;
}
