import "server-only";

import Stripe from "stripe";

// Stripe クライアント（サーバ専用）。
// `server-only` により、誤ってクライアントバンドルに取り込まれるとビルドエラーになる。
// STRIPE_SECRET_KEY は決済操作の権限を持つ重大なシークレットなので、ブラウザへは絶対に出さない。
// 未設定なら呼び出し時に例外を投げる（無料/ゲスト経路は決済 API を呼ばないため影響しない）。

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe の環境変数（STRIPE_SECRET_KEY）が未設定です");
  }

  // apiVersion は固定せず Stripe アカウントの既定を使う（SDK 更新時のバージョン不整合を避ける）。
  cached = new Stripe(secretKey);
  return cached;
}
