import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

// GET: メモ一覧取得（タグ付き）
export async function GET() {
  const { data: memos, error } = await supabase
    .from("memos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 各メモにタグを紐づけ
  const memosWithTags = await Promise.all(
    memos.map(async (memo) => {
      const { data: memoTags } = await supabase
        .from("memo_tags")
        .select("tag_id, tags(id, name)")
        .eq("memo_id", memo.id);

      const tags = (memoTags ?? []).map((mt) => {
        const tag = mt.tags as unknown as { id: string; name: string };
        return tag;
      });

      return { ...memo, tags };
    })
  );

  return NextResponse.json(memosWithTags);
}

// POST: メモ作成（自動タグ付け付き）
export async function POST(request: NextRequest) {
  const { content } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // メモ保存
  const { data: memo, error: memoError } = await supabase
    .from("memos")
    .insert({ content })
    .select()
    .single();

  if (memoError) {
    return NextResponse.json({ error: memoError.message }, { status: 500 });
  }

  // AI自動タグ生成
  let tags: { id: string; name: string }[] = [];
  try {
    const tagNames = await generateTags(content);

    for (const name of tagNames) {
      // タグを upsert
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name }, { onConflict: "name" })
        .select()
        .single();

      if (tag) {
        tags.push(tag);
        // 中間テーブルに紐づけ
        await supabase
          .from("memo_tags")
          .insert({ memo_id: memo.id, tag_id: tag.id });
      }
    }
  } catch (e) {
    console.error("Tag generation failed:", e);
  }

  return NextResponse.json({ ...memo, tags }, { status: 201 });
}
