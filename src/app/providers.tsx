"use client";

import { SessionProvider } from "next-auth/react";

// 認証セッションをクライアントツリーへ供給する。
// 子要素はそのまま描画するため、未ログイン（ゲスト）の見た目・挙動は不変。
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
