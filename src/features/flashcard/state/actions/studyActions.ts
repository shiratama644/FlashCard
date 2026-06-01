import { AnimationUtils } from "../../animations/utils";
import { CardAnimations } from "../../animations/card";
import { Effects } from "../../animations/effects";
import type { FlashcardStore } from "../FlashcardStore";
import type { CardStatus } from "../../data/types";

export interface StudyActions {
  toggleReverseMode(): void;
  resetOverlay(): void;
  flipCard(): void;
  initDragLoop(): void;
  startDrag(e: MouseEvent | TouchEvent): void;
  onDrag(e: MouseEvent | TouchEvent): void;
  updateDrag(dt: number): void;
  endDrag(): void;
  handleClick(): void;
  swipeOut(direction: number): void;
  resetStudy(): void;
}

export const createStudyActions = (store: FlashcardStore): StudyActions => ({
  toggleReverseMode(): void {
    if (store.isAnimating || store.currentCards.length === 0) return;
    store.isReverseMode = !store.isReverseMode;
    store.isFlipped = false;
    store.commit();
    store.nextTick(() => {
      if (store.refs.cardElement) {
        CardAnimations.toggleReverse(store.refs.cardElement, store.isReverseMode);
      }
    });
  },
  resetOverlay(): void {
    if (store.refs.likeStamp) store.refs.likeStamp.style.opacity = "0";
    if (store.refs.nopeStamp) store.refs.nopeStamp.style.opacity = "0";
    if (store.refs.overlayBg) store.refs.overlayBg.style.backgroundColor = "transparent";
    if (store.refs.likeIcon) {
      store.refs.likeIcon.style.transform = "scale(1)";
      store.refs.likeIcon.style.color = "rgba(255,255,255,0.6)";
    }
    if (store.refs.nopeIcon) {
      store.refs.nopeIcon.style.transform = "scale(1)";
      store.refs.nopeIcon.style.color = "rgba(255,255,255,0.6)";
    }
  },
  flipCard(): void {
    if (store.isAnimating) return;
    store.isFlipped = !store.isFlipped;
    store.commit();
  },
  initDragLoop(): void {
    if (!store.dragLoop) store.dragLoop = AnimationUtils.createRenderLoop((dt) => store.updateDrag(dt));
  },
  startDrag(e: MouseEvent | TouchEvent): void {
    if (store.isAnimating || store.currentCards.length === 0) return;
    CardAnimations.prepareDrag(store.refs.cardElement);
    store.isDragging = true;
    store.hasDragged = false;
    store.isSwipeMode = null;
    const isMouse = e.type.includes("mouse");
    store.startX = isMouse ? (e as MouseEvent).pageX : (e as TouchEvent).touches[0].clientX;
    store.startY = isMouse ? (e as MouseEvent).pageY : (e as TouchEvent).touches[0].clientY;
    store.targetSwipeX = 0;
    store.currentSwipeX = 0;
    store.swipeY = 0;
    store.initDragLoop();
    store.dragLoop!.start();
  },
  onDrag(e: MouseEvent | TouchEvent): void {
    if (!store.isDragging) return;
    const isMouse = e.type.includes("mouse");
    const x = isMouse ? (e as MouseEvent).pageX : (e as TouchEvent).touches[0].clientX;
    const y = isMouse ? (e as MouseEvent).pageY : (e as TouchEvent).touches[0].clientY;
    const deltaX = x - store.startX;
    const deltaY = y - store.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) store.hasDragged = true;
    if (store.isSwipeMode === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) store.isSwipeMode = false;
      else if (Math.abs(deltaX) > 2) store.isSwipeMode = true;
    }
    if (store.isSwipeMode !== false) store.targetSwipeX = deltaX;
  },
  updateDrag(dt: number): void {
    if (!store.isDragging || store.isSwipeMode === false || !store.refs.cardElement) return;
    const speed = 14;
    store.currentSwipeX = AnimationUtils.lerpAdjusted(store.currentSwipeX, store.targetSwipeX, speed, dt);

    CardAnimations.updateDrag(store.refs.cardElement, store.currentSwipeX);

    const likeOpacity = store.currentSwipeX > 20 ? Math.min(1, store.currentSwipeX / 100) : 0;
    const nopeOpacity = store.currentSwipeX < -20 ? Math.min(1, -store.currentSwipeX / 100) : 0;

    if (store.refs.likeStamp) store.refs.likeStamp.style.opacity = String(likeOpacity);
    if (store.refs.nopeStamp) store.refs.nopeStamp.style.opacity = String(nopeOpacity);

    if (store.refs.overlayBg) {
      if (store.currentSwipeX > 0) store.refs.overlayBg.style.backgroundColor = `rgba(16, 185, 129, ${likeOpacity * 0.2})`;
      else if (store.currentSwipeX < 0) store.refs.overlayBg.style.backgroundColor = `rgba(239, 68, 68, ${nopeOpacity * 0.2})`;
      else store.refs.overlayBg.style.backgroundColor = "transparent";
    }

    if (store.refs.likeIcon) {
      store.refs.likeIcon.style.transform = `scale(${store.currentSwipeX > 20 ? 1.2 : 1})`;
      store.refs.likeIcon.style.color = store.currentSwipeX > 20 ? "#34d399" : "rgba(255,255,255,0.6)";
    }
    if (store.refs.nopeIcon) {
      store.refs.nopeIcon.style.transform = `scale(${store.currentSwipeX < -20 ? 1.2 : 1})`;
      store.refs.nopeIcon.style.color = store.currentSwipeX < -20 ? "#f87171" : "rgba(255,255,255,0.6)";
    }
  },
  endDrag(): void {
    if (!store.isDragging) return;
    store.isDragging = false;
    if (store.dragLoop) store.dragLoop.stop();

    if (store.isSwipeMode !== false) {
      const threshold = window.innerWidth * 0.25;
      if (store.currentSwipeX > threshold) {
        store.swipeOut(1);
        return;
      } else if (store.currentSwipeX < -threshold) {
        store.swipeOut(-1);
        return;
      } else {
        CardAnimations.resetDrag(store.refs.cardElement, store.refs, () => {});
        store.targetSwipeX = 0;
        store.currentSwipeX = 0;
      }
    }
    CardAnimations.finalizeDrag(store.refs.cardElement);
    store.swipeY = 0;
    store.isSwipeMode = null;
  },
  handleClick(): void {
    if (store.hasDragged) return;
    store.flipCard();
  },
  swipeOut(direction: number): void {
    if (store.isAnimating) return;
    store.isAnimating = true;
    store.commit();
    const cardEl = store.refs.cardElement;

    if (cardEl && store.currentSwipeX === 0) {
      CardAnimations.prepareDrag(cardEl);
    }

    const card = store.currentCards[store.currentIndex];
    if (!card.stats) card.stats = { likes: 0, nopes: 0, status: "new" };
    const isButtonAction = store.currentSwipeX === 0;
    const oldStatus = card.stats.status;

    if (direction === 1) {
      store.sessionStats.like++;
      card.stats.likes++;
      card.stats.status = "mastered";
      CardAnimations.animateIcon(store.refs.likeIcon, "#34d399");
      Effects.playSwipeRightConfetti();
    } else {
      store.sessionStats.nope++;
      card.stats.nopes++;
      card.stats.status = "learning";
      CardAnimations.animateIcon(store.refs.nopeIcon, "#f87171");
    }

    const newStatus = card.stats.status as CardStatus;
    if (oldStatus !== newStatus) {
      if (oldStatus === "new") store.projectStats.new--;
      else if (oldStatus === "learning") store.projectStats.learning--;
      else if (oldStatus === "mastered") store.projectStats.mastered--;

      if (newStatus === "new") store.projectStats.new++;
      else if (newStatus === "learning") store.projectStats.learning++;
      else if (newStatus === "mastered") store.projectStats.mastered++;
      store.updateStatsRates();
    }

    store.scheduleSave();

    CardAnimations.swipeOut(cardEl, direction, isButtonAction, store.refs, () => {
      store.isFlipped = false;
      store.currentSwipeX = 0;
      store.targetSwipeX = 0;
      store.resetOverlay();
      if (store.currentIndex < store.currentCards.length - 1) {
        store.currentIndex++;
        store.commit();
        store.nextTick(() => {
          store.raf(() => {
            store.isAnimating = false;
            store.commit();
            CardAnimations.swipeNextEnter(cardEl, () => {
              CardAnimations.finalizeDrag(cardEl);
            });
          });
        });
      } else {
        store.isCompleted = true;
        store.isAnimating = false;
        store.commit();
        CardAnimations.finalizeDrag(cardEl);
        store.markStudyComplete();

        const targetPercent = store.sessionStats.like + store.sessionStats.nope > 0 ? (store.sessionStats.like / (store.sessionStats.like + store.sessionStats.nope)) * 100 : 0;
        store.donutPercentage = 0;
        store.commit();
        const proxy = { val: 0 };
        store.nextTick(() => {
          CardAnimations.animateDonut(proxy, targetPercent, () => {
            store.donutPercentage = proxy.val;
            store.commit();
          });
        });

        Effects.playCompleteConfetti();
      }
    });
  },
  resetStudy(): void {
    store.currentIndex = 0;
    store.isFlipped = false;
    store.isCompleted = false;
    store.currentSwipeX = 0;
    store.targetSwipeX = 0;
    store.sessionStats = { like: 0, nope: 0 };
    store.donutPercentage = 0;
    store.commit();
    store.nextTick(() => {
      CardAnimations.resetCardState(store.refs.cardElement);
      store.resetOverlay();
    });
  },
});
