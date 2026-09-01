import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// 認証基盤（Auth.js v5）。
// - 環境変数 AUTH_SECRET / AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET を自動参照する。
// - 段階リリースのためログインは任意。未ログイン（ゲスト）は従来どおりローカル（IndexedDB）で動作する。
// - セッションは JWT 戦略（DB 不要）。クラウド同期は課金ユーザー向けに後続フェーズで追加する。
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    // JWT の sub（= ユーザー識別子）を session.user.id に載せる。
    // 既定ではセッションに id が入らないため、クラウド同期 API（/api/sync）が
    // ユーザーを特定できるようにここで明示的にコピーする。
    // （tier の付与は後続 P1-e3 でこのコールバックを拡張する）
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
