// old-site/src/js/animations/setup.js の忠実移植
import gsap from "gsap";

export const setupAnimations = (): void => {
  gsap.ticker.fps(120);
};
