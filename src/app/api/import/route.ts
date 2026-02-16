import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { content } = await request.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // タイムスタンプパターンで分割
  const pattern = /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\]/g;
  const timestamps: string[] = [];
  const positions: number[] = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    timestamps.push(match[1]);
    positions.push(match.index);
  }

  if (timestamps.length === 0) {
    return NextResponse.json(
      { error: "No valid entries found in file" },
      { status: 400 }
    );
  }

  // 各エントリの本文を抽出
  const entries: { created_at: string; content: string }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const headerEnd =
      positions[i] + `[${timestamps[i]}]`.length;
    const bodyEnd =
      i + 1 < positions.length ? positions[i + 1] : content.length;
    const body = content.slice(headerEnd, bodyEnd).trim();

    if (body.length > 0) {
      entries.push({ created_at: timestamps[i], content: body });
    }
  }

  if (entries.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  // Supabaseにバルクインサート
  const db = supabase();
  const { error } = await db.from("memos").insert(entries);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: entries.length }, { status: 201 });
}
