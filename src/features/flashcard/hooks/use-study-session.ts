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

export function useStudySession(
  project: Project | null,
  tagMap: Record<string | number, Tag>,
  onCardSwiped?: (projectId: string | number, cardIndex: number, direction: 1 | -1, card: Card) => void,
) {
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
  const likeIconRef = useRef<HTMLElement | null>(null);
  const nopeIconRef = useRef<HTMLElement | null>(null);

  const dragLoopId = useRef<number | null>(null);
  const statsRef = useRef<SessionStats>({ like: 0, nope: 0 });
  const prevProjectId = useRef<string | number | null>(null);

  const getOverlayRefs = useCallback((): OverlayRefs => ({
    likeStamp: likeStampRef.current,
    nopeStamp: nopeStampRef.current,
    overlayBg: overlayBgRef.current,
    likeIcon: likeIconRef.current,
    nopeIcon: nopeIconRef.current,
  }), []);

  useEffect(() => {
    if (project && project.id !== prevProjectId.current) {
      prevProjectId.current = project.id;
      setCurrentCards([...project.cards]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
      setSessionStats({ like: 0, nope: 0 });
      statsRef.current = { like: 0, nope: 0 };
    }
  }, [project]);

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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragLoopId.current) {
      cancelAnimationFrame(dragLoopId.current);
      dragLoopId.current = null;
    }

    if (isSwipeMode.current !== false) {
      const threshold = window.innerWidth * 0.25;
      if (currentSwipeX.current > threshold) {
        swipeOut(1);
        return;
      } else if (currentSwipeX.current < -threshold) {
        swipeOut(-1);
        return;
      } else {
        animateSnapBack(cardRef.current, getOverlayRefs());
        targetSwipeX.current = 0;
        currentSwipeX.current = 0;
      }
    }

    if (cardRef.current) gsap.set(cardRef.current, { willChange: "auto" });
    isSwipeMode.current = null;
  }, [swipeOut, getOverlayRefs]);

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
      if (isCompleted || isAnimating) return;
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
  }, [isCompleted, isAnimating, swipeOut, flipCard]);

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
    handlePointerMove,
    handlePointerUp,
    handleClick,

    cardRef,
    overlayBgRef,
    likeStampRef,
    nopeStampRef,
    likeIconRef,
    nopeIconRef,
  };
}
