"use client";

// Alpine.js の x-show + x-transition を忠実に再現するコンポーネント。
// 要素は常にマウントしたまま、表示/非表示は display と enter/leave クラスの
// 付け外しで制御する（Alpine と同じ挙動）。
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface TransitionProps {
  show: boolean;
  enter: string;
  enterStart: string;
  enterEnd: string;
  leave: string;
  leaveStart: string;
  leaveEnd: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// transition-duration + transition-delay（ms）を算出
const getDurationMs = (el: HTMLElement): number => {
  const cs = getComputedStyle(el);
  const parse = (v: string): number =>
    v.split(",").reduce((max, s) => {
      const t = s.trim();
      const num = t.endsWith("ms") ? parseFloat(t) : parseFloat(t) * 1000;
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
  return parse(cs.transitionDuration) + parse(cs.transitionDelay);
};

export function Transition({ show, enter, enterStart, enterEnd, leave, leaveStart, leaveEnd, className, style, children, onClick }: TransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const prev = useRef(show);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cls = (s: string) => s.split(/\s+/).filter(Boolean);
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      timer.current = null;
      rafId.current = null;
    };

    if (first.current) {
      first.current = false;
      prev.current = show;
      // 初期表示は遷移なし（Alpine の初期 x-show 相当）
      el.style.display = show ? "" : "none";
      return;
    }
    if (show === prev.current) return;
    prev.current = show;
    clear();

    if (show) {
      el.classList.remove(...cls(leave), ...cls(leaveStart), ...cls(leaveEnd));
      el.style.display = "";
      el.classList.add(...cls(enter), ...cls(enterStart));
      rafId.current = requestAnimationFrame(() => {
        el.classList.remove(...cls(enterStart));
        el.classList.add(...cls(enterEnd));
        const d = getDurationMs(el);
        timer.current = setTimeout(() => {
          el.classList.remove(...cls(enter), ...cls(enterEnd));
        }, d);
      });
    } else {
      el.classList.remove(...cls(enter), ...cls(enterStart), ...cls(enterEnd));
      el.classList.add(...cls(leave), ...cls(leaveStart));
      rafId.current = requestAnimationFrame(() => {
        el.classList.remove(...cls(leaveStart));
        el.classList.add(...cls(leaveEnd));
        const d = getDurationMs(el);
        timer.current = setTimeout(() => {
          el.classList.remove(...cls(leave), ...cls(leaveEnd));
          el.style.display = "none";
        }, d);
      });
    }

    return clear;
  }, [show, enter, enterStart, enterEnd, leave, leaveStart, leaveEnd]);

  return (
    <div ref={ref} className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
