"use client";

// #global-loader の表示制御（init.js の hideLoader 相当）
import { useEffect, useRef } from "react";
import { useStoreSelector } from "@/features/flashcard/state/StoreProvider";

export function GlobalLoader() {
  // isLoaded（boolean）だけを購読。他フィールドの commit では再描画されない。
  const isLoaded = useStoreSelector((s) => s.isLoaded);
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRef(false);

  useEffect(() => {
    if (!isLoaded || hidden.current) return;
    hidden.current = true;
    const loader = ref.current;
    if (loader) {
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      setTimeout(() => {
        loader.style.display = "none";
      }, 600);
    }
  }, [isLoaded]);

  return (
    <div id="global-loader" ref={ref}>
      <div className="loader-spinner"></div>
      <div className="loader-text">Loading...</div>
    </div>
  );
}
