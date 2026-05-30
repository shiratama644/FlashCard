import { setupAnimations } from '../animations/index.js';

export const initMethod = {
  async init() {
    setupAnimations();

    await this.loadAndMigrateData();
    this.initStreak();

    this.$watch('currentView', (newVal) => {
      if (['cardList', 'stats'].includes(newVal)) {
        document.documentElement.style.setProperty('--tx', '2.5rem');
        document.documentElement.style.setProperty('--ty', '0');
      } else {
        document.documentElement.style.setProperty('--tx', '0');
        document.documentElement.style.setProperty('--ty', '2.5rem');
      }

      if (newVal === 'streak') {
        this.animateStreak();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.forceSave();
    });

    window.addEventListener('keydown', (e) => {
      if (this.currentView !== 'study' || this.currentCards.length === 0 || this.isAnimating || this.isCompleted) return;
      if (e.key === 'ArrowRight') this.swipeOut(1);
      else if (e.key === 'ArrowLeft') this.swipeOut(-1);
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); this.flipCard(); }
    });

    const hideLoader = () => {
      if (this.isLoaded) return;
      this.isLoaded = true;
      const loader = document.getElementById('global-loader');
      if (loader) {
        loader.style.opacity = '0'; loader.style.visibility = 'hidden';
        setTimeout(() => { loader.style.display = 'none'; }, 600);
      }

      this.currentView = 'streak';
      this.animateStreak();
    };

    if (document.readyState === 'complete') hideLoader();
    else {
      window.addEventListener('load', hideLoader);
      setTimeout(hideLoader, 10000);
    }
  }
};