-- memos テーブル
create table memos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

-- tags テーブル
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- memo_tags 中間テーブル
create table memo_tags (
  memo_id uuid not null references memos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (memo_id, tag_id)
);

-- 検索用インデックス
create index memos_content_idx on memos using gin (to_tsvector('simple', content));
create index tags_name_idx on tags (name);
