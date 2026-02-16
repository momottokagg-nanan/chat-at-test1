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

  const { data: untaggedMemos, error: memosError } = await query;

  if (memosError) {
    return NextResponse.json({ error: memosError.message }, { status: 500 });
  }

  const memos = untaggedMemos ?? [];

  if (memos.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  const processed = await processBatch(memos);

  // 残件数を正確に計算
  // 全メモ数 - タグ付きメモ数(処理済み分も含む)
  const { count: totalMemos } = await db
    .from("memos")
    .select("id", { count: "exact", head: true });

  const { data: newTaggedRows } = await db
    .from("memo_tags")
    .select("memo_id");
  const newTaggedCount = new Set((newTaggedRows ?? []).map((r) => r.memo_id)).size;

  return NextResponse.json({
    processed,
    remaining: (totalMemos ?? 0) - newTaggedCount,
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
