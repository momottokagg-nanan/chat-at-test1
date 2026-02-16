import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

// POST: メモにAIタグを生成・付与
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = supabase();

  // メモ取得
  const { data: memo, error: memoError } = await db
    .from("memos")
    .select("*")
    .eq("id", id)
    .single();

  if (memoError || !memo) {
    return NextResponse.json({ error: "Memo not found" }, { status: 404 });
  }

  // AI タグ生成
  const tagNames = await generateTags(memo.content);

  const tags: { id: string; name: string }[] = [];
  for (const name of tagNames) {
    const { data: tag } = await db
      .from("tags")
      .upsert({ name }, { onConflict: "name" })
      .select()
      .single();

    if (tag) {
      tags.push(tag);
      // 重複を避けてupsert
      await db
        .from("memo_tags")
        .upsert(
          { memo_id: id, tag_id: tag.id },
          { onConflict: "memo_id,tag_id" }
        );
    }
  }

  return NextResponse.json({ tags });
}
