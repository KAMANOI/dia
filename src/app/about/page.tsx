import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'DIAについて | DIA',
  description: 'DIA（ダイア）は、日本語からAIプロンプトを生成するWebツールです。サービスの概要と運営者情報をご確認いただけます。',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold tracking-tight text-ink">
            DIA
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/how-to" className="text-sm text-ink-muted hover:text-ink transition-colors">使い方</Link>
            <Link href="/guide-1" className="text-sm text-ink-muted hover:text-ink transition-colors">記事一覧</Link>
            <Link href="/" className="text-sm text-ink-muted hover:text-ink transition-colors">← ツールへ</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-ink mb-8">DIAについて</h1>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-ink mb-4">DIAとは</h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-3">
            DIA（ダイア）は、日本語で書いた情報をもとに、
            ChatGPT・Claude・Gemini・Midjourneyなどの生成AIにそのまま渡せる
            プロンプト（指示文）を生成するWebツールです。
          </p>
          <p className="text-sm text-ink-muted leading-relaxed mb-3">
            生成AIを使いたいけれど「何を入力すればいいかわからない」「毎回プロンプトを考えるのが面倒」という方に向けて作られています。
            文章作成・画像生成・SNS投稿・ビジネス文書など、用途に合わせたプロンプトを日本語入力だけで生成できます。
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            すべての処理はブラウザ内で完結します。
            入力した内容は外部サーバーに送信されないため、機密性の高い業務内容も安心して入力できます。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-ink mb-4">主な機能</h2>
          <ul className="text-sm text-ink-muted leading-relaxed space-y-2">
            <li>• 日本語入力からAI用プロンプトを即時生成</li>
            <li>• 文章生成・画像生成・SNS投稿など用途別に最適化されたプロンプトを出力</li>
            <li>• 生成したプロンプトをワンクリックでコピー</li>
            <li>• 過去の生成履歴をブラウザに保存（外部送信なし）</li>
            <li>• スマートフォン・PC両対応のレスポンシブデザイン</li>
            <li>• 完全無料で利用可能</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-ink mb-4">対応しているAIサービス</h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-3">
            DIAが生成したプロンプトは、以下のAIサービスで利用できます。
          </p>
          <ul className="text-sm text-ink-muted leading-relaxed space-y-1">
            <li>• ChatGPT（OpenAI）</li>
            <li>• Claude（Anthropic）</li>
            <li>• Gemini（Google）</li>
            <li>• Midjourney（画像生成）</li>
            <li>• Stable Diffusion（画像生成）</li>
            <li>• DALL-E（画像生成）</li>
            <li>• Adobe Firefly（画像生成）</li>
            <li>• その他、プロンプト入力に対応した生成AIサービス全般</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-ink mb-4">運営者情報</h2>
          <dl className="text-sm text-ink-muted leading-relaxed space-y-2">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 font-medium text-ink">運営者</dt>
              <dd>Hiroki Kamanoi（釜野井 弘規）</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 font-medium text-ink">所在地</dt>
              <dd>日本</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 font-medium text-ink">連絡先</dt>
              <dd>
                <Link href="/contact" className="text-primary hover:underline">
                  お問い合わせフォーム
                </Link>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 font-medium text-ink">開始</dt>
              <dd>2025年</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-4">免責・広告について</h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-3">
            本サービスは無料で提供しており、一部のガイド・記事ページにGoogle AdSenseによる広告を表示しています。
            広告はGoogle AdSenseのプログラムポリシーに基づいて配信されます。
          </p>
          <p className="text-sm text-ink-muted leading-relaxed">
            本サービスが生成するプロンプトの品質・正確性について保証を行いません。
            生成されたプロンプトを利用したことによって生じた損害について、本サービスは責任を負いません。
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
