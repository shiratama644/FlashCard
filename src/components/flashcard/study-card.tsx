"use client";

import { useRef } from "react";
import { animateCardEnter } from "@/lib/animation/gsap.client";
import { fireSuccessConfetti } from "@/lib/animation/confetti.client";
import { Button } from "@/components/ui/button";

type StudyCardProps = {
  front: string;
  backDetails: string[];
};

export function StudyCard({ front, backDetails }: StudyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleLike() {
    await animateCardEnter(cardRef.current);
    await fireSuccessConfetti();
  }

  return (
    <section className="space-y-4">
      <div ref={cardRef} className="rounded-3xl border border-white/20 bg-white/10 p-6">
        <h2 className="text-3xl font-extrabold">{front}</h2>
        <ul className="mt-4 space-y-2">
          {backDetails.map((detail) => (
            <li key={detail} className="rounded-lg bg-black/20 px-3 py-2 text-sm">
              {detail}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <Button variant="danger">NOPE</Button>
        <Button onClick={handleLike}>LIKE</Button>
      </div>
    </section>
  );
}
