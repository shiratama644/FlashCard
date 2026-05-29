"use client";

import { useEffect, useRef, useState } from "react";

export type ViewDirection = "left" | "right" | "dynamic" | "fade";

const ENTER_FROM: Record<ViewDirection, string> = {
  left: "view-enter-from-left",
  right: "view-enter-from-right",
  dynamic: "view-enter-from-dynamic",
  fade: "opacity-0 scale-95",
};

const LEAVE_TO: Record<ViewDirection, string> = {
  left: "view-leave-to-left",
  right: "view-leave-to-right",
  dynamic: "view-leave-to-dynamic",
  fade: "opacity-0 scale-105",
};

const ENTER_DURATION = 500;
const LEAVE_DURATION = 300;

type ViewTransitionProps = {
  show: boolean;
  direction: ViewDirection;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Faithful React port of old-site's Alpine `x-show` + `x-transition` directional
 * view transitions. The element stays mounted (mirroring `x-show`'s display
 * toggle) so each view preserves its own state across navigation; only the
 * `display` and transition classes change.
 */
export function ViewTransition({ show, direction, className = "", style, children }: ViewTransitionProps) {
  const [visible, setVisible] = useState(show);
  const [transitionClass, setTransitionClass] = useState("");
  const prevShow = useRef<boolean | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasShown = prevShow.current;
    prevShow.current = show;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (show) {
      setVisible(true);
      setTransitionClass(`view-enter-active ${ENTER_FROM[direction]}`);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setTransitionClass("view-enter-active view-enter-to");
        });
      });
      timeoutRef.current = setTimeout(() => setTransitionClass(""), ENTER_DURATION);
    } else if (wasShown === null) {
      setVisible(false);
    } else {
      setTransitionClass("view-leave-active-fast view-enter-to");
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setTransitionClass(`view-leave-active-fast ${LEAVE_TO[direction]}`);
        });
      });
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setTransitionClass("");
      }, LEAVE_DURATION);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show, direction]);

  return (
    <div className={`${className} ${transitionClass}`.trim()} style={{ ...style, display: visible ? undefined : "none" }}>
      {children}
    </div>
  );
}
