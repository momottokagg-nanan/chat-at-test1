# 実行計画 - AI Chat Bot ナレッジ保存・検索アプリ

## Phase 1: プロジェクト初期セットアップ

- [ ] 1-1. Next.js プロジェクト作成（TypeScript, App Router, Tailwind CSS）
- [ ] 1-2. shadcn/ui の初期化・基本コンポーネント追加
- [ ] 1-3. `.env.local` ファイル作成（環境変数テンプレート）
- [ ] 1-4. `.gitignore` に `.env.local` が含まれていることを確認
- [ ] 1-5. Git リポジトリ初期化・初回コミット

## Phase 2: Supabase セットアップ

- [ ] 2-1. Supabase プロジェクト作成（Webコンソール上で手動）
- [ ] 2-2. テーブル作成SQL実行
  - `memos` テーブル（id, content, created_at）
  - `tags` テーブル（id, name）
  - `memo_tags` 中間テーブル（memo_id, tag_id）
- [ ] 2-3. Supabase クライアントライブラリインストール（`@supabase/supabase-js`）
- [ ] 2-4. `src/lib/supabase.ts` — Supabase クライアント初期化コード作成
- [ ] 2-5. `.env.local` に Supabase URL・ANON KEY を設定

## Phase 3: 型定義・共通設定

- [ ] 3-1. `src/types/index.ts` — Memo, Tag, MemoWithTags の型定義
- [ ] 3-2. Tailwind CSS のカスタム設定（ダークモード対応含む）

## Phase 4: API Route 実装（バックエンド）

- [ ] 4-1. `src/app/api/memos/route.ts` — メモ投稿 API（POST: 作成、GET: 一覧取得）
- [ ] 4-2. `src/app/api/memos/[id]/route.ts` — メモ個別操作 API（DELETE: 削除）
- [ ] 4-3. `src/lib/claude.ts` — Claude API 呼び出しユーティリティ作成
- [ ] 4-4. メモ投稿時の自動タグ付けフロー実装（Claude API → タグ生成 → DB保存）
- [ ] 4-5. `src/app/api/search/route.ts` — キーワード検索 API（本文+タグ対象）
- [ ] 4-6. `src/app/api/tags/route.ts` — タグ一覧取得 API
- [ ] 4-7. Anthropic SDK インストール（`@anthropic-ai/sdk`）

## Phase 5: UIコンポーネント実装（フロントエンド）

- [ ] 5-1. `src/app/layout.tsx` — ルートレイアウト（ダークモード、フォント設定）
- [ ] 5-2. `src/components/InputBar.tsx` — メッセージ入力バー（画面下部固定）
- [ ] 5-3. `src/components/MessageBubble.tsx` — 吹き出しコンポーネント（メモ表示用）
- [ ] 5-4. `src/components/TagBadge.tsx` — タグバッジコンポーネント
- [ ] 5-5. `src/components/ChatArea.tsx` — チャット表示エリア（メモ一覧）
- [ ] 5-6. `src/components/SearchBar.tsx` — 検索バー
- [ ] 5-7. `src/components/ModeToggle.tsx` — 投稿/検索モード切替トグル

## Phase 6: メイン画面の組み立て

- [ ] 6-1. `src/app/page.tsx` — メイン画面にコンポーネントを統合
- [ ] 6-2. 投稿フロー実装（入力 → API呼び出し → 画面更新）
- [ ] 6-3. 検索フロー実装（キーワード入力 → API呼び出し → 結果表示）
- [ ] 6-4. タグフィルタリング機能実装
- [ ] 6-5. メモ削除機能実装
- [ ] 6-6. レスポンシブ対応の調整（モバイル・PC）

## Phase 7: テスト・品質確認

- [ ] 7-1. メモ投稿→保存→表示の一連フロー動作確認
- [ ] 7-2. AI自動タグ付けの動作確認
- [ ] 7-3. キーワード検索の動作確認
- [ ] 7-4. メモ削除の動作確認
- [ ] 7-5. モバイル表示の確認
- [ ] 7-6. ダークモードの確認
- [ ] 7-7. エラーハンドリングの確認（API接続失敗時など）

## Phase 8: デプロイ

- [ ] 8-1. Vercel プロジェクト作成・GitHub連携
- [ ] 8-2. Vercel に環境変数を設定
- [ ] 8-3. デプロイ実行・動作確認
- [ ] 8-4. Supabase の接続許可設定（本番URL）

---

## 依存関係

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
                                  ↑
                          Phase 4-3, 4-7 は並行して進められる
                          Phase 5 は Phase 4 と並行して進められる
```

## 必要なパッケージ一覧

```
next, react, react-dom, typescript
tailwindcss, @tailwindcss/postcss
@supabase/supabase-js
@anthropic-ai/sdk
shadcn/ui 関連コンポーネント
```
