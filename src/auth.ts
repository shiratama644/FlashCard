import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createServiceClient } from "@/lib/supabase/server";

// 認証基盤（Auth.js v5）。
// - 環境変数 AUTH_SECRET / AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET を自動参照する。
// - 段階リリースのためログインは任意。未ログイン（ゲスト）は従来どおりローカル（IndexedDB）で動作する。
// - セッションは JWT 戦略（DB 不要）。課金（premium）判定は Supabase users.tier を真実源とし、
//   jwt コールバックで取得して session.user.tier に載せる（クライアントのアダプタ切替に使う）。
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    // Supabase の users.tier を取得して JWT にキャッシュする。
    // tier の真実源は Supabase（Stripe Webhook が更新）。row が無い/未設定なら "free"。
    // Supabase 未設定（env なし）や取得失敗時も "free" にフォールバックし、ログイン自体は壊さない
    //（無料/ゲスト経路は Supabase に一切依存しない）。
    // パフォーマンス: jwt コールバックは毎回のセッション参照で走る。毎回 Supabase に問い合わせると
    // レイテンシ・コストが増えるため、サインイン時と TTL 切れ時のみ問い合わせ、それ以外は token の
    // キャッシュ値を使う（Stripe Webhook 後は最大 TTL_MS の遅延で反映、再ログインで即時反映）。
    async jwt({ token, trigger }) {
      if (!token.sub) return token;
      const now = Date.now();
      const TIER_TTL_MS = 5 * 60 * 1000; // 5 分
      const isSignIn = trigger === "signIn" || trigger === "signUp";
      const fresh = typeof token.tierFetchedAt === "number" && now - token.tierFetchedAt < TIER_TTL_MS;
      if (!isSignIn && token.tier && fresh) return token; // キャッシュ有効＝問い合わせない
      try {
        const supabase = createServiceClient();
        const { data } = await supabase
          .from("users")
          .select("tier")
          .eq("id", token.sub)
          .maybeSingle();
        token.tier = data?.tier === "premium" ? "premium" : "free";
        token.tierFetchedAt = now;
      } catch {
        token.tier = token.tier ?? "free";
        // 失敗時もタイムスタンプを更新し、TTL の間は再問い合わせしない
        //（Supabase 到達不可時に毎リクエストでハングするのを防ぐ）。
        token.tierFetchedAt = now;
      }
      return token;
    },
    // JWT の sub（ユーザー識別子）と tier を session.user に載せる。
    // 既定ではセッションに id/tier が入らないため、ここで明示的にコピーする
    //（id はクラウド同期 API のユーザー特定、tier はクライアントのアダプタ切替に使う）。
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.tier = token.tier === "premium" ? "premium" : "free";
      }
      return session;
    },
  },
});
