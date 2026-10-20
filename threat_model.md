# DIA 脅威モデル

雛形: ai-virtual-corp `docs/security/THREAT_MODEL_TEMPLATE.md`（HDR共通・2026-10-20）。作成: 2026-10-20。
対象: 本リポジトリ（github.com/KAMANOI/dia・既定枝 main・コミット a3885520 時点）。本番の状態は本書では確認していない（情報なし）。
出典の略称: 目的カード＝ai-virtual-corp `docs/purpose/DIA.md`／SD＝本リポジトリ `docs/SECURITY_DESIGN.md`／WL＝`WORKLOG.md`／V＝`scripts/verify-no-ai-calls.mjs`。

## 1. 製品が何をするか
- 日本語で書いた情報から、ChatGPT・Claude・Gemini・Midjourneyなどに渡せるプロンプト（標準・簡潔・高精度の3案）を、ブラウザ内の処理だけで作るWebツール。アカウント・決済・サーバー保存なし（目的カード(a)）。
- 画像・動画プロンプト画面（`/image` `/video`）は2026-09-01に撤去され、2026-09-29に「AIを呼ばない形」でコード上復元済み。`src/app/api` は存在しない（WL「現在の画面」・コミット 4030d9eb・V:30）。目的カード(d)は「本番は文章プロンプトのみ・/image /video は404（2026-09-20実測）」と書くが、これは復元前の記録で、復元後の本番の応答は情報なし（WL 2026-10-13 は「本番 /image /video 200 を実測」と記載）。元の形（Gemini呼び出しを含む）に戻すか、復元の形の最終判断は代表判断待ち（目的カード(b)(d)）。
- 画像1枚から動画用プロンプトを起こす `/video/from-image` がある。画像は利用者のブラウザ内でだけ読み、送信しない（`src/components/shared/ImageToVideoPage.tsx:21-33,62`、WL 2026-10-13）。
- 利用者は一般の個人。本番は Vercel（`dia.hdr-ai.com`、旧 `dia-wheat.vercel.app` も残る。WL 2026-10-04）。

## 2. 信頼できない入力の入口
サーバー側で入力を受ける入口は 0 本（HTTP は GET のみ。`src/app/api`・サーバーアクション・middleware・proxy・`vercel.json` の書き換えは無い。V:30,45-60,77 が毎回のビルド前に検査: `package.json` の `prebuild`）。
ページ等の公開 GET 入口は 18 本中 18 本を下表に列挙（`src/app` の `page.tsx` 14 本＋`opengraph-image.tsx`・`robots.ts`・`sitemap.ts` の 3 本＋`public/llms.txt` 1 本）。いずれも URL のパス以外に入力を取らない。

| 入口 | 誰が送れるか | 認証 | 備考 |
|---|---|---|---|
| `/`（`src/app/page.tsx`）・`/image`・`/video`・`/video/from-image` の4本 | 誰でも | なし | 入力は利用者のブラウザ内フォームだけ。サーバーへは送らない。結果は React のテキストとして描画（`dangerouslySetInnerHTML` は `layout.tsx:117`〔自前の構造化データ〕と `AdSlot.tsx:81`〔固定文字列〕のみ） |
| `/about` `/contact` `/how-to` `/privacy` `/terms` `/guide-1`〜`/guide-5` の10本 | 誰でも | なし | 静的コンテンツ。`/contact` は github.com/KAMANOI/dia/issues への外部リンクのみ（`src/app/contact/page.tsx:25`） |
| `/opengraph-image` `/robots.txt` `/sitemap.xml` `/llms.txt` の4本 | 誰でも | なし | 静的。`opengraph-image.tsx` はビルド／描画時に Google Fonts へ取得（`:30-36`、V が内容ハッシュで固定） |

ブラウザ内の入力（サーバーを通らないが、信頼しない入力として扱う）:
| 入口 | 誰が送れるか | 認証 | 備考 |
|---|---|---|---|
| 説明文などのフォーム入力 | 利用者本人 | なし | 生成は `src/utils/promptBuilder.ts`・`mediaPromptBuilder.ts`・`imageToVideoBuilder.ts` の純関数。文章の `description` は履歴に保存 |
| 画像ファイル選択（`input type=file accept=image/*`、1枚） | 利用者本人 | なし | `createImageBitmap` と 48x48 の canvas で縦横・主な色・EXIF焦点距離を読む（`ImageToVideoPage.tsx:21-33,71`）。サイズ上限は情報なし（コードに上限の記述なし） |
| localStorage `dia_history`（履歴・最大50件） | 同一ブラウザ内の他スクリプト・利用者本人 | なし | 読込時に型・列挙値を検証して補正（`src/utils/storage.ts:32-93,133-153`） |

外部から読み込むデータ: ① Google AdSense スクリプト（本番のみ・全ページの head。`src/app/layout.tsx:104-110`）、② Google Fonts（`next/font`・ビルド時取得。SD §1）、③ `opengraph-image.tsx` のフォント取得。広告枠コンポーネントはガイド系レイアウトだけが使う（`src/components/shared/GuideLayout.tsx`、`AdSlot` の参照はこの1ファイル）。

## 3. 守る資産
| 資産 | 置き場 | 漏れた時の影響 |
|---|---|---|
| 利用者が入力した文章（機密文を入れる人がいる前提） | 利用者ブラウザの localStorage `dia_history`（平文JSON・最大50件・`storage.ts:12-13`）。サーバーには置かない | 端末を使える第三者が読める。ページ内の第三者スクリプト（AdSense）が同一オリジンで動くため、改ざんされると読めうる（CSP は報告のみで遮断しない。§4） |
| 選んだ画像 | メモリ上のみ。保存・送信しない（`ImageToVideoPage.tsx:21-33`） | 外部へ出たら約束違反（高。§5） |
| 認証情報・決済情報・個人情報（アカウント・メール・カード） | 無し（ログイン・DB・Cookie発行・決済の実装なし。目的カード(a)、SD §1） | 該当なし |
| サービスキー | 現行コードには秘密の読み込みが無い（`process.env` の参照は `NODE_ENV` のみ: `layout.tsx:104`・`AdSlot.tsx:37`）。`.env*` は `.gitignore` で除外（`.env.local` の除外を `git check-ignore` で確認）。`.env.example` に撤去済み機能用の変数名（`DIA_MEDIA_PROMPT_ENABLED`・`GEMINI_API_KEY`・`NEXT_PUBLIC_SITE_URL`・`DIA_ALLOWED_ORIGINS`）が残る（値は見ていない）。Vercel 側の環境変数の現状は情報なし | 旧 Gemini キーが Vercel に残っていれば、撤去後も有効な課金経路の鍵になりうる。残存の有無は情報なし |
| 他の利用者のデータ | 無い（共有状態がサーバーに無い） | 該当なし |
| 公開リポジトリ | github.com/KAMANOI/dia は PUBLIC（SD T9・2026-08-30 時点。現在は情報なし） | 秘密を載せない前提。AdSense の publisher id は公開前提の識別子（`AdSlot.tsx:15`・SD §4） |

## 4. 重要部品と対象外
重要部品:
- `scripts/verify-no-ai-calls.mjs`（`npm run verify:no-ai`・`prebuild`）— 「api ルートなし・サーバーアクションなし・通信処理なし（OG画像の固定ハッシュ例外のみ）・AI接続先なし・性的語なし」を静的に検査する。ここが緩むと「外部送信なし」の約束が黙って破れる。
- `next.config.ts` — セキュリティヘッダ。CSP は `Content-Security-Policy-Report-Only`（遮断しない）。`connect-src 'self'`・`img-src 'self'` で、強制すると AdSense が動かない設計（同ファイルのコメント）。他は `X-Frame-Options: DENY`・`nosniff`・`Referrer-Policy`・`Permissions-Policy`。HSTS は Vercel が付与（同コメント）。
- `src/app/layout.tsx:104-110`（AdSense スクリプトを本番の全ページで読み込む）と `src/components/ads/AdSlot.tsx`。
- `src/utils/storage.ts`・`src/hooks/useHistory.ts`（履歴の保存・検証・削除）。
- `src/utils/*Builder.ts`（入力を指示文に埋め込む純関数）。
- `.github/workflows/dependency-audit.yml`（`npm audit --audit-level=high` を PR・main・週1で実行）。

対象外（理由つき）:
- Vercel・Google AdSense・Google Fonts・利用者が貼り付ける先のAI（ChatGPT等）自体の脆弱性。外部サービスの欠陥で、当方のコードの欠陥ではない。ただし当方が取り込む版・読み込み方に実害経路があれば対象。
- 利用者が生成した指示文を他のAIに貼った後の挙動。DIAは文を作るだけで、AIへ送る操作は利用者が行う（`src/app/privacy/page.tsx:34-38`）。
- `docs/` 配下の文書、`WORKLOG.md`、`scripts/check-image-to-video.mjs`（開発・検査用。本番に載らない）。
- `node_modules/`・`tsconfig.tsbuildinfo`・`next-env.d.ts`（生成物・依存物）。
- 端末そのものを奪われた場合の localStorage 読み取り（利用者の端末管理の範囲。全削除の導線は提供: `useHistory.ts`）。
- `~/projects/dia-aio`・`dia-wt-*` 等の作業コピー（同じ本体リポジトリの枝。本書は本体に対して書く）。

## 5. 重大度の基準（HDR共通＋製品固有）
HDR共通の表は雛形のとおり（本書では下げない）。製品固有の追加（根拠は目的カード(b)「現行の約束＝文章プロンプトはブラウザ内で完結し外部送信しない・完全無料・アカウント/DB/決済なし・履歴はlocalStorageのみ」）:

| 重大度 | 製品固有の基準 |
|---|---|
| 高 | 利用者の入力文・選択した画像・履歴が、利用者の操作なしにDIAのサーバーまたは第三者へ送られる経路（`fetch`・`sendBeacon`・WebSocket・フォーム送信・画像要素の外部読込・外部への Beacon 等。「外部送信なし」の約束を破る） |
| 高 | `src/app/api` の追加、サーバーアクション、AI・LLM の接続先／SDK の追加（`verify:no-ai` の検査項目が外れる、または迂回される） |
| 高 | アカウント・DB・決済・課金経路の追加（目的カード(b)「アカウント/DB/決済なし」を破る） |
| 中 | 履歴の保存場所・保持の変更（localStorage 以外への保存、`全削除` が効かなくなる） |
| 中 | プライバシーポリシー・LP・llms.txt の「送信しない／広告を表示しない」記述と実装が食い違う（`public/llms.txt` は「ツール画面には広告を表示しない」と書く一方、AdSense スクリプトは全ページ head で読み込まれる〔`layout.tsx:104-110`〕。実際にツール画面へ広告が出るかは情報なし） |

注: 画像・動画プロンプトの復元の形（Gemini 呼び出しを含む案）は代表判断待ちで、決まるまで上記の約束を減らす変更は本書の想定外（目的カード(d)「約束を崩す変更は代表判断に回す」）。

## 6. 報告と修正案の形式
HDR共通。`指摘N｜重要度｜key｜場所｜内容｜再現手順｜原因｜修正案｜脅威モデル照合`（`docs/process/PROCESS_STAGES.md` §6c／`docs/process/THREAT_SCAN.md` §3）。再現手順は読み取りだけで再現できるもの（本番には触れない）。再現できない物は「未確認:」を内容の先頭に付ける。原因は `git log -S`／`git blame` の結果、無ければ「情報なし」。修正案は差分の形で、パッチは自動適用しない。

## 7. 重複の粒度
同じ根本原因は1件にまとめ、影響する場所を列挙する。製品固有の既知事項（再報告しない）:
- CSP が Report-Only で遮断しない件。AdSense が許可リスト方式の CSP を公式にサポートしない（nonce＋strict-dynamic のみ）ためで、強制には middleware で nonce を配る構成が要る（`next.config.ts` のコメント）。許容済み。ただし CSP の `script-src` に `'unsafe-inline'` を含むこと自体は既知。
- `docs/SECURITY_DESIGN.md`（2026-08-30）が撤去前の状態（`/api/media-prompt`・Gemini・`middleware.ts` 無し・アプリ由来ヘッダ0件）のまま書かれている件。現行コードと食い違う。更新は別作業（本書は現行コードを正とする）。
- `.env.example` に撤去済み機能用の変数名が残る件。
- 依存パッケージの既知脆弱性: `npm audit` は本書作成時にネットワークを使わず未実施。結果は情報なし（CI が週1で実行: `.github/workflows/dependency-audit.yml`）。
- AdSlot の `history`・`footer` の `slotId` が仮値（`ZZZZZZZZ`・`WWWWWWWW`、`AdSlot.tsx:29-30`）。広告の設定未完で、攻撃面ではない。

## 8. 関連する設計文書
- 目的カード: ai-virtual-corp `docs/purpose/DIA.md`（特に(b)(d)）
- 仕様台帳: ai-virtual-corp `docs/research/spec-ledger/dia.md`（目的カード経由の参照。今回は未読）
- 本リポジトリ: `docs/SECURITY_DESIGN.md`（撤去前の記述が残る）、`docs/error-codes.md`（冒頭に撤去の注記、本文は撤去前のAPI仕様のまま）、`WORKLOG.md`、`scripts/verify-no-ai-calls.mjs`、`next.config.ts`
- `decisions.md`: 本リポジトリには無い（SD 冒頭 2026-08-30 の記載。現在もファイルは追跡されていない: `git ls-files` で確認）。ai-virtual-corp 側の `.claude/decisions.md`（目的カード(d)が行1664を参照）は今回未読。
