import { createClient } from "@supabase/supabase-js";

export function supabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Supabase environment variables are not set: url=${!!supabaseUrl}, key=${!!supabaseAnonKey}`
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
