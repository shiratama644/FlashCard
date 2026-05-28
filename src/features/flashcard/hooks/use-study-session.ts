"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, Project, Tag } from "@/types/flashcard";

type SessionStats = {
  like: number;
  nope: number;
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

  // Drag state
  const [swipeX, setSwipeX] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentSwipeX = useRef(0);
  const targetSwipeX = useRef(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const overlayBgRef = useRef<HTMLDivElement | null>(null);
  const likeStampRef = useRef<HTMLDivElement | null>(null);
  const nopeStampRef = useRef<HTMLDivElement | null>(null);

  // Lerp animation
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (project) {
      const cards = [...project.cards];
      setCurrentCards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
      setSessionStats({ like: 0, nope: 0 });
    }
  }, [project]);

  const flipCard = useCallback(() => {
    if (isAnimating) return;
    setIsFlipped((prev) => !prev);
  }, [isAnimating]);

  const toggleReverseMode = useCallback(() => {
    setIsReverseMode((prev) => !prev);
    setIsFlipped(false);
  }, []);

  const shuffleCards = useCallback(() => {
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
  }, []);

  const resetStudy = useCallback(() => {
    if (!project) return;
    setCurrentCards([...project.cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionStats({ like: 0, nope: 0 });
  }, [project]);

  const updateSwipeVisuals = useCallback((x: number) => {
    const el = cardRef.current;
    if (!el) return;
    const rotation = x * 0.08;
    el.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;

    const progress = Math.min(Math.abs(x) / 120, 1);
    if (overlayBgRef.current) {
      overlayBgRef.current.style.backgroundColor =
        x > 0
          ? `rgba(52,211,153,${progress * 0.2})`
          : x < 0
            ? `rgba(248,113,113,${progress * 0.2})`
            : "transparent";
    }
    if (likeStampRef.current) {
      likeStampRef.current.style.opacity = x > 0 ? String(progress) : "0";
    }
    if (nopeStampRef.current) {
      nopeStampRef.current.style.opacity = x < 0 ? String(progress) : "0";
    }
  }, []);

  const lerpLoop = useCallback(() => {
    currentSwipeX.current += (targetSwipeX.current - currentSwipeX.current) * 0.15;
    updateSwipeVisuals(currentSwipeX.current);
    setSwipeX(currentSwipeX.current);
    animFrameRef.current = requestAnimationFrame(lerpLoop);
  }, [updateSwipeVisuals]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(lerpLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [lerpLoop]);

  const nextCard = useCallback(
    (direction: 1 | -1) => {
      if (isAnimating || isCompleted) return;
      setIsAnimating(true);

      const card = currentCards[currentIndex];
      if (!card) { setIsAnimating(false); return; }

      onCardSwiped?.(project!.id, currentIndex, direction, card);
      setSessionStats((prev) => ({
        like: prev.like + (direction === 1 ? 1 : 0),
        nope: prev.nope + (direction === -1 ? 1 : 0),
      }));

      // Animate out
      const el = cardRef.current;
      if (el) {
        const flyX = direction * window.innerWidth;
        el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = `translateX(${flyX}px) rotate(${direction * 30}deg)`;
      }

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx >= currentCards.length) {
          const total = sessionStats.like + sessionStats.nope + 1;
          const likes = sessionStats.like + (direction === 1 ? 1 : 0);
          setDonutPercentage(Math.round((likes / total) * 100));
          setIsCompleted(true);
        } else {
          setCurrentIndex(nextIdx);
        }
        setIsFlipped(false);
        targetSwipeX.current = 0;
        currentSwipeX.current = 0;
        if (el) {
          el.style.transition = "none";
          el.style.transform = "translateX(0) rotate(0deg)";
        }
        if (overlayBgRef.current) overlayBgRef.current.style.backgroundColor = "transparent";
        if (likeStampRef.current) likeStampRef.current.style.opacity = "0";
        if (nopeStampRef.current) nopeStampRef.current.style.opacity = "0";

        setIsAnimating(false);
      }, 400);
    },
    [isAnimating, isCompleted, currentCards, currentIndex, project, onCardSwiped, sessionStats],
  );

  const swipeOut = useCallback(
    (direction: 1 | -1) => {
      nextCard(direction);
    },
    [nextCard],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isAnimating || isCompleted) return;
      isDragging.current = true;
      startX.current = e.clientX;
      targetSwipeX.current = 0;
      currentSwipeX.current = 0;
    },
    [isAnimating, isCompleted],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      targetSwipeX.current = delta;
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const finalX = currentSwipeX.current;
    const threshold = 100;

    if (Math.abs(finalX) > threshold) {
      nextCard(finalX > 0 ? 1 : -1);
    } else {
      targetSwipeX.current = 0;
    }
  }, [nextCard]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (Math.abs(currentSwipeX.current) < 5) {
        flipCard();
      }
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

  return {
    currentCards,
    currentIndex,
    isFlipped,
    isCompleted,
    isAnimating,
    isReverseMode,
    sessionStats,
    donutPercentage,
    swipeX,

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
  };
}
