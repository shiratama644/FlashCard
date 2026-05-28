"use client";

import { useMemo, useState } from "react";
import type { Card, Project } from "@/types/flashcard";

export function useStudySession(project: Project | null) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = useMemo<Card[]>(() => project?.cards ?? [], [project]);
  const currentCard = cards[currentIndex] ?? null;

  function nextCard() {
    setCurrentIndex((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
    setIsFlipped(false);
  }

  function flipCard() {
    setIsFlipped((prev) => !prev);
  }

  return { cards, currentCard, currentIndex, isFlipped, nextCard, flipCard, setCurrentIndex };
}
