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

  // タグ未付与のメモをRPCではなくleft joinライクに取得
  // memo_tagsに1件でもあるメモは除外する
  // 大量のIDをNOT INに渡すとURL長制限に引っかかるため、
  // ページネーション的にoffsetで処理済みをスキップする代わりに
  // 別のアプローチ: まずタグ未付与のメモIDだけを特定する
  const { data: allMemos, error: allMemosError } = await (() => {
    let q = db
      .from("memos")
      .select("id")
      .order("created_at", { ascending: true });
    if (from) q = q.gte("created_at", `${from}T00:00:00`);
    if (to) q = q.lte("created_at", `${to}T23:59:59`);
    return q;
  })();

  if (allMemosError) {
    return NextResponse.json({ error: allMemosError.message }, { status: 500 });
  }

  const allMemoIds = (allMemos ?? []).map((m) => m.id);

  if (allMemoIds.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  // タグ付き済みのmemo_idを取得（対象メモのみ）
  // 大量のIDを一度に渡せないので、チャンクに分けて取得
  const taggedIdSet = new Set<string>();
  const CHUNK_SIZE = 200;
  for (let i = 0; i < allMemoIds.length; i += CHUNK_SIZE) {
    const chunk = allMemoIds.slice(i, i + CHUNK_SIZE);
    const { data: rows } = await db
      .from("memo_tags")
      .select("memo_id")
      .in("memo_id", chunk);
    if (rows) {
      for (const r of rows) taggedIdSet.add(r.memo_id);
    }
  }

  // タグ未付与のメモIDを特定
  const untaggedIds = allMemoIds.filter((id) => !taggedIdSet.has(id));
  const remaining = untaggedIds.length;

  if (remaining === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  // バッチサイズ分だけメモ本文を取得
  const targetIds = untaggedIds.slice(0, batchSize);
  const { data: targetMemos, error: memosError } = await db
    .from("memos")
    .select("id, content")
    .in("id", targetIds);

  if (memosError) {
    return NextResponse.json({ error: memosError.message }, { status: 500 });
  }

  const memos = targetMemos ?? [];
  const { processed, failed } = await processBatch(memos);

  return NextResponse.json({
    processed,
    failed,
    remaining: remaining - processed - failed,
  });
}

// バッチ内を並列処理（同時実行数制限付き）
async function processBatch(
  memos: { id: string; content: string }[]
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  // CONCURRENCY件ずつ並列実行
  for (let i = 0; i < memos.length; i += CONCURRENCY) {
    const chunk = memos.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((memo) => processOneMemo(memo))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        processed++;
      } else {
        failed++;
      }
    }
  }

  return { processed, failed };
}

async function processOneMemo(memo: { id: string; content: string }): Promise<boolean> {
  const db = supabase();
  try {
    const tagNames = await generateTags(memo.content);

    // タグが生成されなかった場合でも「処理済み」としてマークするため
    // 「未分類」タグを付与
    const names = tagNames.length > 0 ? tagNames : ["未分類"];

    for (const name of names) {
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
    // 失敗したメモにも「エラー」タグを付けて処理済みにする
    // これにより次のバッチで同じメモが再取得されるのを防ぐ
    try {
      const { data: errorTag } = await db
        .from("tags")
        .upsert({ name: "タグ生成エラー" }, { onConflict: "name" })
        .select()
        .single();
      if (errorTag) {
        await db
          .from("memo_tags")
          .upsert(
            { memo_id: memo.id, tag_id: errorTag.id },
            { onConflict: "memo_id,tag_id" }
          );
      }
    } catch (innerErr) {
      console.error(`Failed to mark memo ${memo.id} as error:`, innerErr);
    }
    return false;
  }
}
