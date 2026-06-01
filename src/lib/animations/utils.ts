// old-site/src/js/animations/utils.js の忠実移植
import gsap from "gsap";

export interface RenderLoop {
  start: () => void;
  stop: () => void;
}

export const AnimationUtils = {
  lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  },
  lerpAdjusted(start: number, end: number, speed: number, dt: number): number {
    return end + (start - end) * Math.exp(-speed * dt);
  },
  createRenderLoop(renderCallback: (dtSec: number) => void): RenderLoop {
    let isRunning = false;
    const loop = (_time: number, deltaTime: number): void => {
      if (!isRunning) return;
      const dtSec = Math.min(deltaTime / 1000, 0.1);
      renderCallback(dtSec);
    };
    return {
      start() {
        if (!isRunning) {
          isRunning = true;
          gsap.ticker.add(loop);
        }
      },
      stop() {
        isRunning = false;
        gsap.ticker.remove(loop);
      },
    };
  },
};
