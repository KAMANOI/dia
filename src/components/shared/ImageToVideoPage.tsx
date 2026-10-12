'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { Footer } from './Footer';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { buildImageToVideoInstruction, defaultDuration, dominantColors, I2V_MODELS, modelById, readExifFocal, type ImageFacts } from '@/utils/imageToVideoBuilder';

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void }) {
  return <label className="block space-y-1.5 text-sm font-medium text-ink">
    <span>{label}</span>
    <select className="block w-full rounded-input border border-line bg-white px-3 py-2.5 focus:border-primary" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
    </select>
  </label>;
}

// Everything happens on this device: the file is read into memory, measured, and dropped.
async function readImage(file: File): Promise<ImageFacts> {
  const exif = readExifFocal(await file.slice(0, 256 * 1024).arrayBuffer()); // EXIF sits at the start of a JPEG
  const bitmap = await createImageBitmap(file); // applies EXIF orientation, so width/height are as displayed
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 48;
    const context = canvas.getContext('2d');
    context?.drawImage(bitmap, 0, 0, 48, 48);
    const colors = context ? dominantColors(context.getImageData(0, 0, 48, 48).data) : [];
    return { width: bitmap.width, height: bitmap.height, colors, ...exif };
  } finally {
    bitmap.close();
  }
}

export function ImageToVideoPage() {
  const [model, setModel] = useState<string>(I2V_MODELS[0].id);
  const [generateSec, setGenerateSec] = useState(defaultDuration(I2V_MODELS[0].id));
  const [cuts, setCuts] = useState('3');
  const [ratio, setRatio] = useState('auto');
  const [intent, setIntent] = useState('');
  const [facts, setFacts] = useState<ImageFacts | null>(null);
  const [imageStatus, setImageStatus] = useState('');
  const [reading, setReading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const readSeq = useRef(0); // ignore a slow first image if the user already picked another
  const reset = () => { setPrompt(''); setResultStatus(''); };
  return <div className="min-h-screen bg-[var(--color-surface)]">
    <header className="border-b border-line bg-white">
      <nav aria-label="メインナビゲーション" className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-5 text-sm">
        <Link href="/" className="mr-auto text-xl font-bold">DIA</Link>
        <Link href="/image">画像</Link>
        <Link href="/video">動画</Link>
        <Link href="/video/from-image" aria-current="page" className="font-bold text-primary">画像→動画</Link>
      </nav>
    </header>
    <main className="mx-auto max-w-5xl space-y-7 px-5 py-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-ink">画像1枚から動画用プロンプトを起こす</h1>
        <p className="text-sm text-ink-muted">DIAが作るのは「画像を読み解いて、カットごとの動画用プロンプトに起こしてもらうための指示文」です。コピーして、同じ画像と一緒にお使いのChatGPTやClaudeに貼ってください。</p>
        <p className="text-sm text-ink-muted">画像はこの端末の中でだけ読み、縦横・主な色・撮影時の焦点距離を指示文に書き込みます。画像や入力内容の送信、AIの呼び出しは行いません。</p>
      </div>
      <form className="space-y-5 rounded-card border border-line bg-white p-5 sm:p-7" onSubmit={event => {
        event.preventDefault();
        setPrompt(buildImageToVideoInstruction({ model, generateSec, cuts: Number(cuts), ratio, intent, facts }));
        setResultStatus('指示文を作りました。下のコピーボタンでコピーできます。');
      }}>
        <label className="block space-y-1.5 text-sm font-medium text-ink">
          <span>画像（DIAでの読み取りは任意。貼り付け先のAIには画像を必ず添付）</span>
          <input type="file" accept="image/*" className="block w-full text-sm" onChange={async event => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            const seq = ++readSeq.current;
            reset();
            setFacts(null);
            if (!file) { setReading(false); return setImageStatus(''); }
            setReading(true);
            setImageStatus('読み取り中…');
            try {
              const next = await readImage(file);
              if (seq !== readSeq.current) return;
              setFacts(next);
              reset();
              setImageStatus(`読み取りました: ${next.width}×${next.height}px${next.focal35 || next.focalLength ? `・焦点距離 ${next.focal35 ? `${next.focal35}mm（35mm判換算）` : `${next.focalLength}mm`}` : '・撮影情報なし'}`);
            } catch {
              if (seq !== readSeq.current) return;
              setImageStatus('この端末では画像を読み取れませんでした。画像の情報なしで指示文を作れます（貼り付け先のAIが画像から判断します）。');
            } finally {
              if (seq === readSeq.current) { setReading(false); input.value = ''; }
            }
          }} />
        </label>
        <p role="status" className="text-xs text-ink-muted empty:hidden">{imageStatus}</p>
        {facts && facts.colors.length > 0 && <div className="flex flex-wrap gap-2" aria-label="主な色">
          {facts.colors.map((c, i) => <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 text-xs text-ink-muted"><span className="h-4 w-4 rounded border border-line" style={{ background: c }} />{c}</span>)}
        </div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="使う動画生成AI" value={model} options={I2V_MODELS.map(m => [m.id, m.label] as const)} onChange={value => { setModel(value); setGenerateSec(defaultDuration(value)); reset(); }} />
          <Select label="1カットあたり生成する秒数" value={String(generateSec)} options={modelById(model).durations.map(d => [String(d), `${d}秒`] as const)} onChange={value => { setGenerateSec(Number(value)); reset(); }} />
          <Select label="カット数" value={cuts} options={['1', '2', '3', '4', '5', '6'].map(v => [v, `${v}カット`] as const)} onChange={value => { setCuts(value); reset(); }} />
          <Select label="画面比率" value={ratio} options={[['auto', '画像に合わせる'], ...['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'].map(v => [v, v] as const)]} onChange={value => { setRatio(value); reset(); }} />
        </div>
        <Textarea label="作りたい動画（任意）" value={intent} onChange={e => { setIntent(e.target.value); reset(); }} rows={3} maxLength={1500} placeholder="例: 朝の静けさから、人が通り過ぎて店が開くまで。最後は看板に寄って終わる" />
        <p className="text-xs text-ink-muted">1カットを長めに生成し、動画編集アプリで良い区間だけ切り出してつなぐ前提で、使う区間とカット表まで出させます。各AIの生成できる長さは2026年10月時点の公式資料に基づきます。iPhoneの写真（HEIC）は撮影情報を読めないことがあります。</p>
        <Button type="submit" disabled={reading} fullWidth>指示文を作る</Button>
        <p role="status" className="text-sm text-ink-muted empty:hidden">{resultStatus}</p>
      </form>
      {prompt && <section aria-labelledby="i2v-result" className="space-y-4 rounded-card border border-line bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3"><h2 id="i2v-result" className="text-lg font-semibold">指示文</h2><CopyButton text={prompt} label="指示文をコピー" /></div>
        <p className="text-xs text-ink-muted">ChatGPTやClaudeに、同じ画像を添付してこの指示文を貼ってください。</p>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{prompt}</pre>
      </section>}
    </main>
    <Footer />
  </div>;
}
