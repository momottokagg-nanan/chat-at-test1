import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

const BATCH_SIZE = 10;
const CONCURRENCY = 5;

// POST: タグ未付与のメモにAIタグ生成（バッチ処理）
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const batchSize = parseInt(searchParams.get("batch") ?? String(BATCH_SIZE), 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  // タグが付いていないメモをサブクエリで効率的に取得
  const { data: untaggedMemos, error: memosError } = await supabase
    .rpc("get_untagged_memos", { lim: batchSize, off: offset });

  // RPCが無い場合のフォールバック
  if (memosError) {
    // 従来方式: タグ未付与メモを取得
    const { data: allMemos, error: allError } = await supabase
      .from("memos")
      .select("id, content")
      .order("created_at", { ascending: true });

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    const { data: taggedRows } = await supabase
      .from("memo_tags")
      .select("memo_id");

    const taggedIds = new Set((taggedRows ?? []).map((r) => r.memo_id));
    const filtered = (allMemos ?? []).filter((m) => !taggedIds.has(m.id));

    const remaining = filtered.length;
    if (remaining === 0) {
      return NextResponse.json({ processed: 0, remaining: 0 });
    }

    const batch = filtered.slice(0, batchSize);
    const processed = await processBatch(batch);

    return NextResponse.json({
      processed,
      remaining: remaining - processed,
    });
  }

  // RPCが使える場合
  const memos = untaggedMemos ?? [];

  if (memos.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  const processed = await processBatch(memos);

  // 残件数を取得
  const { count } = await supabase
    .from("memos")
    .select("id", { count: "exact", head: true })
    .not("id", "in", `(select memo_id from memo_tags)`);

  return NextResponse.json({
    processed,
    remaining: (count ?? 0),
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
  try {
    const tagNames = await generateTags(memo.content);

    // タグを一括upsertしてからmemo_tagsに紐付け
    for (const name of tagNames) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name }, { onConflict: "name" })
        .select()
        .single();

      if (tag) {
        await supabase
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
