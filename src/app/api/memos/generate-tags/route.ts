import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

const BATCH_SIZE = 10;
const CONCURRENCY = 5;

// POST: タグ未付与のメモにAIタグ生成（バッチ処理）
export async function POST(request: NextRequest) {
  const db = supabase();
  const searchParams = request.nextUrl.searchParams;
  const batchSize = parseInt(searchParams.get("batch") ?? String(BATCH_SIZE), 10);
  const from = searchParams.get("from"); // yyyy-MM-dd
  const to = searchParams.get("to");     // yyyy-MM-dd

  // タグが付いていないメモを取得
  // memo_tagsに存在するmemo_idを先に取得してフィルタリング
  const { data: taggedRows } = await db
    .from("memo_tags")
    .select("memo_id");

  const taggedIds = [...new Set((taggedRows ?? []).map((r) => r.memo_id))];

  let query = db
    .from("memos")
    .select("id, content")
    .order("created_at", { ascending: true })
    .limit(batchSize);

  // taggedIdsがある場合はそれらを除外
  if (taggedIds.length > 0) {
    query = query.not("id", "in", `(${taggedIds.join(",")})`);
  }

  // 日付範囲フィルター
  if (from) {
    query = query.gte("created_at", `${from}T00:00:00`);
  }
  if (to) {
    query = query.lte("created_at", `${to}T23:59:59`);
  }

  const { data: untaggedMemos, error: memosError } = await query;

  if (memosError) {
    return NextResponse.json({ error: memosError.message }, { status: 500 });
  }

  const memos = untaggedMemos ?? [];

  if (memos.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  const processed = await processBatch(memos);

  // 残件数を正確に計算（日付範囲内の未タグメモ数）
  const { data: newTaggedRows } = await db
    .from("memo_tags")
    .select("memo_id");
  const newTaggedIds = [...new Set((newTaggedRows ?? []).map((r) => r.memo_id))];

  let remainingQuery = db
    .from("memos")
    .select("id", { count: "exact", head: true });

  if (newTaggedIds.length > 0) {
    remainingQuery = remainingQuery.not("id", "in", `(${newTaggedIds.join(",")})`);
  }
  if (from) {
    remainingQuery = remainingQuery.gte("created_at", `${from}T00:00:00`);
  }
  if (to) {
    remainingQuery = remainingQuery.lte("created_at", `${to}T23:59:59`);
  }

  const { count: remaining } = await remainingQuery;

  return NextResponse.json({
    processed,
    remaining: remaining ?? 0,
  });
}

// バッチ内を並列処理（同時実行数制限付き）
async function processBatch(memos: { id: string; content: string }[]): Promise<number> {
  let processed = 0;

  // CONCURRENCY件ずつ並列実行
  for (let i = 0; i < memos.length; i += CONCURRENCY) {
    const chunk = memos.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((memo) => processOneMemo(memo))
    );
    processed += results.filter((r) => r.status === "fulfilled" && r.value).length;
  }

  return processed;
}

async function processOneMemo(memo: { id: string; content: string }): Promise<boolean> {
  const db = supabase();
  try {
    const tagNames = await generateTags(memo.content);

    // タグが生成されなかった場合でも「処理済み」としてマークするため
    // 空のタグ名で紐付けを作成（「未分類」タグ）
    if (tagNames.length === 0) {
      const { data: tag } = await db
        .from("tags")
        .upsert({ name: "未分類" }, { onConflict: "name" })
        .select()
        .single();
      if (tag) {
        await db
          .from("memo_tags")
          .upsert(
            { memo_id: memo.id, tag_id: tag.id },
            { onConflict: "memo_id,tag_id" }
          );
      }
      return true;
    }

    for (const name of tagNames) {
      const { data: tag } = await db
        .from("tags")
        .upsert({ name }, { onConflict: "name" })
        .select()
        .single();

      if (tag) {
        await db
          .from("memo_tags")
          .upsert(
            { memo_id: memo.id, tag_id: tag.id },
            { onConflict: "memo_id,tag_id" }
          );
      }
    }
    return true;
  } catch (e) {
    console.error(`Tag generation failed for memo ${memo.id}:`, e);
    return false;
  }
}
