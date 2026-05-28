"use client";

import gsap from "gsap";

export { gsap };

export function animateCardEnter(el: HTMLElement | null, onComplete?: () => void) {
  if (!el) return;
  gsap.fromTo(
    el,
    { x: 0, y: 80, opacity: 0, rotation: (Math.random() - 0.5) * 20, scale: 0.8, transformOrigin: "50% 100%" },
    {
      x: 0, y: 0, opacity: 1, rotation: 0, scale: 1,
      duration: 0.9, ease: "elastic.out(1, 0.6)", force3D: true,
      onComplete: () => {
        gsap.set(el, { willChange: "auto" });
        onComplete?.();
      },
    },
  );
}

export function animateShuffleCard(
  el: HTMLElement | null,
  onShuffled: () => void,
  onComplete: () => void,
) {
  if (!el) return;

  const tl = gsap.timeline({
    onComplete: () => {
      onShuffled();
      requestAnimationFrame(() => {
        gsap.fromTo(
          el,
          { y: -150, opacity: 0, scale: 0.6, rotation: (Math.random() - 0.5) * 30 },
          {
            y: 0, opacity: 1, scale: 1, rotation: 0,
            duration: 1.0, ease: "elastic.out(1, 0.5)", force3D: true,
            onComplete,
          },
        );
      });
    },
  });

  tl.to(el, { scale: 0.8, duration: 0.2, ease: "sine.inOut", force3D: true })
    .to(el, { x: -40, rotation: -5, duration: 0.1, ease: "sine.inOut", force3D: true })
    .to(el, { x: 40, rotation: 5, duration: 0.1, ease: "sine.inOut", force3D: true })
    .to(el, { x: -20, rotation: -2, duration: 0.1, ease: "sine.inOut", force3D: true })
    .to(el, { x: 20, rotation: 2, duration: 0.1, ease: "sine.inOut", force3D: true })
    .to(el, { x: 0, rotation: 0, opacity: 0, duration: 0.2, ease: "sine.inOut", force3D: true });
}

export function animateSwipeOut(
  cardEl: HTMLElement | null,
  direction: 1 | -1,
  isButtonAction: boolean,
  refs: {
    likeStamp: HTMLElement | null;
    nopeStamp: HTMLElement | null;
    overlayBg: HTMLElement | null;
    likeIcon: HTMLElement | null;
    nopeIcon: HTMLElement | null;
  },
  onComplete: () => void,
) {
  if (!cardEl) return;

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
      tl.to(cardEl, {
        keyframes: [
          { x: -30, rotation: -5, duration: 0.08, ease: "sine.inOut" },
          { x: 20, rotation: 3, duration: 0.08, ease: "sine.inOut" },
          { x: -10, rotation: -2, duration: 0.08, ease: "sine.inOut" },
        ],
        force3D: true,
      }, 0)
        .to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.in", force3D: true });
    }
  } else {
    tl.to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.inOut", force3D: true });
  }
}

export function animateToggleReverse(el: HTMLElement | null, isReverse: boolean) {
  if (!el) return;
  gsap.fromTo(
    el,
    { rotationY: isReverse ? -90 : 90, scale: 0.8, opacity: 0.5 },
    { rotationY: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(0.5, 0.4)", force3D: true },
  );
}

export function animateDonutProgress(
  setter: (val: number) => void,
  targetPercent: number,
) {
  const proxy = { val: 0 };
  gsap.to(proxy, {
    val: targetPercent,
    duration: 1.5,
    ease: "power3.out",
    onUpdate: () => setter(proxy.val),
  });
}

export function animateSnapBack(
  el: HTMLElement | null,
  refs: {
    likeStamp: HTMLElement | null;
    nopeStamp: HTMLElement | null;
    overlayBg: HTMLElement | null;
    likeIcon: HTMLElement | null;
    nopeIcon: HTMLElement | null;
  },
) {
  if (!el) return;
  gsap.to(el, { x: 0, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", force3D: true });
  if (refs.likeStamp) gsap.to(refs.likeStamp, { opacity: 0, duration: 0.3 });
  if (refs.nopeStamp) gsap.to(refs.nopeStamp, { opacity: 0, duration: 0.3 });
  if (refs.overlayBg) gsap.to(refs.overlayBg, { backgroundColor: "transparent", duration: 0.3 });
  if (refs.likeIcon) gsap.to(refs.likeIcon, { scale: 1, color: "rgba(255,255,255,0.6)", duration: 0.3 });
  if (refs.nopeIcon) gsap.to(refs.nopeIcon, { scale: 1, color: "rgba(255,255,255,0.6)", duration: 0.3 });
}

export function resetOverlayStyles(refs: {
  likeStamp: HTMLElement | null;
  nopeStamp: HTMLElement | null;
  overlayBg: HTMLElement | null;
  likeIcon: HTMLElement | null;
  nopeIcon: HTMLElement | null;
}) {
  if (refs.likeStamp) refs.likeStamp.style.opacity = "0";
  if (refs.nopeStamp) refs.nopeStamp.style.opacity = "0";
  if (refs.overlayBg) refs.overlayBg.style.backgroundColor = "transparent";
  if (refs.likeIcon) {
    refs.likeIcon.style.transform = "scale(1)";
    refs.likeIcon.style.color = "rgba(255,255,255,0.6)";
  }
  if (refs.nopeIcon) {
    refs.nopeIcon.style.transform = "scale(1)";
    refs.nopeIcon.style.color = "rgba(255,255,255,0.6)";
  }
}

export function animateLikeIcon(el: HTMLElement | null) {
  if (!el) return;
  gsap.to(el, { color: "#34d399", scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
}

export function animateNopeIcon(el: HTMLElement | null) {
  if (!el) return;
  gsap.to(el, { color: "#f87171", scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
}
