import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateTags } from "@/lib/claude";

// GET: メモ一覧取得（タグ付き、ページング対応）
export async function GET(request: NextRequest) {
  const db = supabase();
  const searchParams = request.nextUrl.searchParams;
  const before = searchParams.get("before"); // カーソル: これより古いメモを取得
  const days = searchParams.get("days"); // 初期ロード用: 直近N日分

  let query = db
    .from("memos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (before) {
    // カーソルページング: before より古いメモを取得
    query = query.lt("created_at", before);
  } else if (days) {
    // 初期ロード: 直近N日分
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));
    query = query.gte("created_at", since.toISOString());
  }

  const { data: memos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 各メモにタグを紐づけ
  const memosWithTags = await Promise.all(
    memos.map(async (memo) => {
      const { data: memoTags } = await db
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

  // 古い順に並べ替えて返す（UIで下が最新になるように）
  memosWithTags.reverse();

  return NextResponse.json(memosWithTags);
}

// POST: メモ作成（自動タグ付け付き）
export async function POST(request: NextRequest) {
  const db = supabase();
  const { content } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // メモ保存
  const { data: memo, error: memoError } = await db
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
      const { data: tag } = await db
        .from("tags")
        .upsert({ name }, { onConflict: "name" })
        .select()
        .single();

      if (tag) {
        tags.push(tag);
        // 中間テーブルに紐づけ
        await db
          .from("memo_tags")
          .insert({ memo_id: memo.id, tag_id: tag.id });
      }
    }
  } catch (e) {
    console.error("Tag generation failed:", e);
  }

  return NextResponse.json({ ...memo, tags }, { status: 201 });
}
