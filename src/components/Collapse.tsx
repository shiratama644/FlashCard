"use client";

// Alpine.js の x-collapse を忠実に再現（duration 250ms / cubic-bezier(0.4,0,0.2,1)）。
import { useEffect, useRef, type ReactNode } from "react";

const DURATION = 250;
const EASING = "cubic-bezier(0.4, 0.0, 0.2, 1)";

export function Collapse({ show, children, className }: { show: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const prev = useRef(show);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEndEnter = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "height") return;
      el.style.transition = "";
      el.style.height = "auto";
      el.style.overflow = "";
      el.removeEventListener("transitionend", onEndEnter);
    };
    const onEndLeave = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "height") return;
      el.style.transition = "";
      el.style.display = "none";
      el.removeEventListener("transitionend", onEndLeave);
    };

    if (first.current) {
      first.current = false;
      prev.current = show;
      if (!show) {
        el.style.height = "0px";
        el.style.overflow = "hidden";
        el.style.display = "none";
      }
      return;
    }
    if (show === prev.current) return;
    prev.current = show;

    el.removeEventListener("transitionend", onEndEnter);
    el.removeEventListener("transitionend", onEndLeave);

    if (show) {
      el.style.display = "";
      el.style.overflow = "hidden";
      el.style.height = "auto";
      const full = el.getBoundingClientRect().height;
      el.style.height = "0px";
      void el.offsetHeight; // リフロー強制
      el.style.transition = `height ${DURATION}ms ${EASING}`;
      el.style.height = `${full}px`;
      el.addEventListener("transitionend", onEndEnter);
    } else {
      const full = el.getBoundingClientRect().height;
      el.style.height = `${full}px`;
      el.style.overflow = "hidden";
      void el.offsetHeight; // リフロー強制
      el.style.transition = `height ${DURATION}ms ${EASING}`;
      el.style.height = "0px";
      el.addEventListener("transitionend", onEndLeave);
    }

    return () => {
      el.removeEventListener("transitionend", onEndEnter);
      el.removeEventListener("transitionend", onEndLeave);
    };
  }, [show]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
