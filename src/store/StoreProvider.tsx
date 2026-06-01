"use client";

// FlashcardStore を React に接続するコンテキスト。
// ストアは可変インスタンス、再描画は commit()（version 更新）で行う。
import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { FlashcardStore } from "./FlashcardStore";

const StoreContext = createContext<FlashcardStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
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

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useStore(): FlashcardStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore は StoreProvider の内部で使用してください");
  return store;
}
