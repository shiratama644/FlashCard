"use client";

// currentView 切替に伴う副作用をまとめて担うコンポーネント。
// 旧実装ではこれらを FlashcardStore.currentView の setter 内で実行していたが、
// 「状態更新」と「副作用（DOM 変更・アニメ起動）」を分離するため、React 側の
// useLayoutEffect へ寄せた（SKILL #5）。setter は純粋に状態更新のみを行う。
//
// 担う副作用:
//  - ビュー遷移用 CSS 変数 --tx/--ty（cardList/stats は右方向、それ以外は下方向）
//  - streak ビュー表示時の連続記録カウントアップ起動
//
// 自身は何も描画しない（null）。currentView だけを購読するため、ビュー切替時に
// 再描画されるのはこのコンポーネントのみで、兄弟コンポーネントへ波及しない
// （PR #14/#16 の選択的再描画を維持）。CSS 変数の設定は描画反映前に確定させたい
// ため useEffect ではなく useLayoutEffect を使う。
import { useLayoutEffect } from "react";
import { useStoreInstance, useStoreSelector } from "@/features/flashcard/state/StoreProvider";

export function ViewTransitionEffects() {
  const store = useStoreInstance();
  const currentView = useStoreSelector((s) => s.currentView);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (currentView === "cardList" || currentView === "stats") {
      root.style.setProperty("--tx", "2.5rem");
      root.style.setProperty("--ty", "0");
    } else {
      root.style.setProperty("--tx", "0");
      root.style.setProperty("--ty", "2.5rem");
    }
    if (currentView === "streak") store.animateStreak();
    // store は安定参照。currentView の変化時のみ実行する。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  return null;
}
