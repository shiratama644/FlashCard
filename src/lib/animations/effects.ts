// old-site/src/js/animations/effects.js の忠実移植
import confetti from "canvas-confetti";

export const Effects = {
  playSwipeRightConfetti(): void {
    if (typeof confetti === "function") {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ["#34d399", "#10b981", "#059669"], disableForReducedMotion: true, zIndex: 100 });
    }
  },
  playCompleteConfetti(): void {
    if (typeof confetti === "function") {
      const duration = 1.0 * 1000;
      const end = Date.now() + duration;
      const frame = (): void => {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ["#facc15", "#fbbf24", "#f59e0b", "#34d399", "#60a5fa"], zIndex: 100 });
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ["#facc15", "#fbbf24", "#f59e0b", "#34d399", "#60a5fa"], zIndex: 100 });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  },
};
