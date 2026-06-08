import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";

// Stripe Webhook 受信口。サブスクの状態変化を users.tier に反映する（課金状態の真実源を更新）。
// - 署名検証（STRIPE_WEBHOOK_SECRET）を必須にし、生ボディ（req.text()）で検証する。
// - checkout.session.completed: 初回課金完了 → tier='premium'（+ stripe_customer_id 保存）。
// - customer.subscription.updated/deleted: 状態に応じて premium/free を更新（解約・支払い失敗で free）。
// - これにより次回サインイン/セッション更新（TTL 切れ）で session.user.tier が変わり、
//   クライアントの applyAuth が SupabaseAdapter ⇄ DexieAdapter を切り替える。
//
// 契約:
//   POST /api/stripe/webhook -> 200 { received: true } / 400（署名検証失敗・設定不備） / 500
export const dynamic = "force-dynamic";

// userId を特定する: subscription/checkout の metadata or client_reference_id を優先し、
// 無ければ stripe_customer_id から users を逆引きする。
async function resolveUserId(
  supabase: ReturnType<typeof createServiceClient>,
  hints: { userId?: string | null; customerId?: string | null },
): Promise<string | null> {
  if (hints.userId) return hints.userId;
  if (!hints.customerId) return null;
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", hints.customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function setTier(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  tier: "free" | "premium",
  customerId: string | null,
): Promise<void> {
  // id をキーに upsert（行が無くても作る）。customerId が判れば併せて保存する。
  const row: { id: string; tier: "free" | "premium"; stripe_customer_id?: string } = { id: userId, tier };
  if (customerId) row.stripe_customer_id = customerId;
  await supabase.from("users").upsert(row, { onConflict: "id" });
}

// サブスクの status から premium 判定する（有効なものだけ premium）。
function isActiveStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export async function POST(req: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 400 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof cs.customer === "string" ? cs.customer : (cs.customer?.id ?? null);
        const userId = await resolveUserId(supabase, {
          userId: cs.client_reference_id ?? cs.metadata?.userId ?? null,
          customerId,
        });
        if (userId) await setTier(supabase, userId, "premium", customerId);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? null);
        const userId = await resolveUserId(supabase, {
          userId: sub.metadata?.userId ?? null,
          customerId,
        });
        if (userId) {
          const premium = event.type === "customer.subscription.updated" && isActiveStatus(sub.status);
          await setTier(supabase, userId, premium ? "premium" : "free", customerId);
        }
        break;
      }
      default:
        // 未対応イベントは無視（200 で ack し Stripe のリトライを止める）。
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "webhook handling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
