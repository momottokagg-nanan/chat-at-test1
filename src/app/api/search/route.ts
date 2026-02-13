import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: キーワード検索（本文 + タグ対象）
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const keyword = `%${query}%`;

  // 本文にマッチするメモID
  const { data: contentMatches } = await supabase
    .from("memos")
    .select("id")
    .ilike("content", keyword);

  // タグ名にマッチするメモID
  const { data: tagMatches } = await supabase
    .from("tags")
    .select("id, memo_tags(memo_id)")
    .ilike("name", keyword);

  const memoIdsFromTags = (tagMatches ?? []).flatMap((tag) =>
    (tag.memo_tags as unknown as { memo_id: string }[]).map((mt) => mt.memo_id)
  );

  const memoIdsFromContent = (contentMatches ?? []).map((m) => m.id);

  // 重複を除去して統合
  const allMemoIds = [...new Set([...memoIdsFromContent, ...memoIdsFromTags])];

  if (allMemoIds.length === 0) {
    return NextResponse.json([]);
  }

  // メモ本体を取得
  const { data: memos, error } = await supabase
    .from("memos")
    .select("*")
    .in("id", allMemoIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // タグを紐づけ
  const memosWithTags = await Promise.all(
    (memos ?? []).map(async (memo) => {
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
