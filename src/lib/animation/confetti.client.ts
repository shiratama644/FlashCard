"use client";

export async function fireSuccessConfetti() {
  if (typeof window === "undefined") return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, disableForReducedMotion: true });
}
