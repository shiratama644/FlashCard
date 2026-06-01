"use client";

// #global-loader の表示制御（init.js の hideLoader 相当）
import { useEffect, useRef } from "react";
import { useStore } from "@/store/StoreProvider";

export function GlobalLoader() {
  const store = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRef(false);

  useEffect(() => {
    if (!store.isLoaded || hidden.current) return;
    hidden.current = true;
    const loader = ref.current;
    if (loader) {
      loader.style.opacity = "0";
      loader.style.visibility = "hidden";
      setTimeout(() => {
        loader.style.display = "none";
      }, 600);
    }
  }, [store.isLoaded]);

  return (
    <div id="global-loader" ref={ref}>
      <div className="loader-spinner"></div>
      <div className="loader-text">Loading...</div>
    </div>
  );
}
