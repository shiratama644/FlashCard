import { AnimationUtils, CardAnimations, Effects } from '../animations/index.js';

export const studyMethods = {
  toggleReverseMode() {
    if (this.isAnimating || this.currentCards.length === 0) return;
    this.isReverseMode = !this.isReverseMode;
    this.isFlipped = false;
    this.$nextTick(() => {
      if (this.$refs.cardElement) {
        CardAnimations.toggleReverse(this.$refs.cardElement, this.isReverseMode);
      }
    });
  },
  resetOverlay() {
    if (this.$refs.likeStamp) this.$refs.likeStamp.style.opacity = 0;
    if (this.$refs.nopeStamp) this.$refs.nopeStamp.style.opacity = 0;
    if (this.$refs.overlayBg) this.$refs.overlayBg.style.backgroundColor = 'transparent';
    if (this.$refs.likeIcon) { this.$refs.likeIcon.style.transform = 'scale(1)'; this.$refs.likeIcon.style.color = 'rgba(255,255,255,0.6)'; }
    if (this.$refs.nopeIcon) { this.$refs.nopeIcon.style.transform = 'scale(1)'; this.$refs.nopeIcon.style.color = 'rgba(255,255,255,0.6)'; }
  },
  flipCard() {
    if (this.isAnimating) return;
    this.isFlipped = !this.isFlipped;
  },
  initDragLoop() {
    if (!this.dragLoop) this.dragLoop = AnimationUtils.createRenderLoop((dt) => this.updateDrag(dt));
  },
  startDrag(e) {
    if (this.isAnimating || this.currentCards.length === 0) return;
    CardAnimations.prepareDrag(this.$refs.cardElement);
    this.isDragging = true; this.hasDragged = false; this.isSwipeMode = null;
    this.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    this.startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
    this.targetSwipeX = 0; this.currentSwipeX = 0; this.swipeY = 0;
    this.initDragLoop(); this.dragLoop.start();
  },
  onDrag(e) {
    if (!this.isDragging) return;
    const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    const y = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) this.hasDragged = true;
    if (this.isSwipeMode === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) this.isSwipeMode = false;
      else if (Math.abs(deltaX) > 2) this.isSwipeMode = true;
    }
    if (this.isSwipeMode !== false) this.targetSwipeX = deltaX;
  },
  updateDrag(dt) {
    if (!this.isDragging || this.isSwipeMode === false || !this.$refs.cardElement) return;
    const speed = 14;
    this.currentSwipeX = AnimationUtils.lerpAdjusted(this.currentSwipeX, this.targetSwipeX, speed, dt);
    
    CardAnimations.updateDrag(this.$refs.cardElement, this.currentSwipeX);

    const likeOpacity = this.currentSwipeX > 20 ? Math.min(1, this.currentSwipeX / 100) : 0;
    const nopeOpacity = this.currentSwipeX < -20 ? Math.min(1, -this.currentSwipeX / 100) : 0;

    if (this.$refs.likeStamp) this.$refs.likeStamp.style.opacity = likeOpacity;
    if (this.$refs.nopeStamp) this.$refs.nopeStamp.style.opacity = nopeOpacity;

    if (this.$refs.overlayBg) {
      if (this.currentSwipeX > 0) this.$refs.overlayBg.style.backgroundColor = `rgba(16, 185, 129, ${likeOpacity * 0.2})`;
      else if (this.currentSwipeX < 0) this.$refs.overlayBg.style.backgroundColor = `rgba(239, 68, 68, ${nopeOpacity * 0.2})`;
      else this.$refs.overlayBg.style.backgroundColor = 'transparent';
    }

    if (this.$refs.likeIcon) {
      this.$refs.likeIcon.style.transform = `scale(${this.currentSwipeX > 20 ? 1.2 : 1})`;
      this.$refs.likeIcon.style.color = this.currentSwipeX > 20 ? '#34d399' : 'rgba(255,255,255,0.6)';
    }
    if (this.$refs.nopeIcon) {
      this.$refs.nopeIcon.style.transform = `scale(${this.currentSwipeX < -20 ? 1.2 : 1})`;
      this.$refs.nopeIcon.style.color = this.currentSwipeX < -20 ? '#f87171' : 'rgba(255,255,255,0.6)';
    }
  },
  endDrag(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.dragLoop) this.dragLoop.stop();

    if (this.isSwipeMode !== false) {
      const threshold = window.innerWidth * 0.25;
      if (this.currentSwipeX > threshold) { this.swipeOut(1); return; }
      else if (this.currentSwipeX < -threshold) { this.swipeOut(-1); return; }
      else {
        CardAnimations.resetDrag(this.$refs.cardElement, this.$refs, () => {});
        this.targetSwipeX = 0; this.currentSwipeX = 0;
      }
    }
    CardAnimations.finalizeDrag(this.$refs.cardElement);
    this.swipeY = 0; this.isSwipeMode = null;
  },
  handleClick() {
    if (this.hasDragged) return;
    this.flipCard();
  },
  swipeOut(direction) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    const cardEl = this.$refs.cardElement;

    if (cardEl && this.currentSwipeX === 0) {
      CardAnimations.prepareDrag(cardEl);
    }

    const card = this.currentCards[this.currentIndex];
    if (!card.stats) card.stats = { likes: 0, nopes: 0, status: 'new' };
    const isButtonAction = this.currentSwipeX === 0;
    const oldStatus = card.stats.status;

    if (direction === 1) {
      this.sessionStats.like++; card.stats.likes++; card.stats.status = 'mastered';
      CardAnimations.animateIcon(this.$refs.likeIcon, '#34d399');
      Effects.playSwipeRightConfetti();
    } else {
      this.sessionStats.nope++; card.stats.nopes++; card.stats.status = 'learning';
      CardAnimations.animateIcon(this.$refs.nopeIcon, '#f87171');
    }

    if (oldStatus !== card.stats.status) {
      if (oldStatus === 'new') this.projectStats.new--;
      else if (oldStatus === 'learning') this.projectStats.learning--;
      else if (oldStatus === 'mastered') this.projectStats.mastered--;

      if (card.stats.status === 'new') this.projectStats.new++;
      else if (card.stats.status === 'learning') this.projectStats.learning++;
      else if (card.stats.status === 'mastered') this.projectStats.mastered++;
      this.updateStatsRates();
    }

    this.scheduleSave();

    CardAnimations.swipeOut(cardEl, direction, isButtonAction, this.$refs, () => {
      this.isFlipped = false; this.currentSwipeX = 0; this.targetSwipeX = 0; this.resetOverlay();
      if (this.currentIndex < this.currentCards.length - 1) {
        this.currentIndex++;
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            this.isAnimating = false;
            CardAnimations.swipeNextEnter(cardEl, () => { CardAnimations.finalizeDrag(cardEl); });
          });
        });
      } else {
        this.isCompleted = true; this.isAnimating = false;
        CardAnimations.finalizeDrag(cardEl);
        this.markStudyComplete();

        const targetPercent = (this.sessionStats.like + this.sessionStats.nope) > 0 ? (this.sessionStats.like / (this.sessionStats.like + this.sessionStats.nope)) * 100 : 0;
        this.donutPercentage = 0;
        let proxy = { val: 0 };
        this.$nextTick(() => {
          CardAnimations.animateDonut(proxy, targetPercent, () => { this.donutPercentage = proxy.val; });
        });

        Effects.playCompleteConfetti();
      }
    });
  },
  resetStudy() {
    this.currentIndex = 0; this.isFlipped = false; this.isCompleted = false;
    this.currentSwipeX = 0; this.targetSwipeX = 0;
    this.sessionStats = { like: 0, nope: 0 }; this.donutPercentage = 0;
    this.$nextTick(() => {
      CardAnimations.resetCardState(this.$refs.cardElement);
      this.resetOverlay();
    });
  }
};