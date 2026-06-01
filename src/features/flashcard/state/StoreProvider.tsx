"use client";

// FlashcardStore を React に接続するコンテキスト。
// ストアは可変インスタンス、再描画は commit()（version 更新）で行う。
import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { FlashcardStore } from "./FlashcardStore";

// version を含めて公開することで、commit()（forceUpdate）のたびに
// context value の参照が変わり、useStore を使う全コンシューマが再描画される。
// （store インスタンスだけを value にすると参照が不変のため再描画が伝播しない）
type StoreContextValue = { store: FlashcardStore; version: number };
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [version, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const storeRef = useRef<FlashcardStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new FlashcardStore();
    storeRef.current.attach(forceUpdate);
  }

  useEffect(() => {
    const store = storeRef.current!;
    store.attach(forceUpdate);
    void store.init();
    return () => store.dispose();
    // 初回マウント時のみ実行
  }, []);

  return <StoreContext.Provider value={{ store: storeRef.current, version }}>{children}</StoreContext.Provider>;
}

export function useStore(): FlashcardStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore は StoreProvider の内部で使用してください");
  return ctx.store;
}
