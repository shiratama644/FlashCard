import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";

// 課金（premium）への Stripe Checkout を開始するサーバ起点リダイレクト（ログイン必須）。
// - サーバで Checkout Session を作成し、その URL へ 303 リダイレクトする。
//   ブラウザは <form method="post"> の通常遷移で Stripe へ移動するため、Stripe.js を埋め込まず
//   CSP（connect-src 'self'）を緩めずに済む。
// - Stripe Customer は users.stripe_customer_id にキャッシュし、無ければ作成して保存する。
// - 実際の tier 更新は Webhook（P1-f2）が users.tier='premium' に反映する。ここでは課金導線のみ。
//
// 契約:
//   POST /api/stripe/checkout -> 303 redirect（Stripe Checkout URL） / 401（未認証） / 500（設定不備）
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

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRICE_ID is not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const supabase = createServiceClient();

  // 既存の Stripe Customer を取得（なければ後で作成）。
  const { data: userRow, error: userReadError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (userReadError) {
    return NextResponse.json({ error: userReadError.message }, { status: 500 });
  }

  let customerId: string | null = userRow?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user?.email ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    // users 行を upsert し、customer id を保存（tier は触らない＝既存値を保持）。
    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        { id: userId, email: session.user?.email ?? null, stripe_customer_id: customerId },
        { onConflict: "id" },
      );
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const origin = resolveOrigin(req);
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Webhook で userId を特定できるよう紐付ける（client_reference_id と subscription metadata）。
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancel`,
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "failed to create checkout session" }, { status: 500 });
  }
  // 303 にして POST → GET のリダイレクト（ブラウザが Stripe へ遷移）。
  return NextResponse.redirect(checkout.url, 303);
}
