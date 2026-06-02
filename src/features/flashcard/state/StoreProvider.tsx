"use client";

// FlashcardStore を React に接続するコンテキスト。
// ストアは可変インスタンスだが、再描画は useSyncExternalStore で購読する
// （React 19 標準の外部ストア接続）。context value はストア参照のみで不変にし、
// 旧来の { store, version } 方式（commit ごとに context が変わり全コンシューマが
// 再描画される）を廃止する。
import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { FlashcardStore } from "./FlashcardStore";

const StoreContext = createContext<FlashcardStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<FlashcardStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new FlashcardStore();
  }

  useEffect(() => {
    const store = storeRef.current!;
    void store.init();
    return () => store.dispose();
    // 初回マウント時のみ実行
  }, []);

  return <StoreContext value={storeRef.current}>{children}</StoreContext>;
}

// ストアのインスタンス取得（購読しない）。イベントハンドラや ref からの呼び出し用。
function useStoreInstance(): FlashcardStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore は StoreProvider の内部で使用してください");
  return store;
}

// ストア全体の変更に追従する（commit のたびに再描画）。従来 useStore と同じ挙動。
// 既存コンポーネントの後方互換用。新規・移行では useStoreSelector を推奨。
export function useStore(): FlashcardStore {
  const store = useStoreInstance();
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return store;
}

// セレクタが返す値だけを購読し、その値が変化したときだけ再描画する。
// 将来の段階的な選択的再描画への移行基盤。
//
// 【前提】現状のストアはネストしたフィールドを in-place で書き換える箇所が多い。
// その値を参照等価で購読すると（参照が変わらないため）変更を検知できない。
// 安全に使えるのは「再代入されるプリミティブ（例: isLoaded, currentView）」か、
// 更新のたびに新しい参照を返すよう isEqual（shallowEqual 等）を渡す場合に限る。
export function useStoreSelector<T>(selector: (store: FlashcardStore) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const store = useStoreInstance();
  const selectorRef = useRef(selector);
  const isEqualRef = useRef(isEqual);
  selectorRef.current = selector;
  isEqualRef.current = isEqual;

  // getSnapshot は同値なら前回参照を返す（useSyncExternalStore の無限ループ回避）。
  const cacheRef = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as T });
  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(store);
    const cache = cacheRef.current;
    if (cache.has && isEqualRef.current(cache.value, next)) return cache.value;
    cache.has = true;
    cache.value = next;
    return next;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

// オブジェクト/配列を返すセレクタ向けの浅い比較。
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  // b が同名キーを実際に持つことも確認する（undefined 値と欠損キーの誤一致を防ぐ）。
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key]));
}
