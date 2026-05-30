export const uiMethods = {
  goBackFromSubView() {
    if (this.currentView === 'cardList') this.currentView = 'study';
    else this.goHome();
  },
  addToast(message, type = 'info') {
    const id = Date.now() + Math.random();
    this.toasts.push({ id, message, type, show: false });
    setTimeout(() => this.removeToast(id), 3000);
  },
  removeToast(id) {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.show = false;
      setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 500);
    }
  },
  showConfirm(title, message, onConfirm, confirmText = '削除', cancelText = 'キャンセル') {
    this.dialog = { show: true, type: 'confirm', title, message, confirmText, cancelText, onConfirm };
  },
  showAlert(title, message) {
    this.dialog = { show: true, type: 'alert', title, message, confirmText: 'OK', cancelText: '', onConfirm: null };
  },
  confirmDialog() {
    if (this.dialog.onConfirm) this.dialog.onConfirm();
    this.dialog.show = false;
  },
  cancelDialog() { this.dialog.show = false; },
  initStreak() {
    const saved = localStorage.getItem('flashcard_streak_data');
    if (saved) { try { this.streakData = JSON.parse(saved); } catch (e) { } }
    const today = new Date();
    if (this.streakData.lastStudyDate) {
      const lastDate = new Date(this.streakData.lastStudyDate);
      const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) this.streakData.currentStreak = 0;
    }
    this.generateWeekDays();
  },
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  generateWeekDays() {
    const today = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    this.weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = this.formatDate(d);
      this.weekDays.push({ date: dateStr, dayName: days[d.getDay()], isStudied: this.streakData.studyHistory.includes(dateStr), isToday: i === 0 });
    }
  },
  markStudyComplete() {
    const todayStr = this.formatDate(new Date());
    if (this.streakData.lastStudyDate !== todayStr) {
      if (this.streakData.lastStudyDate) {
        const lastDate = new Date(this.streakData.lastStudyDate);
        const todayDate = new Date();
        const diffDays = Math.floor((todayDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) this.streakData.currentStreak++;
        else this.streakData.currentStreak = 1;
      } else {
        this.streakData.currentStreak = 1;
      }
      this.streakData.lastStudyDate = todayStr;
      if (!this.streakData.studyHistory.includes(todayStr)) this.streakData.studyHistory.push(todayStr);
      localStorage.setItem('flashcard_streak_data', JSON.stringify(this.streakData));
      this.generateWeekDays();
    }
  },
  animateStreak() {
    const target = this.streakData.currentStreak;
    if (target === 0) { this.displayStreak = 0; return; }
    let current = 0;
    const duration = 1000, stepTime = 16;
    const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { this.displayStreak = target; clearInterval(timer); }
      else { this.displayStreak = current; }
    }, stepTime);
  },
  continueFromStreak() { this.currentView = 'home'; }
};