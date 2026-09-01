import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";

// Stripe Customer Portal（支払い方法の変更・解約）へのサーバ起点リダイレクト（ログイン必須）。
// - users.stripe_customer_id を持つ＝過去に Checkout を通ったユーザーのみ利用可能。
// - Checkout と同様、Portal URL へ 303 リダイレクトする（Stripe.js 非埋め込み・CSP 不変）。
//
// 契約:
//   POST /api/stripe/portal -> 303 redirect（Portal URL） / 401（未認証） / 400（customer 未作成） / 500
export const dynamic = "force-dynamic";

function resolveOrigin(req: Request): string {
  return req.headers.get("origin") ?? process.env.AUTH_URL ?? new URL(req.url).origin;
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: userRow, error: userReadError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (userReadError) {
    return NextResponse.json({ error: userReadError.message }, { status: 500 });
  }

  const customerId = userRow?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "no stripe customer" }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = resolveOrigin(req);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/`,
  });

  return NextResponse.redirect(portal.url, 303);
}
