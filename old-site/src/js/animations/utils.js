import gsap from 'gsap';

export const AnimationUtils = {
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },
  lerpAdjusted(start, end, speed, dt) {
    return end + (start - end) * Math.exp(-speed * dt);
  },
  createRenderLoop(renderCallback) {
    let isRunning = false;
    const loop = (time, deltaTime, frame) => {
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
      }
    };
  }
};