"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, Project, Tag } from "@/types/flashcard";
import {
  gsap,
  animateCardEnter,
  animateShuffleCard,
  animateSwipeOut,
  animateToggleReverse,
  animateDonutProgress,
  animateSnapBack,
  animateLikeIcon,
  animateNopeIcon,
  resetOverlayStyles,
} from "@/lib/animation/gsap.client";
import confetti from "canvas-confetti";

type SessionStats = {
  like: number;
  nope: number;
};

type OverlayRefs = {
  likeStamp: HTMLElement | null;
  nopeStamp: HTMLElement | null;
  overlayBg: HTMLElement | null;
  likeIcon: HTMLElement | null;
  nopeIcon: HTMLElement | null;
};

type StudySessionOptions = {
  /** Reverse-mode flag applied (without animation) when a session starts. */
  reverse?: boolean;
  /** Bumped by the caller on every `openProject` to (re)start the session. */
  sessionNonce?: number;
  /** When false, global keyboard shortcuts are ignored (view not active). */
  enabled?: boolean;
};

export function useStudySession(
  project: Project | null,
  tagMap: Record<string | number, Tag>,
  onCardSwiped?: (projectId: string | number, cardIndex: number, direction: 1 | -1, card: Card) => void,
  options?: StudySessionOptions,
) {
  const reverse = options?.reverse ?? false;
  const sessionNonce = options?.sessionNonce ?? 0;
  const enabled = options?.enabled ?? true;
  const [currentCards, setCurrentCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isReverseMode, setIsReverseMode] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ like: 0, nope: 0 });
  const [donutPercentage, setDonutPercentage] = useState(0);

  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const isSwipeMode = useRef<boolean | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentSwipeX = useRef(0);
  const targetSwipeX = useRef(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const overlayBgRef = useRef<HTMLDivElement | null>(null);
  const likeStampRef = useRef<HTMLDivElement | null>(null);
  const nopeStampRef = useRef<HTMLDivElement | null>(null);
  const likeIconRef = useRef<HTMLButtonElement | null>(null);
  const nopeIconRef = useRef<HTMLButtonElement | null>(null);

  const dragLoopId = useRef<number | null>(null);
  const statsRef = useRef<SessionStats>({ like: 0, nope: 0 });

  const getOverlayRefs = useCallback((): OverlayRefs => ({
    likeStamp: likeStampRef.current,
    nopeStamp: nopeStampRef.current,
    overlayBg: overlayBgRef.current,
    likeIcon: likeIconRef.current,
    nopeIcon: nopeIconRef.current,
  }), []);

  // Start a fresh session whenever the caller opens a project (sessionNonce bump).
  // Mirrors old-site `openProject`, which resets all session state and applies
  // the reverse flag directly (no flip animation).
  useEffect(() => {
    if (!project) return;
    setCurrentCards([...project.cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setIsReverseMode(reverse);
    setSessionStats({ like: 0, nope: 0 });
    statsRef.current = { like: 0, nope: 0 };
    setDonutPercentage(0);
  }, [sessionNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const flipCard = useCallback(() => {
    if (isAnimating) return;
    setIsFlipped((prev) => !prev);
  }, [isAnimating]);

  const toggleReverseMode = useCallback(() => {
    if (isAnimating || currentCards.length === 0) return;
    setIsReverseMode((prev) => {
      const next = !prev;
      setIsFlipped(false);
      requestAnimationFrame(() => {
        animateToggleReverse(cardRef.current, next);
      });
      return next;
    });
  }, [isAnimating, currentCards.length]);

  const shuffleCards = useCallback(() => {
    if (!project || project.cards.length === 0 || isAnimating) return;
    setIsAnimating(true);

    animateShuffleCard(
      cardRef.current,
      () => {
        setCurrentCards((prev) => {
          const arr = [...prev];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        });
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsCompleted(false);
        setSessionStats({ like: 0, nope: 0 });
        statsRef.current = { like: 0, nope: 0 };
        setDonutPercentage(0);
        resetOverlayStyles(getOverlayRefs());
      },
      () => setIsAnimating(false),
    );
  }, [project, isAnimating, getOverlayRefs]);

  const resetStudy = useCallback(() => {
    if (!project) return;
    setCurrentCards([...project.cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionStats({ like: 0, nope: 0 });
    statsRef.current = { like: 0, nope: 0 };
    setDonutPercentage(0);
    requestAnimationFrame(() => {
      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { clearProps: "all" });
        gsap.set(cardRef.current, { transformOrigin: "50% 100%" });
      }
      resetOverlayStyles(getOverlayRefs());
    });
  }, [project, getOverlayRefs]);

  // Drag update loop using GSAP lerp
  const updateDrag = useCallback(() => {
    if (!isDragging.current || isSwipeMode.current === false || !cardRef.current) return;

    const speed = 0.15;
    currentSwipeX.current += (targetSwipeX.current - currentSwipeX.current) * speed;
    const rotate = currentSwipeX.current * 0.04;

    gsap.set(cardRef.current, {
      x: currentSwipeX.current,
      rotation: rotate,
      force3D: true,
    });

    const likeOpacity = currentSwipeX.current > 20 ? Math.min(1, currentSwipeX.current / 100) : 0;
    const nopeOpacity = currentSwipeX.current < -20 ? Math.min(1, -currentSwipeX.current / 100) : 0;

    if (likeStampRef.current) likeStampRef.current.style.opacity = String(likeOpacity);
    if (nopeStampRef.current) nopeStampRef.current.style.opacity = String(nopeOpacity);

    if (overlayBgRef.current) {
      if (currentSwipeX.current > 0) overlayBgRef.current.style.backgroundColor = `rgba(16, 185, 129, ${likeOpacity * 0.2})`;
      else if (currentSwipeX.current < 0) overlayBgRef.current.style.backgroundColor = `rgba(239, 68, 68, ${nopeOpacity * 0.2})`;
      else overlayBgRef.current.style.backgroundColor = "transparent";
    }

    const likeScale = currentSwipeX.current > 20 ? 1.2 : 1;
    const nopeScale = currentSwipeX.current < -20 ? 1.2 : 1;
    const likeColor = currentSwipeX.current > 20 ? "#34d399" : "rgba(255,255,255,0.6)";
    const nopeColor = currentSwipeX.current < -20 ? "#f87171" : "rgba(255,255,255,0.6)";

    if (likeIconRef.current) {
      likeIconRef.current.style.transform = `scale(${likeScale})`;
      likeIconRef.current.style.color = likeColor;
    }
    if (nopeIconRef.current) {
      nopeIconRef.current.style.transform = `scale(${nopeScale})`;
      nopeIconRef.current.style.color = nopeColor;
    }

    dragLoopId.current = requestAnimationFrame(updateDrag);
  }, []);

  const swipeOut = useCallback(
    (direction: 1 | -1) => {
      if (isAnimating || isCompleted) return;
      setIsAnimating(true);

      const card = currentCards[currentIndex];
      if (!card) { setIsAnimating(false); return; }

      const cardEl = cardRef.current;
      const isButtonAction = currentSwipeX.current === 0;

      if (cardEl && isButtonAction) {
        gsap.killTweensOf(cardEl);
        gsap.set(cardEl, { opacity: 1, scale: 1, willChange: "transform" });
      }

      onCardSwiped?.(project!.id, currentIndex, direction, card);
      const newLike = statsRef.current.like + (direction === 1 ? 1 : 0);
      const newNope = statsRef.current.nope + (direction === -1 ? 1 : 0);
      statsRef.current = { like: newLike, nope: newNope };
      setSessionStats({ like: newLike, nope: newNope });

      if (direction === 1) {
        animateLikeIcon(likeIconRef.current);
        confetti({
          particleCount: 40, spread: 60, origin: { y: 0.8 },
          colors: ["#34d399", "#10b981", "#059669"],
          disableForReducedMotion: true, zIndex: 100,
        });
      } else {
        animateNopeIcon(nopeIconRef.current);
      }

      animateSwipeOut(
        cardEl,
        direction,
        isButtonAction,
        getOverlayRefs(),
        () => {
          setIsFlipped(false);
          currentSwipeX.current = 0;
          targetSwipeX.current = 0;
          resetOverlayStyles(getOverlayRefs());

          if (currentIndex < currentCards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            requestAnimationFrame(() => {
              setIsAnimating(false);
              animateCardEnter(cardEl);
            });
          } else {
            setIsCompleted(true);
            setIsAnimating(false);
            if (cardEl) gsap.set(cardEl, { willChange: "auto" });

            const total = newLike + newNope;
            const targetPercent = total > 0 ? (newLike / total) * 100 : 0;
            setDonutPercentage(0);
            animateDonutProgress(setDonutPercentage, targetPercent);

            const duration = 1000;
            const end = Date.now() + duration;
            const frame = () => {
              confetti({
                particleCount: 2, angle: 60, spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ["#facc15", "#fbbf24", "#f59e0b", "#34d399", "#60a5fa"],
                zIndex: 100,
              });
              confetti({
                particleCount: 2, angle: 120, spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ["#facc15", "#fbbf24", "#f59e0b", "#34d399", "#60a5fa"],
                zIndex: 100,
              });
              if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
          }
        },
      );
    },
    [isAnimating, isCompleted, currentCards, currentIndex, project, onCardSwiped, getOverlayRefs],
  );

  // --- ドラッグイベント ---
  // 旧実装と同様に、move/up イベントは window に登録する。
  // カード要素にのみバインドすると、指/マウスがカード外に出た瞬間に
  // イベントが途切れてスワイプが効かなくなるため。
  const swipeOutRef = useRef(swipeOut);
  swipeOutRef.current = swipeOut;
  const getOverlayRefsRef = useRef(getOverlayRefs);
  getOverlayRefsRef.current = getOverlayRefs;

  const onWindowPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) hasDragged.current = true;

    if (isSwipeMode.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        isSwipeMode.current = false;
      } else if (Math.abs(deltaX) > 2) {
        isSwipeMode.current = true;
      }
    }

    if (isSwipeMode.current !== false) {
      targetSwipeX.current = deltaX;
    }
  }, []);

  const onWindowPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragLoopId.current) {
      cancelAnimationFrame(dragLoopId.current);
      dragLoopId.current = null;
    }

    if (isSwipeMode.current !== false) {
      const threshold = window.innerWidth * 0.25;
      if (currentSwipeX.current > threshold) {
        swipeOutRef.current(1);
        return;
      } else if (currentSwipeX.current < -threshold) {
        swipeOutRef.current(-1);
        return;
      } else {
        animateSnapBack(cardRef.current, getOverlayRefsRef.current());
        targetSwipeX.current = 0;
        currentSwipeX.current = 0;
      }
    }

    if (cardRef.current) gsap.set(cardRef.current, { willChange: "auto" });
    isSwipeMode.current = null;
  }, []);

  // window イベントの登録/解除
  useEffect(() => {
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
    };
  }, [onWindowPointerMove, onWindowPointerUp]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isAnimating || isCompleted || currentCards.length === 0) return;

      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.set(cardRef.current, { opacity: 1, scale: 1, willChange: "transform" });
      }

      isDragging.current = true;
      hasDragged.current = false;
      isSwipeMode.current = null;
      startX.current = e.clientX;
      startY.current = e.clientY;
      targetSwipeX.current = 0;
      currentSwipeX.current = 0;

      if (cardRef.current) gsap.set(cardRef.current, { willChange: "transform" });

      if (dragLoopId.current) cancelAnimationFrame(dragLoopId.current);
      dragLoopId.current = requestAnimationFrame(updateDrag);
    },
    [isAnimating, isCompleted, currentCards.length, updateDrag],
  );

  const handleClick = useCallback(
    (_e: React.MouseEvent) => {
      if (hasDragged.current) return;
      flipCard();
    },
    [flipCard],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!enabled || currentCards.length === 0 || isAnimating || isCompleted) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          swipeOut(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          swipeOut(1);
          break;
        case " ":
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          flipCard();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, isCompleted, isAnimating, swipeOut, flipCard, currentCards.length]);

  // Cleanup drag loop on unmount
  useEffect(() => {
    return () => {
      if (dragLoopId.current) cancelAnimationFrame(dragLoopId.current);
    };
  }, []);

  return {
    currentCards,
    currentIndex,
    isFlipped,
    isCompleted,
    isAnimating,
    isReverseMode,
    sessionStats,
    donutPercentage,

    flipCard,
    toggleReverseMode,
    shuffleCards,
    resetStudy,
    swipeOut,

    handlePointerDown,
    handleClick,

    cardRef,
    overlayBgRef,
    likeStampRef,
    nopeStampRef,
    likeIconRef,
    nopeIconRef,
  };
}
