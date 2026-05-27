"use client";

export async function animateCardEnter(element: HTMLElement | null) {
  if (!element || typeof window === "undefined") return;
  const { gsap } = await import("gsap");

  await new Promise<void>((resolve) => {
    gsap.fromTo(
      element,
      { opacity: 0.7, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        onComplete: () => resolve(),
      }
    );
  });
}
