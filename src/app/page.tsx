import { HomeClient } from '@/components/HomeClient';

// ツール本体はクライアント描画。JavaScript を実行しない AI クローラ向けに、説明文をサーバー側で描画する。
export default function Home() {
  return (
    <>
      <HomeClient />
      <section
        aria-label="DIAについて"
        className="mx-auto max-w-2xl px-5 py-10 text-xs leading-relaxed text-gray-500"
      >
        <h2 className="mb-2 text-sm font-semibold text-gray-600">DIAとは</h2>
        <p>
          DIA（ダイア）は、日本語で書いた情報から、ChatGPT・Claude・Gemini・Midjourney などの生成AIにそのまま渡せるプロンプトを作る無料のWebツールです。標準・簡潔・高精度の3案を同時に出します。
        </p>
        <p className="mt-2">
          プロンプトの生成はすべてブラウザ内で完結し、入力した内容は外部サーバーへ送信されません。アカウント登録も決済も不要です。履歴は自分のブラウザにだけ残り、アプリ内の「全削除」でいつでも消せます。運営者は Hiroki Kamanoi（釜野井 弘規）、HDR（Human Driven Reality）の公開製品のひとつです。
        </p>
      </section>
    </>
  );
}
