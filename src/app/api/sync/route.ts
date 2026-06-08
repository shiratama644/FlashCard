import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PersistenceSnapshotSchema } from "@/features/flashcard/data/schema";

// 課金ユーザーのクラウド同期 API（サーバ専用）。
// ブラウザ（SupabaseAdapter）は Supabase を直叩きせず、同一オリジンのこのルート経由でアクセスする。
// ここで Auth.js の auth() によりユーザーを特定し、必ずそのユーザーの行だけを read/write する
// （service_role は RLS をバイパスするため、ユーザー分離はこのサーバ側ロジックで強制する）。
//
// 契約:
//   GET  /api/sync           -> 200 { snapshot: PersistenceSnapshot | null } / 401（未認証）
//   PUT  /api/sync  { snapshot } -> 200 { ok: true } / 400（不正body）/ 401（未認証）

// 認証必須のため動的レンダリング（プリレンダリング対象外）。
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("decks")
    .select("snapshot")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // 未保存（初回）は null を返す。呼び出し側（adapter）は null を「未保存」とみなす。
  return NextResponse.json({ snapshot: data?.snapshot ?? null });
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // body は { snapshot: {...} } を想定。snapshot を実行時検証し、不正なら 400。
  const parsed = PersistenceSnapshotSchema.safeParse((body as { snapshot?: unknown })?.snapshot);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid snapshot" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 先に users 行を保証する（decks.user_id の外部キー制約のため）。
  // id / email のみを渡すので、既存行の tier / stripe_customer_id は上書きしない。
  const { error: userError } = await supabase
    .from("users")
    .upsert({ id: userId, email: session.user?.email ?? null }, { onConflict: "id" });
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // スナップショットを 1 行（JSONB）として upsert。updated_at はトリガが自動更新する。
  const { error: deckError } = await supabase
    .from("decks")
    .upsert({ user_id: userId, snapshot: parsed.data }, { onConflict: "user_id" });
  if (deckError) {
    return NextResponse.json({ error: deckError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
