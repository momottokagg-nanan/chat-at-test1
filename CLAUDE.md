# AI Chat Bot - ナレッジ保存・検索アプリ

## プロジェクト概要

SNSや日常で見つけた気になるワード・内容をチャット形式で投稿・保存し、キーワード検索ですぐに引き出せるパーソナルナレッジbotアプリ。

## 技術スタック

- **フロントエンド**: Next.js (App Router)
- **UI ライブラリ**: Tailwind CSS + shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **AI API**: Claude API (Anthropic) — 自動タグ付けに使用
- **デプロイ**: Vercel
- **言語**: TypeScript

## 主要機能

### 1. チャット形式の投稿（保存）
- テキスト入力欄からチャット感覚でメモを投稿
- 投稿内容はSupabaseに保存される
- 投稿日時が自動記録される

### 2. AI自動タグ付け
- 投稿時にClaude APIが内容を分析し、タグを自動生成
- タグはDB上で投稿に紐づけて保存

### 3. キーワード検索
- 検索バーからキーワードを入力して保存済みメモを検索
- タグ・本文の両方を対象に検索
- 検索結果はチャット形式で表示

### 4. 閲覧・管理
- 保存したメモの一覧表示（時系列）
- タグによるフィルタリング
- 個別メモの削除

## ユーザー

- 自分専用（認証・ログイン不要）
- シングルユーザー前提

## UIデザイン方針

- チャットアプリ風のシンプルなUI
- 入力エリアは画面下部に固定
- 保存したメモは吹き出し形式で表示
- 検索モードと投稿モードの切り替えが直感的にできる
- レスポンシブ対応（PC・スマホ両方で使える）
- ダークモード対応

## データベース設計 (Supabase)

### memos テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| content | text | メモ本文 |
| created_at | timestamptz | 投稿日時 |

### tags テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid | 主キー |
| name | text | タグ名（ユニーク） |

### memo_tags テーブル（中間テーブル）
| カラム | 型 | 説明 |
|---|---|---|
| memo_id | uuid | memosへの外部キー |
| tag_id | uuid | tagsへの外部キー |

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインチャット画面
│   └── api/
│       ├── memos/
│       │   └── route.ts    # メモCRUD API
│       ├── search/
│       │   └── route.ts    # 検索API
│       └── tags/
│           └── route.ts    # タグAPI
├── components/
│   ├── ChatArea.tsx         # チャット表示エリア
│   ├── MessageBubble.tsx    # 吹き出しコンポーネント
│   ├── InputBar.tsx         # 入力バー
│   ├── SearchBar.tsx        # 検索バー
│   ├── TagBadge.tsx         # タグ表示バッジ
│   └── ModeToggle.tsx       # 投稿/検索モード切替
├── lib/
│   ├── supabase.ts          # Supabaseクライアント
│   └── claude.ts            # Claude API呼び出し
└── types/
    └── index.ts             # 型定義
```

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=     # SupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase匿名キー
ANTHROPIC_API_KEY=             # Claude APIキー
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # Lint実行
```

## コーディング規約

- TypeScript strict モードを使用
- コンポーネントは関数コンポーネント + React Hooks
- API Routeは Next.js App Router の Route Handlers を使用
- Supabaseへのアクセスはサーバーサイド（API Route）経由で行う
- Claude API呼び出しは必ずサーバーサイドで行う（APIキー保護）
