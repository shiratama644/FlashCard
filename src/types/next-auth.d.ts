import type { DefaultSession } from "next-auth";

// 課金ティア。Supabase users.tier が真実源（Stripe Webhook が更新）。
export type UserTier = "free" | "premium";

declare module "next-auth" {
  // セッションの user に id（token.sub）と tier を載せる。
  // 既定の Session.user には id/tier が無いため、ここで型を拡張する。
  interface Session {
    user: {
      id: string;
      tier: UserTier;
    } & DefaultSession["user"];
  }
}

// JWT に tier をキャッシュする（jwt コールバックで Supabase から取得）。
// コールバックの token 型は @auth/core/jwt の JWT を参照するため、そちらを拡張する
//（next-auth/jwt は再エクスポートのみで、ここを拡張しても本体にはマージされない）。
declare module "@auth/core/jwt" {
  interface JWT {
    tier?: UserTier;
    // tier を Supabase から取得した時刻(epoch ms)。TTL 判定に使い、毎回の問い合わせを避ける。
    tierFetchedAt?: number;
  }
}
