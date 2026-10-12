# DIA WORKLOG


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
