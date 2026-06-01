// old-site/src/js/animations/card.js の忠実移植
import gsap from "gsap";

// スワイプ演出で参照する DOM 要素群（old-site の $refs に対応）
export interface CardRefs {
  cardElement: HTMLElement | null;
  likeStamp: HTMLElement | null;
  nopeStamp: HTMLElement | null;
  overlayBg: HTMLElement | null;
  likeIcon: HTMLElement | null;
  nopeIcon: HTMLElement | null;
}

export const CardAnimations = {
  resetCardState(cardEl: HTMLElement | null): void {
    if (!cardEl) return;
    gsap.killTweensOf(cardEl);
    gsap.set(cardEl, { clearProps: "all" });
    gsap.set(cardEl, { transformOrigin: "50% 100%" });
  },
  prepareDrag(cardEl: HTMLElement | null): void {
    if (!cardEl) return;
    gsap.killTweensOf(cardEl);
    gsap.set(cardEl, { opacity: 1, scale: 1, willChange: "transform" });
  },
  finalizeDrag(cardEl: HTMLElement | null): void {
    if (cardEl) gsap.set(cardEl, { willChange: "auto" });
  },
  shuffle(cardEl: HTMLElement | null, onComplete: () => void): void {
    const tl = gsap.timeline({ onComplete });
    tl.to(cardEl, { scale: 0.8, duration: 0.2, ease: "sine.inOut", force3D: true })
      .to(cardEl, { x: -40, rotation: -5, duration: 0.1, ease: "sine.inOut", force3D: true })
      .to(cardEl, { x: 40, rotation: 5, duration: 0.1, ease: "sine.inOut", force3D: true })
      .to(cardEl, { x: -20, rotation: -2, duration: 0.1, ease: "sine.inOut", force3D: true })
      .to(cardEl, { x: 20, rotation: 2, duration: 0.1, ease: "sine.inOut", force3D: true })
      .to(cardEl, { x: 0, rotation: 0, opacity: 0, duration: 0.2, ease: "sine.inOut", force3D: true });
  },
  shuffleEnter(cardEl: HTMLElement | null, onComplete: () => void): void {
    gsap.fromTo(
      cardEl,
      { y: -150, opacity: 0, scale: 0.6, rotation: (Math.random() - 0.5) * 30 },
      { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.5)", force3D: true, onComplete }
    );
  },
  toggleReverse(cardEl: HTMLElement | null, isReverseMode: boolean): void {
    gsap.fromTo(
      cardEl,
      { rotationY: isReverseMode ? -90 : 90, scale: 0.8, opacity: 0.5 },
      { rotationY: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(0.5, 0.4)", force3D: true }
    );
  },
  updateDrag(cardEl: HTMLElement | null, currentSwipeX: number): void {
    const rotate = currentSwipeX * 0.04;
    gsap.set(cardEl, { x: currentSwipeX, rotation: rotate, force3D: true });
  },
  resetDrag(cardEl: HTMLElement | null, refs: CardRefs, onComplete: () => void): void {
    gsap.to(cardEl, { x: 0, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", force3D: true, onComplete });
    if (refs.likeStamp) gsap.to(refs.likeStamp, { opacity: 0, duration: 0.3 });
    if (refs.nopeStamp) gsap.to(refs.nopeStamp, { opacity: 0, duration: 0.3 });
    if (refs.overlayBg) gsap.to(refs.overlayBg, { backgroundColor: "transparent", duration: 0.3 });
    if (refs.likeIcon) gsap.to(refs.likeIcon, { scale: 1, color: "rgba(255,255,255,0.6)", duration: 0.3 });
    if (refs.nopeIcon) gsap.to(refs.nopeIcon, { scale: 1, color: "rgba(255,255,255,0.6)", duration: 0.3 });
  },
  swipeOut(cardEl: HTMLElement | null, direction: number, isButtonAction: boolean, refs: CardRefs, onComplete: () => void): void {
    const tl = gsap.timeline({ onComplete });
    if (isButtonAction) {
      if (direction === 1) {
        if (refs.likeStamp) tl.to(refs.likeStamp, { opacity: 1, duration: 0.15 }, 0);
        if (refs.overlayBg) tl.to(refs.overlayBg, { backgroundColor: "rgba(16, 185, 129, 0.2)", duration: 0.15 }, 0);
        tl.to(cardEl, { y: -30, scale: 1.05, rotation: direction * 5, duration: 0.2, ease: "sine.out", force3D: true }, 0)
          .to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.in", force3D: true });
      } else {
        if (refs.nopeStamp) tl.to(refs.nopeStamp, { opacity: 1, duration: 0.15 }, 0);
        if (refs.overlayBg) tl.to(refs.overlayBg, { backgroundColor: "rgba(239, 68, 68, 0.2)", duration: 0.15 }, 0);
        tl.to(cardEl, { keyframes: [{ x: -30, rotation: -5, duration: 0.08, ease: "sine.inOut" }, { x: 20, rotation: 3, duration: 0.08, ease: "sine.inOut" }, { x: -10, rotation: -2, duration: 0.08, ease: "sine.inOut" }], force3D: true }, 0)
          .to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.in", force3D: true });
      }
    } else {
      tl.to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.inOut", force3D: true });
    }
  },
  swipeNextEnter(cardEl: HTMLElement | null, onComplete: () => void): void {
    gsap.fromTo(
      cardEl,
      { x: 0, y: 80, opacity: 0, rotation: (Math.random() - 0.5) * 20, scale: 0.8, transformOrigin: "50% 100%" },
      { x: 0, y: 0, opacity: 1, rotation: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.6)", force3D: true, onComplete }
    );
  },
  animateIcon(iconEl: HTMLElement | null, color: string): void {
    if (iconEl) gsap.to(iconEl, { color, scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
  },
  animateDonut(proxy: { val: number }, targetPercent: number, onUpdate: () => void): void {
    gsap.to(proxy, { val: targetPercent, duration: 1.5, ease: "power3.out", onUpdate });
  },
};
