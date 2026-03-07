import type { Metadata } from 'next';
import { PolicyLayout } from '@/components/shared/PolicyLayout';

export const metadata: Metadata = {
  title: 'お問い合わせ | DIA',
  description: 'DIA へのお問い合わせ方法です。',
};

export default function ContactPage() {
  return (
    <PolicyLayout title="お問い合わせ" updatedAt="2025年3月">
      <p>
        DIA に関するご意見・ご要望・不具合報告は、以下の方法でご連絡ください。
      </p>

      <h2>GitHub Issues（推奨）</h2>
      <p>
        バグ報告・機能リクエストは GitHub の Issues をご利用ください。
      </p>
      <p>
        <a
          href="https://github.com/KAMANOI/dia/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/KAMANOI/dia/issues
        </a>
      </p>

      <h2>対応について</h2>
      <p>
        個人開発のため、すべてのお問い合わせへの返答をお約束することはできません。
        いただいたフィードバックはサービス改善の参考にさせていただきます。
      </p>

      <h2>よくある質問</h2>
      <p>
        <strong>入力した内容はAIに送られますか？</strong>
        <br />
        いいえ。本サービスはプロンプトをブラウザ内で生成するだけです。
        入力内容が外部サーバーやAIサービスに自動送信されることはありません。
      </p>
      <p>
        <strong>生成履歴はどこに保存されますか？</strong>
        <br />
        お使いの端末のブラウザ（ローカルストレージ）のみに保存されます。
        外部サーバーへの送信は行いません。
      </p>
      <p>
        <strong>無料で使えますか？</strong>
        <br />
        はい、現在は完全無料でご利用いただけます。
        将来的に広告が表示される場合があります。
      </p>
    </PolicyLayout>
  );
}
