import type { FlashcardStore } from "../FlashcardStore";

export interface StreakActions {
  initStreak(): void;
  formatDate(date: Date | string): string;
  generateWeekDays(): void;
  markStudyComplete(): void;
  animateStreak(): void;
  continueFromStreak(): void;
}

export const createStreakActions = (store: FlashcardStore): StreakActions => ({
  initStreak(): void {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("flashcard_streak_data");
      if (saved) {
        try {
          store.streakData = JSON.parse(saved);
        } catch {
          /* noop */
        }
      }
    }
    const today = new Date();
    if (store.streakData.lastStudyDate) {
      const lastDate = new Date(store.streakData.lastStudyDate);
      const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) store.streakData.currentStreak = 0;
    }
    store.generateWeekDays();
    store.commit();
  },
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  generateWeekDays(): void {
    const today = new Date();
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    store.weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = store.formatDate(d);
      store.weekDays.push({ date: dateStr, dayName: days[d.getDay()], isStudied: store.streakData.studyHistory.includes(dateStr), isToday: i === 0 });
    }
  },
  markStudyComplete(): void {
    const todayStr = store.formatDate(new Date());
    if (store.streakData.lastStudyDate !== todayStr) {
      if (store.streakData.lastStudyDate) {
        const lastDate = new Date(store.streakData.lastStudyDate);
        const todayDate = new Date();
        const diffDays = Math.floor((todayDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) store.streakData.currentStreak++;
        else store.streakData.currentStreak = 1;
      } else {
        store.streakData.currentStreak = 1;
      }
      store.streakData.lastStudyDate = todayStr;
      if (!store.streakData.studyHistory.includes(todayStr)) store.streakData.studyHistory.push(todayStr);
      if (typeof localStorage !== "undefined") localStorage.setItem("flashcard_streak_data", JSON.stringify(store.streakData));
      store.generateWeekDays();
      store.commit();
    }
  },
  animateStreak(): void {
    const target = store.streakData.currentStreak;
    if (store.streakTimer) clearInterval(store.streakTimer);
    if (target === 0) {
      store.displayStreak = 0;
      store.commit();
      return;
    }
    let current = 0;
    const duration = 1000;
    const stepTime = 16;
    const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));
    store.streakTimer = setInterval(() => {
      current += increment;
      if (current >= target) {
        store.displayStreak = target;
        if (store.streakTimer) clearInterval(store.streakTimer);
      } else {
        store.displayStreak = current;
      }
      store.commit();
    }, stepTime);
  },
  continueFromStreak(): void {
    store.currentView = "home";
  },
});
