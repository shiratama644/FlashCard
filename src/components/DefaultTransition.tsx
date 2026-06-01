"use client";

// Alpine.js のデフォルト x-transition（修飾子なし）を再現。
// enter: 150ms / leave: 75ms、opacity 0↔1・scale 0.95↔1、origin center。
import { useEffect, useRef, type ReactNode } from "react";

const EASING = "cubic-bezier(0.4, 0.0, 0.2, 1)";

export function DefaultTransition({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const prev = useRef(show);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };

    if (first.current) {
      first.current = false;
      prev.current = show;
      el.style.display = show ? "" : "none";
      return;
    }
    if (show === prev.current) return;
    prev.current = show;
    clear();

    el.style.transformOrigin = "center";
    el.style.transitionProperty = "opacity, transform";
    el.style.transitionTimingFunction = EASING;

    if (show) {
      el.style.display = "";
      el.style.transitionDuration = "0s";
      el.style.opacity = "0";
      el.style.transform = "scale(0.95)";
      void el.offsetHeight;
      rafId.current = requestAnimationFrame(() => {
        el.style.transitionDuration = "150ms";
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      });
    } else {
      el.style.transitionDuration = "75ms";
      el.style.opacity = "0";
      el.style.transform = "scale(0.95)";
      timer.current = setTimeout(() => {
        el.style.display = "none";
      }, 75);
    }
    return clear;
  }, [show]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
