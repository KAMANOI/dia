# DIA — エラーコード一覧

- 作成：2026-08-30。正本：このファイル。API の応答を変えたら同時に更新する
- 対象：サーバ側の入口は `POST /api/media-prompt` の1本だけ（`src/app/api/media-prompt/route.ts`）。この API が返すエラーは **必ず `{ error, code }` の形**で返す
- 画面側は `data.error` をそのまま表示する（`src/app/image/page.tsx`・`src/app/video/page.tsx`）。利用者から不具合報告を受けたら `code` を聞けば原因が特定できる

## 採番の方針（`~/.claude/CLAUDE.md` の E1xx〜 体系との差分）

この製品では **HTTP ステータスと同じ数字**（E400 / E403 / E429 / E500 / E502 / E503）を使う。理由：

- 指示書と `docs/SECURITY_DESIGN.md` §5 が `E503` `E403` `E429` を**具体的な文字列として指定**しており、応答とドキュメントを一致させる必要がある
- 入口が1本しかないため独自採番の利点（どの機能で落ちたかの識別）が無い
- 利用者の画面表示・Vercel のログ・HTTP ステータスの3つが同じ数字になるので、報告を受けた時の照合が最短になる

入口が増えたら、その時点で機能ごとの接頭辞（例：`E4xx-MEDIA`）への移行を検討する。

## 一覧

| code | HTTP | 返る条件 | 利用者向けメッセージ | 対応 |
|---|---|---|---|---|
| `E503` | 503 | 環境変数 `DIA_MEDIA_PROMPT_ENABLED` が `"1"` でない（既定オフ＝フェイルクローズ） | 画像・動画プロンプト生成は現在停止中です。 | 意図した停止。再開するなら Vercel の環境変数で `1` を設定して再デプロイ |
| `E403` | 403 | `Origin`／`Referer` が許可オリジン（`NEXT_PUBLIC_SITE_URL` ＋ `https://dia-wheat.vercel.app` ＋ `DIA_ALLOWED_ORIGINS`）のいずれでもない。両方のヘッダが欠けている場合も含む。**プレビューデプロイは既定で不許可** | このAPIは本サイトからのみ利用できます。 | 本サイトのフォームから利用する。**これは認証ではない**（ヘッダは呼び出し側が自由に付けられる）＝ブラウザ以外からの直接呼び出しを面倒にするだけの措置 |
| `E429` | 429 | 同一 IP（`x-forwarded-for` の先頭）から 20回/時 を超えた | 利用回数の上限に達しました。しばらく待ってからお試しください。 | 1時間待つ。**カウントはインスタンス内メモリのみ**でサーバレスでは分散・コールドスタートで消えるため、全体上限としては効かない（`route.ts` の `ponytail:` コメント参照） |
| `E400` | 400 | JSON として読めない／`type` `tool` `params` のいずれかが無い | Invalid JSON body. ／ Missing required fields. | 画面から普通に使っている限り出ない。出たら不具合 |
| `E501` | 500 | **Gemini API キーが未設定**（`GEMINI_API_KEY`／`GOOGLE_API_KEY` のいずれも無い）＝設定漏れ | Gemini API key is not configured... | Vercel の環境変数に `GEMINI_API_KEY` を設定する。外部呼び出しは発生していない |
| `E500` | 500 | **想定外の例外**（Gemini への fetch が12秒で中断された場合を含む） | Internal server error. | ログに例外が出る。関数の上限は `maxDuration = 30`秒で、12秒×最大2回＋再送待ち1.5秒＝25.5秒に収まる設計 |
| `E502` | 502 | Gemini が失敗を返した（503 は1.5秒待って1回だけ再送・**429 は再送しない**）／応答が JSON として読めない | Prompt generation failed. Please try again. ／ Failed to parse Gemini response. | 時間をおいて再試行。続くなら Google 側の枠・キーの状態を確認 |

補足：`GET /api/media-prompt` は Next.js の既定で 405 を返す（アプリのコードは通らないので `code` は付かない）。
