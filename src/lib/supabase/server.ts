import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// service_role 権限の Supabase クライアント（サーバ専用）。
// `server-only` により、誤ってクライアントバンドルへ取り込むとビルドエラーになる。
// service_role キーは RLS をバイパスするため、呼び出し側（API ルート）で必ず
// auth() のユーザーに紐づく行だけを read/write すること。

let cached: SupabaseClient | null = null;

// 環境変数（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）から
// service_role クライアントを生成する。未設定なら明示的に例外を投げる
// （未設定のまま無言で動かないようにする。ゲスト/無料経路はこの関数を呼ばない）。
export function createServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase の環境変数（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）が未設定です");
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
