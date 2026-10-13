# DIA WORKLOG

## 2026-10-13 01:xx（非対話）画像1枚から動画用プロンプトを起こす指示文モード（branch feat/dia-image-to-video）
- 着手前確認：画像・動画プロンプトの復元（やること1）は 9/29 に完了済み・本番 /image /video 200 を実測。今回は新モードのみ
- 追加：`/video/from-image`（`src/utils/imageToVideoBuilder.ts`・`src/components/shared/ImageToVideoPage.tsx`）。画像はブラウザ内でだけ読む（縦横・主な色・EXIFの焦点距離）。AI・外部送信なし
- 対応モデルと1回の生成秒数は公式資料で確認（Seedance 2.0/2.5・Veo 3.1・Runway Gen-4.5・Hailuo 2.3・MiniMax H3）。Kling は公式値が読めず、Sora 2 はAPI廃止告知のため外した
- 画像の読み取りは KONTE のレイヤー区分（konte/src/constants.ts のキー）でJSON化＝JS描画モードでも使い回せる形
- 検証：check:i2v PASS・verify:no-ai 全PASS・tsc 0・lint 0 error・build 成功・実ブラウザ（スマホ幅）でCC0写真を読み込み→指示文作成、読込後の通信に POST なし
- 独立レビュー（typescript-reviewer）指摘：高1・中4を修正（選び直しの競合ほか）
- プレビュー https://dia-4oqakzkx4-kamanois-projects.vercel.app/video/from-image（Vercelログイン保護あり）。push・本番は代表のOK待ち

## 2026-10-02 23:xx（非対話実行）HDRドメインへのURL移行・AdSense準備：着手前チェックで停止
- 指示書「DIA — HDRドメインへのURL移行とAdSenseのサイト接続準備」の着手前チェック（Vercel CLIでHDR新ドメインの登録有無を確認）を実行。`vercel domains ls`＝`getaaru.app`（AARUのドメイン）の1件のみ。HDR新ドメイン（hdr-ai.com等）は未登録。
- Obsidian確認：同日00:2x のリサーチ部報告（`~/claude-bridge/outbox/hdr-domain/00_調査報告と計画書.md`）で「新ドメインを買うか」自体が代表判断待ちのまま未回答。本指示書の前提（購入済み・名称確定済み）は現状と一致しない。
- 指示書の明記どおり「HDRドメインが未登録のため未着手」で停止。やること1〜6（ドメイン追加・転送・ads.txt・解析・動作確認・canonical等）は未実施。コード・設定への変更なし（git status確認済み・変更なし）。


## 2026-10-13（非対話）AIO自社点検と修正（DIA・ブランチ fix/aio-20261013）
- robots/sitemap/llms.txt・canonical/OGP/構造化データなどAI可読性だけを修正（機能・料金・LPの訴求は未変更）。詳細と前後比較は ai-virtual-corp/docs/marketing/aio-self-check-20261013/README.md
- push・デプロイは未実施（代表の確認待ち）

## 2026-09-29 画像・動画プロンプト画面をAIを呼ばない形で復元（branch fix/dia-no-ai-restore）
- 代表決裁（棚卸し B-7）：9/1 に撤去した `/image`・`/video` を、ブラウザ内の定型句だけで3案（標準・創作・詳細）を組み立てる形で戻す。AI・外部APIは呼ばない。性的な選択肢は戻さない
- 追加：`src/utils/mediaPromptBuilder.ts`（純関数）・`src/components/shared/MediaPromptPage.tsx`・`src/app/{image,video}/page.tsx`・トップ（PC/スマホ）からの入口
- 検算：`npm run verify:no-ai`（api ルート・サーバーアクション・通信処理・AI接続先・性的語を静的に検査。違反を入れると FAIL することを確認済み）
- 実装 Astra（codex）→ 独立レビュー Fable 5.1（指摘10件中7件を修正、残り＝自動実行化・Midjourney版数の既定・読み上げ改善は保留）
- tsc 0 / lint 0 error / build 成功 / 起動して / /image /video 200・/api/media-prompt 404
- 未実施：push・本番反映（代表指示待ち）

## 2026-10-04 15:xx（作業担当B・非対話）hdr-ai.com移設・AdSense再登録 準備計画書を作成（実行なし）
- 代表が2026-10-04にhdr-ai.comをCloudflare Registrarで購入済み（NS=Cloudflare確認済み）。2026-10-02に一度「未登録のため未着手」で止まっていた指示書の続き。
- 読み取りのみで調査：`vercel domains ls`（getaaru.appのみ・hdr-ai.com未登録）／`dig hdr-ai.com NS/A`／DIAコード内のSITE_URL・AdSenseタグ・ads.txt有無／本日司令塔確認済みのAdSense状態（dia-wheat.vercel.app・要確認・有用性の低いコンテンツ）。
- Vercelカスタムドメイン手順・Cloudflareプロキシはオフにすべき点・AdSenseサイト追加手順/ads.txt書式をそれぞれ公式ドキュメントで確認（doc-fetcher2本）。
- 2026-10-02報告にあった`DIA_ALLOWED_ORIGINS`/Gemini API許可オリジンの論点は、9/29のAI呼び出し撤去決裁により現存しないことを確認（コード上0件）＝移設計画から除外。
- 成果物：`~/claude-bridge/outbox/20261004-hdr-ai.com移設準備/00_計画.md`
- 設定・デプロイ・DNS変更は一切実施していない（git status / DNS実測で無変更を確認）。次は代表の実行承認待ち。
- 2026-10-04 DIA を dia.hdr-ai.com へ移設（代表承認）：Vercel にドメイン追加・Cloudflare に A dia→76.76.21.21（DNS only）・SITE_URL 変更（Dia 3ee9cbee）→ 本番で canonical/og:url が新URL・HTTPS 200 を実測。旧 dia-wheat.vercel.app は残る（200）。AdSense はルート hdr-ai.com の HP が立ってから登録。
