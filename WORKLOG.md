# DIA WORKLOG

## 2026-11-05 条件付きガイドライン形式を結果画面とスマホ画面の 4 つ目に接続（branch feat/dia-guideline-tab-20261105）
- 根拠：代表 2026-11-01 13:57「全部 Y」＝判断カード推奨①「接続する（履歴には載せない）→結果画面とスマホ画面にタブを足す（push・本番反映は別途確認）」
- 元：main dd63f643 に feat/dia-guideline-form-20261101（950197cd・関数のみ）を merge。衝突は package.json の scripts だけ＝check:guideline・check:i2v・check:og を全部残した
- 接続：PC は既存の PromptCard で 4 枚目「条件付きガイドライン」（コピーも同じ部品）。スマホは既存の Tabs（pill）に 4 つ目。375px で 4 等分すると「ガイドライン」が 2 行に折れるため、スマホのタブ表記は「ガイド／条件付き」に短縮（PC のカードは正式名）。既存 3 案の文言・配置・「3案をまとめてコピー」は変えていない
- 決めたこと：ガイドラインは HomeClient の別 state に持ち、GeneratedPrompts・履歴（localStorage）の形は変えない。履歴から開いた時は保存済みの入力と modifier から組み立て直す（AI は呼ばない・保存しない）
- 検査：tsc 0 / lint 0 error（警告 3 件は変更前と同じ）/ check:guideline PASS / check:i2v PASS / check:og ok / verify:no-ai 全 PASS / next build 成功（19 ページ）。Playwright で PC 1440・スマホ 375 を撮影：PC カード 4 枚・スマホ横はみ出しなし・ページエラーなし・localStorage にガイドライン本文なし
- ASTRA r1（不合格・高1 guideline-mask-bypass）：機密 level3 で本文はマスクされるが、未加工の入力から抽出した意図（ターゲット等）にメールアドレスが残る。同じ漏れは既存 3 案（本番の main にもある）にもあった。共通の口で直した：`sanitizeIntent()` で抽出結果にも本文と同じマスクをかけ、buildPrompts と buildGuidelinePrompt の両方で通す。回帰試験を check:guideline に追加（修正前の promptBuilder では失敗＝`ターゲット：alice@example.com` を確認）
- push・main 取り込み・本番反映は司令塔（本番は代表の別途確認）

## 2026-11-05 OG 画像の日本語フォント取得に再現テストを追加（branch fix/og-font-test-20261105）
- 元の指摘（8e4e8a40 の独立判定 中1・font-fallback-regression-test）：「バグ修正に対する再現テストが差分になく…truetype 応答でフォントを取得できることと、取得先制限を維持していることの検証根拠が不足」
- 追加：`scripts/check-og-font.mjs`（`npm run check:og`）。fetch を固定応答に差し替え、truetype で取得できる・woff2/opentype も従来どおり・fonts.gstatic.com 以外（別ホスト・http・別ポート・似た名前・メタデータ IP）は 2 回目の取得をしない・転送は追わない・失敗時は null、を確認。外部通信なし
- 決めたこと：本体 `src/app/opengraph-image.tsx` は 1 文字も変えない（verify-no-ai-calls.mjs が sha256 で固定している・本番 dia-aovhdjzq2 と同じ物のまま）。試験は本体から関数を切り出して型を外して実行する＝写しを試さない
- 効き目の確認：取得条件を woff2 だけに戻した写し・ホスト制限を外した写しでは、この試験が失敗することを確認
- 検査：tsc 0 / eslint 0 error（警告 3 件は変更前と同じ）/ verify:no-ai 全 PASS / check:i2v PASS / check:og ok。next build は外部（Google Fonts）取得を伴うため未実行（本体は無変更）
- push・main 取り込みは司令塔。本番反映は不要（本体無変更）

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
