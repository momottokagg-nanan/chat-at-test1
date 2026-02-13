import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: タグ一覧取得
export async function GET() {
  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(tags);
}
