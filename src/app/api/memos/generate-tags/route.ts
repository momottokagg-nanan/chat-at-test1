import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

const BATCH_SIZE = 3;

// POST: タグ未付与のメモにAIタグ生成（バッチ処理）
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const batchSize = parseInt(searchParams.get("batch") ?? String(BATCH_SIZE), 10);

  // タグが付いていないメモを取得
  const { data: allMemos, error: memosError } = await supabase
    .from("memos")
    .select("id, content")
    .order("created_at", { ascending: true });

  if (memosError) {
    return NextResponse.json({ error: memosError.message }, { status: 500 });
  }

  // memo_tagsに存在するmemo_idを取得
  const { data: taggedRows } = await supabase
    .from("memo_tags")
    .select("memo_id");

  const taggedIds = new Set((taggedRows ?? []).map((r) => r.memo_id));
  const untaggedMemos = (allMemos ?? []).filter((m) => !taggedIds.has(m.id));

  const remaining = untaggedMemos.length;

  if (remaining === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  // バッチ分だけ処理
  const batch = untaggedMemos.slice(0, batchSize);
  let processed = 0;

  for (const memo of batch) {
    try {
      const tagNames = await generateTags(memo.content);

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
      processed++;
    } catch (e) {
      console.error(`Tag generation failed for memo ${memo.id}:`, e);
    }
  }

  return NextResponse.json({
    processed,
    remaining: remaining - processed,
  });
}
