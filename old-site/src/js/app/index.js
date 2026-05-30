import { initialState } from './state.js';
import { uiMethods } from './ui.js';
import { dataMethods } from './data.js';
import { categoryMethods } from './category.js';
import { projectMethods } from './project.js';
import { studyMethods } from './study.js';
import { aiMethods } from './ai.js';
import { initMethod } from './init.js';

export function flashcardApp() {
  return {
    ...initialState(),
    ...uiMethods,
    ...dataMethods,
    ...categoryMethods,
    ...projectMethods,
    ...studyMethods,
    ...aiMethods,
    ...initMethod,

    get isSubView() {
      return ['cardList', 'stats', 'categories', 'settings', 'ai'].includes(this.currentView);
    },
    get subViewTitle() {
      switch (this.currentView) {
        case 'cardList': return (this.activeProject?.title || '') + ' - Cards';
        case 'stats': return this.activeProject?.title || 'Stats';
        case 'categories': return 'Categories & Tags';
        case 'settings': return 'Settings';
        case 'ai': return 'AI Assistant';
        default: return '';
      }
    },
    get subViewIcon() {
      switch (this.currentView) {
        case 'ai': return 'fa-wand-magic-sparkles';
        default: return '';
      }
    },
    get subViewIconStyle() {
      switch (this.currentView) {
        case 'ai': return 'color: #c084fc;';
        default: return '';
      }
    },
    get streakMessage() {
      const streak = this.streakData.currentStreak;
      const today = new Date().getDay(); // 0:日, 6:土
      const isWeekend = today === 0 || today === 6;

      const highlight = (text) => `<span class="text-[#ff7b00]">${text}</span>`;

      if (streak === 0) {
        return `今日から${highlight('新しい記録')}を始めましょう！`;
      } else if (streak === 1) {
        return `素晴らしいスタートです！\n明日も${highlight('頑張りましょう！')}`;
      } else if (streak % 100 === 0) {
        return `信じられません！ついに${highlight(streak + '日達成')}！\n鉄の意志ですね！`;
      } else if (streak % 50 === 0) {
        return `すごい！${highlight(streak + '日連続')}達成！\n毎日の積み重ねの賜物です！`;
      } else if (streak % 10 === 0) {
        return `おめでとう！${highlight(streak + '日連続')}達成！\nこの調子で続けましょう！`;
      } else if (streak % 7 === 0) {
        return `おめでとう！${highlight('パーフェクトな連続記録')}を達成したね！\n来週も続けられるかな？`;
      } else if (isWeekend) {
        return `週末も${highlight('記録を伸ばそう！')}\n継続は力なり！`;
      } else {
        const messages = [
          `素晴らしいペースです！\n${highlight('その調子')}で明日も頑張りましょう！`,
          `いいペースですね！\n${highlight('毎日の学習')}が力になります！`,
          `今日も学習できましたね！\n${highlight('連続記録')}をどんどん伸ばそう！`,
          `止まらない勢いですね！\n${highlight('明日も')}この場所で会いましょう！`
        ];
        const seed = new Date().getDate();
        return messages[seed % messages.length];
      }
    }
  };
}