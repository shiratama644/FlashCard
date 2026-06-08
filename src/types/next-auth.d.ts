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

declare module "next-auth/jwt" {
  // JWT に tier をキャッシュする（jwt コールバックで Supabase から取得）。
  interface JWT {
    tier?: UserTier;
  }
}
