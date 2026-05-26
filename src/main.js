import './style.css';
import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import Dexie from 'dexie';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { z } from 'zod';

// Alpineプラグインの登録
Alpine.plugin(collapse);

// 元のコードがグローバル変数として参照しているためwindowに登録
window.gsap = gsap;
window.confetti = confetti;

const TagSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  categoryId: z.union([z.string(), z.number()]),
  colorClass: z.string()
});
const CategorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  colorClass: z.string(),
  expanded: z.boolean().optional(),
  newTagName: z.string().optional()
});
const CardDetailSchema = z.object({
  tagId: z.union([z.string(), z.number(), z.literal('')]).optional().nullable(),
  value: z.string(),
  expanded: z.boolean().optional()
});
const CardStatsSchema = z.object({
  likes: z.number().default(0),
  nopes: z.number().default(0),
  status: z.enum(['new', 'learning', 'mastered']).default('new')
});
const CardSchema = z.object({
  front: z.string(),
  backDetails: z.array(CardDetailSchema),
  example: z.string().optional(),
  stats: CardStatsSchema.optional()
});
const ProjectSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.union([z.string(), z.number()]),
  cards: z.array(CardSchema)
});

const TAG_COLORS = [
  'bg-red-500 text-white border-red-400', 'bg-blue-500 text-white border-blue-400',
  'bg-green-500 text-white border-green-400', 'bg-yellow-500 text-white border-yellow-400',
  'bg-purple-500 text-white border-purple-400', 'bg-pink-500 text-white border-pink-400',
  'bg-cyan-500 text-white border-cyan-400', 'bg-orange-500 text-white border-orange-400',
  'bg-teal-500 text-white border-teal-400',
];

const DEFAULT_CATEGORIES = [
  { id: 'cat_english', name: '英語', colorClass: 'bg-blue-500 text-white border-blue-400', expanded: false, newTagName: '' },
  { id: 'cat_japanese', name: '国語', colorClass: 'bg-red-500 text-white border-red-400', expanded: false, newTagName: '' }
];

const DEFAULT_TAGS = [
  { id: 1, name: '名詞', categoryId: 'cat_english', colorClass: 'bg-blue-500 text-white border-blue-400' },
  { id: 2, name: '動詞', categoryId: 'cat_english', colorClass: 'bg-red-500 text-white border-red-400' },
  { id: 3, name: '形容詞', categoryId: 'cat_english', colorClass: 'bg-green-500 text-white border-green-400' },
  { id: 4, name: '書き下し', categoryId: 'cat_japanese', colorClass: 'bg-purple-500 text-white border-purple-400' },
  { id: 5, name: '現代語訳', categoryId: 'cat_japanese', colorClass: 'bg-pink-500 text-white border-pink-400' }
];

const DEFAULT_PROJECTS = [
  {
    id: 1, title: '多義語・英単語', description: '品詞で意味が変わる単語', categoryId: 'cat_english',
    cards: [
      { front: 'light', backDetails: [{ tagId: 1, value: '光・ライト' }, { tagId: 3, value: '軽い・明るい' }, { tagId: 2, value: '火をつける・照らす' }], example: 'Could you turn on the light?', stats: { likes: 0, nopes: 0, status: 'new' } },
      { front: 'book', backDetails: [{ tagId: 1, value: '本・書物' }, { tagId: 2, value: '予約する' }], example: 'I need to book a flight to Tokyo.', stats: { likes: 0, nopes: 0, status: 'new' } }
    ]
  },
  {
    id: 2, title: '漢文（再読文字の基本）', description: '漢文における重要な再読文字の書き下し方と現代語訳のセットです。', categoryId: 'cat_japanese',
    cards: [
      {
        front: '未', backDetails: [{ tagId: 4, value: 'いまだ〜ず' }, { tagId: 5, value: 'まだ〜ない' }],
        example: '未有変也（いまだへんあらざるなり：まだ変化がないのである）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '将 / 且', backDetails: [{ tagId: 4, value: 'まさに〜（せんと）す' }, { tagId: 5, value: '今にも〜しようとする、〜するつもりだ' }],
        example: '将行（まさに行かんとす：今にも出発しようとする）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '応', backDetails: [{ tagId: 4, value: 'まさに〜べし' }, { tagId: 5, value: 'きっと〜だろう、当然〜すべきだ' }],
        example: '応知（まさに知るべし：きっと知っているだろう）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '須', backDetails: [{ tagId: 4, value: 'すべからく〜べし' }, { tagId: 5, value: 'ぜひ〜する必要がある、〜しなければならない' }],
        example: '須知（すべからく知るべし：ぜひ知る必要がある）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '猶 / 由', backDetails: [{ tagId: 4, value: 'なほ〜のごとし' }, { tagId: 5, value: 'ちょうど〜のようだ、あたかも〜と同じだ' }],
        example: '過猶不及（過ぎたるはなほ及ばざるがごとし：行き過ぎているのは、届かないのと同じだ）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '宜', backDetails: [{ tagId: 4, value: 'よろしく〜べし' }, { tagId: 5, value: '〜するのがよい、〜するのが適当だ' }],
        example: '宜従（よろしく従ふべし：従うのがよい）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '盍 / 蓋', backDetails: [{ tagId: 4, value: 'なんぞ〜ざる' }, { tagId: 5, value: 'どうして〜しないのか、（〜すればよいのに）' }],
        example: '盍各言爾志（なんぞおのおのなんぢの志を言はざる：どうしてそれぞれ自分の抱負を言わないのか、言えばよいのに）', stats: { likes: 0, nopes: 0, status: 'new' }
      },
      {
        front: '当', backDetails: [{ tagId: 4, value: 'まさに〜べし' }, { tagId: 5, value: '当然〜すべきだ、きっと〜だろう' }],
        example: '当知（まさに知るべし：当然知るべきだ）', stats: { likes: 0, nopes: 0, status: 'new' }
      }
    ]
  }
];

// --- Dexie.js Database Initialization ---
const db = new Dexie("FlashcardDB");
db.version(1).stores({
  categories: 'id',
  tags: 'id',
  projects: 'id'
});

const AnimationUtils = {
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


// ==========================================
// 2. Alpine Component Initialization
// ==========================================
document.addEventListener('alpine:init', () => {
  Alpine.data('flashcardApp', () => ({
    // --- State ---
    isLoaded: false,
    currentView: 'streak', // 初期ビューをstreakに変更
    tagColors: TAG_COLORS,
    categories: [],
    tags: [],
    projects: [],
    activeProjectId: null,

    // --- Cached Data (Performance Optimization) ---
    categoryMap: {},
    tagMap: {},
    activeProject: null,
    currentCards: [],
    projectStats: { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 },

    currentIndex: 0,
    isFlipped: false,
    isCompleted: false,
    isAnimating: false,
    isReverseMode: false,

    isDragging: false,
    hasDragged: false,
    isSwipeMode: null,
    startX: 0, startY: 0,
    targetSwipeX: 0, currentSwipeX: 0, swipeY: 0,

    sessionStats: { like: 0, nope: 0 },
    donutPercentage: 0,

    // --- Streak & Calendar Data ---
    streakData: {
      currentStreak: 0,
      lastStudyDate: null,
      studyHistory: []
    },
    weekDays: [],
    displayStreak: 0, // アニメーション用

    // --- DB Save Lock States ---
    isSaving: false,
    saveQueue: false,
    saveTimeout: null,

    // --- Form States ---
    newCategoryName: '',
    showProjectModal: false, newProjectTitle: '', newProjectDesc: '', newProjectCategoryId: '',
    showCardModal: false, editingCardIndex: null, newCardFront: '', isBackDetailsExpanded: true,
    newCardDetails: [{ tagId: '', value: '', expanded: true }], newCardExample: '',
    showEditCategoryModal: false, editingCategory: { id: null, name: '', colorClass: '' },
    showEditTagModal: false, editingTag: { id: null, name: '', colorClass: '' },
    showEditProjectModal: false, editingProject: { id: null, title: '', description: '', categoryId: '' },

    // --- AI States ---
    aiTab: 'prompt', aiTheme: '', generatedPrompt: '', copySuccess: false, importJsonText: '',

    // --- Toast & Dialog States ---
    toasts: [],
    dialog: { show: false, type: 'alert', title: '', message: '', confirmText: 'OK', cancelText: 'キャンセル', onConfirm: null },

    // --- Shared Sub-View Properties ---
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
    goBackFromSubView() {
      if (this.currentView === 'cardList') {
        this.currentView = 'study';
      } else {
        this.goHome();
      }
    },

    // --- Methods: Toast & Dialog ---
    addToast(message, type = 'info') {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, message, type, show: false });
      setTimeout(() => {
        this.removeToast(id);
      }, 3000);
    },

    removeToast(id) {
      const toast = this.toasts.find(t => t.id === id);
      if (toast) {
        toast.show = false;
        setTimeout(() => {
          this.toasts = this.toasts.filter(t => t.id !== id);
        }, 500);
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
    cancelDialog() {
      this.dialog.show = false;
    },

    // --- Methods: Streak & Calendar ---
    initStreak() {
      const saved = localStorage.getItem('flashcard_streak_data');
      if (saved) {
        try { this.streakData = JSON.parse(saved); } catch (e) { }
      }

      const today = new Date();
      const todayStr = this.formatDate(today);

      if (this.streakData.lastStudyDate) {
        const lastDate = new Date(this.streakData.lastStudyDate);
        const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          this.streakData.currentStreak = 0;
        }
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

      // 今日を右端とする過去7日間を生成
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = this.formatDate(d);
        this.weekDays.push({
          date: dateStr,
          dayName: days[d.getDay()],
          isStudied: this.streakData.studyHistory.includes(dateStr),
          isToday: i === 0
        });
      }
    },
    markStudyComplete() {
      const todayStr = this.formatDate(new Date());
      if (this.streakData.lastStudyDate !== todayStr) {
        if (this.streakData.lastStudyDate) {
          const lastDate = new Date(this.streakData.lastStudyDate);
          const todayDate = new Date();
          const diffDays = Math.floor((todayDate.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            this.streakData.currentStreak++;
          } else {
            this.streakData.currentStreak = 1;
          }
        } else {
          this.streakData.currentStreak = 1;
        }
        this.streakData.lastStudyDate = todayStr;
        if (!this.streakData.studyHistory.includes(todayStr)) {
          this.streakData.studyHistory.push(todayStr);
        }
        localStorage.setItem('flashcard_streak_data', JSON.stringify(this.streakData));
        this.generateWeekDays();
      }
    },
    animateStreak() {
      const target = this.streakData.currentStreak;
      if (target === 0) {
        this.displayStreak = 0;
        return;
      }
      let current = 0;
      const duration = 1000; // 1秒でカウントアップ
      const stepTime = 16;
      const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          this.displayStreak = target;
          clearInterval(timer);
        } else {
          this.displayStreak = current;
        }
      }, stepTime);
    },
    continueFromStreak() {
      this.currentView = 'home';
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
        // 日付をシードにしてランダムメッセージを固定する（リロードで変わらないように）
        const seed = new Date().getDate();
        return messages[seed % messages.length];
      }
    },

    // --- Methods: Performance Caching ---
    updateMaps() {
      this.categoryMap = this.categories.reduce((acc, cat) => { acc[cat.id] = cat; return acc; }, {});
      this.tagMap = this.tags.reduce((acc, tag) => { acc[tag.id] = tag; return acc; }, {});
    },

    calculateStats() {
      if (!this.activeProject || this.activeProject.cards.length === 0) {
        this.projectStats = { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 };
        return;
      }
      const total = this.activeProject.cards.length;
      let mastered = 0, learning = 0, newCards = 0;
      this.activeProject.cards.forEach(c => {
        if (!c.stats) newCards++;
        else if (c.stats.status === 'mastered') mastered++;
        else if (c.stats.status === 'learning') learning++;
        else newCards++;
      });
      this.projectStats = {
        mastered, learning, new: newCards,
        masteredRate: (mastered / total) * 100,
        learningRate: (learning / total) * 100,
        newRate: (newCards / total) * 100
      };
    },

    updateStatsRates() {
      if (!this.activeProject) return;
      const total = this.activeProject.cards.length;
      if (total === 0) return;
      this.projectStats.masteredRate = (this.projectStats.mastered / total) * 100;
      this.projectStats.learningRate = (this.projectStats.learning / total) * 100;
      this.projectStats.newRate = (this.projectStats.new / total) * 100;
    },

    // --- Methods: Data Management ---
    async loadAndMigrateData() {
      try {
        const cats = await db.categories.toArray();
        const tags = await db.tags.toArray();
        const projs = await db.projects.toArray();

        if (cats.length > 0 || tags.length > 0 || projs.length > 0) {
          this.categories = cats;
          this.tags = tags;
          this.projects = projs;
        } else {
          let loadedCategories = localStorage.getItem('flashcard_categories_v4');
          let loadedTags = localStorage.getItem('flashcard_tags_v4');
          let loadedProjects = localStorage.getItem('flashcard_projects_v4');

          if (loadedCategories && loadedTags && loadedProjects) {
            const parsedCats = z.array(CategorySchema).safeParse(JSON.parse(loadedCategories));
            const parsedTags = z.array(TagSchema).safeParse(JSON.parse(loadedTags));
            const parsedProjs = z.array(ProjectSchema).safeParse(JSON.parse(loadedProjects));

            this.categories = parsedCats.success ? parsedCats.data : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            this.tags = parsedTags.success ? parsedTags.data : JSON.parse(JSON.stringify(DEFAULT_TAGS));
            this.projects = parsedProjs.success ? parsedProjs.data : JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
          } else {
            this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
            this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
          }
          this.forceSave();
        }

        this.projects.forEach(p => {
          p.cards.forEach(c => { if (!c.stats) c.stats = { likes: 0, nopes: 0, status: 'new' }; });
        });
        this.updateMaps();
      } catch (error) {
        console.error("Failed to load data from IndexedDB", error);
        this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
        this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        this.updateMaps();
        this.addToast('データの読み込みに失敗し、初期データをロードしました', 'error');
      }
    },

    scheduleSave() {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        this.saveData();
      }, 1500);
    },

    forceSave() {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      return this.saveData();
    },

    async saveData() {
      if (this.isSaving) {
        this.saveQueue = true;
        return;
      }
      this.isSaving = true;
      this.saveQueue = false;

      try {
        const plainCategories = JSON.parse(JSON.stringify(this.categories));
        const plainTags = JSON.parse(JSON.stringify(this.tags));
        const plainProjects = JSON.parse(JSON.stringify(this.projects));

        await db.transaction('rw', db.categories, db.tags, db.projects, async () => {
          const existingCatIds = await db.categories.toCollection().primaryKeys();
          const existingTagIds = await db.tags.toCollection().primaryKeys();
          const existingProjIds = await db.projects.toCollection().primaryKeys();

          const newCatIds = plainCategories.map(c => c.id);
          const newTagIds = plainTags.map(t => t.id);
          const newProjIds = plainProjects.map(p => p.id);

          const catsToDelete = existingCatIds.filter(id => !newCatIds.includes(id));
          const tagsToDelete = existingTagIds.filter(id => !newTagIds.includes(id));
          const projsToDelete = existingProjIds.filter(id => !newProjIds.includes(id));

          if (catsToDelete.length > 0) await db.categories.bulkDelete(catsToDelete);
          if (tagsToDelete.length > 0) await db.tags.bulkDelete(tagsToDelete);
          if (projsToDelete.length > 0) await db.projects.bulkDelete(projsToDelete);

          await db.categories.bulkPut(plainCategories);
          await db.tags.bulkPut(plainTags);
          await db.projects.bulkPut(plainProjects);
        });
      } catch (error) {
        console.error("Failed to save data to IndexedDB", error);
        this.addToast('データの保存に失敗しました', 'error');
      } finally {
        this.isSaving = false;
        if (this.saveQueue) {
          this.saveData();
        }
      }
    },

    async resetAllData() {
      this.showConfirm('データ初期化', 'すべてのデータを初期化しますか？\nこの操作は取り消せません。', async () => {
        try {
          this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
          this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
          this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
          this.updateMaps();
          await this.forceSave();
          this.currentView = 'home';
          this.addToast('データを初期化しました', 'success');
        } catch (e) {
          this.addToast('データの初期化に失敗しました', 'error');
        }
      }, '初期化する');
    },

    // --- Methods: Categories & Tags ---
    getRandomColor() { return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]; },
    getColorCode(colorClass) {
      if (!colorClass) return '#ffffff';
      const map = { 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 'yellow': '#eab308', 'purple': '#a855f7', 'pink': '#ec4899', 'cyan': '#06b6d4', 'orange': '#f97316', 'teal': '#14b8a6', 'slate': '#64748b' };
      for (const key in map) { if (colorClass.includes(key)) return map[key]; }
      return '#ffffff';
    },
    addCategory() {
      if (!this.newCategoryName.trim()) return;
      this.categories.push({ id: 'cat_' + Date.now(), name: this.newCategoryName.trim(), colorClass: this.getRandomColor(), expanded: true, newTagName: '' });
      this.newCategoryName = '';
      this.updateMaps(); this.forceSave();
    },
    deleteCategory(id) {
      this.showConfirm('カテゴリの削除', 'このカテゴリと、中に含まれるすべてのタグを削除しますか？', () => {
        try {
          this.categories = this.categories.filter(c => c.id !== id);
          this.tags = this.tags.filter(t => t.categoryId !== id);
          this.updateMaps(); this.forceSave();
          this.addToast('カテゴリを削除しました', 'success');
        } catch (e) {
          this.addToast('カテゴリの削除に失敗しました', 'error');
        }
      });
    },
    openEditCategory(cat) { this.editingCategory = { ...cat }; this.showEditCategoryModal = true; },
    saveCategoryEdit() {
      if (!this.editingCategory.name.trim()) return;
      const index = this.categories.findIndex(c => c.id === this.editingCategory.id);
      if (index !== -1) {
        this.categories[index].name = this.editingCategory.name.trim();
        this.categories[index].colorClass = this.editingCategory.colorClass;
        this.updateMaps(); this.forceSave();
      }
      this.showEditCategoryModal = false;
    },
    getTagsByCategory(categoryId) { return this.tags.filter(t => t.categoryId == categoryId); },
    addTagToCategory(category) {
      if (!category.newTagName || !category.newTagName.trim()) return;
      this.tags.push({ id: Date.now(), name: category.newTagName.trim(), categoryId: category.id, colorClass: this.getRandomColor() });
      category.newTagName = '';
      this.updateMaps(); this.forceSave();
    },
    deleteTag(id) {
      this.showConfirm('タグの削除', 'このタグを削除しますか？', () => {
        try {
          this.tags = this.tags.filter(t => t.id !== id);
          this.updateMaps(); this.forceSave();
          this.addToast('タグを削除しました', 'success');
        } catch (e) {
          this.addToast('タグの削除に失敗しました', 'error');
        }
      });
    },
    openEditTag(tag) { this.editingTag = { ...tag }; this.showEditTagModal = true; },
    saveTagEdit() {
      if (!this.editingTag.name.trim()) return;
      const index = this.tags.findIndex(t => t.id === this.editingTag.id);
      if (index !== -1) {
        this.tags[index].name = this.editingTag.name.trim();
        this.tags[index].colorClass = this.editingTag.colorClass;
        this.updateMaps(); this.forceSave();
      }
      this.showEditTagModal = false;
    },

    // --- Methods: Projects & Cards ---
    getTagsForCurrentProject() { return this.activeProject ? this.getTagsByCategory(this.activeProject.categoryId) : []; },
    openProject(id, reverse = false) {
      this.activeProjectId = id;
      this.activeProject = this.projects.find(p => p.id === id) || null;
      this.currentCards = this.activeProject ? this.activeProject.cards : [];
      this.calculateStats();
      this.isReverseMode = reverse;
      this.currentIndex = 0;
      this.isFlipped = false;
      this.isCompleted = false;
      this.currentSwipeX = 0;
      this.targetSwipeX = 0;
      this.sessionStats = { like: 0, nope: 0 };
      this.donutPercentage = 0;

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.currentView = 'study';
          this.$nextTick(() => {
            if (this.$refs.cardElement) {
              gsap.killTweensOf(this.$refs.cardElement);
              gsap.set(this.$refs.cardElement, { clearProps: "all" });
              gsap.set(this.$refs.cardElement, { transformOrigin: "50% 100%" });
            }
            this.resetOverlay();
          });
        });
      });
    },
    goHome() {
      this.forceSave();
      this.currentView = 'home';

      setTimeout(() => {
        if (this.currentView === 'home') {
          this.activeProjectId = null;
          this.activeProject = null;
          this.currentCards = [];
          this.isCompleted = false;
        }
      }, 300);
    },
    addProject() {
      if (!this.newProjectTitle.trim() || !this.newProjectCategoryId) return;
      this.projects.unshift({ id: Date.now(), title: this.newProjectTitle, description: this.newProjectDesc, categoryId: this.newProjectCategoryId, cards: [] });
      this.newProjectTitle = ''; this.newProjectDesc = ''; this.newProjectCategoryId = '';
      this.showProjectModal = false; this.forceSave();
    },
    openEditProject(project) { this.editingProject = { ...project }; this.showEditProjectModal = true; },
    saveProjectEdit() {
      if (!this.editingProject.title.trim() || !this.editingProject.categoryId) return;
      const index = this.projects.findIndex(p => p.id === this.editingProject.id);
      if (index !== -1) {
        this.projects[index].title = this.editingProject.title.trim();
        this.projects[index].description = this.editingProject.description;
        this.projects[index].categoryId = this.editingProject.categoryId;
        this.forceSave();
      }
      this.showEditProjectModal = false;
    },
    deleteProject(id) {
      this.showConfirm('プロジェクトの削除', 'このプロジェクトと、中に含まれるすべてのカードを削除しますか？', () => {
        try {
          this.projects = this.projects.filter(p => p.id !== id);
          this.forceSave();
          this.showEditProjectModal = false;
          this.addToast('プロジェクトを削除しました', 'success');
        } catch (e) {
          this.addToast('プロジェクトの削除に失敗しました', 'error');
        }
      });
    },
    shareProject(project) {
      try {
        const category = this.categoryMap[project.categoryId];
        const projectTags = [];

        const cleanCards = project.cards.map(card => {
          const cleanDetails = card.backDetails.map(detail => ({ tagId: detail.tagId, value: detail.value }));
          return { front: card.front, backDetails: cleanDetails, example: card.example };
        });

        const cleanProject = { title: project.title, description: project.description, categoryId: project.categoryId, cards: cleanCards };

        project.cards.forEach(card => {
          card.backDetails.forEach(detail => {
            if (detail.tagId) {
              const tag = this.tagMap[detail.tagId];
              if (tag && !projectTags.find(t => t.id === tag.id)) {
                projectTags.push({ id: tag.id, name: tag.name, categoryId: tag.categoryId, colorClass: tag.colorClass });
              }
            }
          });
        });

        const cleanCategory = category ? [{ id: category.id, name: category.name, colorClass: category.colorClass }] : [];
        const shareDataObj = { categories: cleanCategory, tags: projectTags, projects: [cleanProject] };
        const jsonText = JSON.stringify(shareDataObj);

        let cardText = '';
        project.cards.slice(0, 5).forEach(card => {
          const back = card.backDetails.map(d => d.value).join(', ');
          cardText += `・${card.front} : ${back}\n`;
        });
        if (project.cards.length > 5) cardText += `...他 ${project.cards.length - 5}枚\n`;

        const shareText = `フラッシュカード「${project.title}」\n${project.description || ''}\n\n${cardText}\n▼アプリにインポート用データ\n\`\`\`json\n${jsonText}\n\`\`\``;

        if (navigator.share) {
          navigator.share({ title: project.title, text: shareText })
            .then(() => this.addToast('共有しました', 'success'))
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                this.addToast('共有に失敗しました', 'error');
              }
            });
        } else {
          this.fallbackCopyTextToClipboard(shareText);
          this.showAlert('共有', 'お使いのブラウザは共有機能に対応していないため、テキストをクリップボードにコピーしました。');
        }
      } catch (e) {
        this.addToast('共有データの作成に失敗しました', 'error');
      }
    },
    openCardModal(index = null) {
      this.showCardModal = true;
      this.isBackDetailsExpanded = true;
      this.editingCardIndex = index;
      if (index !== null) {
        const card = this.activeProject.cards[index];
        this.newCardFront = card.front;
        this.newCardExample = card.example || '';
        this.newCardDetails = card.backDetails.map(d => ({ tagId: d.tagId || '', value: d.value, expanded: false }));
        if (this.newCardDetails.length > 0) this.newCardDetails[0].expanded = true;
      } else {
        this.newCardFront = '';
        this.newCardDetails = [{ tagId: '', value: '', expanded: true }];
        this.newCardExample = '';
      }
      this.$nextTick(() => { if (this.$refs.frontInput) this.$refs.frontInput.focus(); });
    },
    addDetail() {
      this.newCardDetails.forEach(d => d.expanded = false);
      this.newCardDetails.push({ tagId: '', value: '', expanded: true });
      this.$nextTick(() => {
        const inputs = document.querySelectorAll('.detail-value-input');
        if (inputs.length > 0) inputs[inputs.length - 1].focus();
      });
    },
    removeDetail(index) {
      if (this.newCardDetails.length > 1) this.newCardDetails.splice(index, 1);
      else this.newCardDetails[0] = { tagId: '', value: '', expanded: true };
    },
    saveCard() {
      if (!this.newCardFront.trim()) return;
      const validDetails = this.newCardDetails.filter(d => d.value.trim() !== '');
      if (validDetails.length === 0) return;
      const project = this.projects.find(p => p.id === this.activeProjectId);
      if (project) {
        const newCardData = {
          front: this.newCardFront,
          backDetails: validDetails.map(d => ({ tagId: d.tagId, value: d.value.trim() })),
          example: this.newCardExample,
          stats: { likes: 0, nopes: 0, status: 'new' }
        };
        if (this.editingCardIndex !== null) {
          newCardData.stats = project.cards[this.editingCardIndex].stats || { likes: 0, nopes: 0, status: 'new' };
          project.cards[this.editingCardIndex] = newCardData;
        } else {
          project.cards.push(newCardData);
          if (this.isCompleted) { this.isCompleted = false; this.currentIndex = project.cards.length - 1; }
        }
      }
      this.calculateStats();
      this.showCardModal = false;
      this.forceSave();
    },
    deleteCard(index) {
      this.showConfirm('カードの削除', 'このカードを削除しますか？', () => {
        try {
          const project = this.projects.find(p => p.id === this.activeProjectId);
          if (project) {
            project.cards.splice(index, 1);
            if (this.currentIndex >= project.cards.length) this.currentIndex = Math.max(0, project.cards.length - 1);
            if (project.cards.length === 0) this.isCompleted = false;
            this.calculateStats();
            this.forceSave();
            this.addToast('カードを削除しました', 'success');
          }
        } catch (e) {
          this.addToast('カードの削除に失敗しました', 'error');
        }
      });
    },
    openStats(id) {
      this.activeProjectId = id;
      this.activeProject = this.projects.find(p => p.id === id) || null;
      this.currentCards = this.activeProject ? this.activeProject.cards : [];
      this.calculateStats();

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.currentView = 'stats';
        });
      });
    },
    shuffleCards() {
      if (!this.activeProject || this.activeProject.cards.length === 0 || this.isAnimating) return;

      this.isAnimating = true;
      const cardEl = this.$refs.cardElement;

      const tl = gsap.timeline({
        onComplete: () => {
          let array = this.activeProject.cards;
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }

          this.currentIndex = 0;
          this.isCompleted = false;
          this.sessionStats = { like: 0, nope: 0 };
          this.donutPercentage = 0;
          this.isFlipped = false;
          this.targetSwipeX = 0;
          this.currentSwipeX = 0;

          this.forceSave();
          this.resetOverlay();

          this.$nextTick(() => {
            requestAnimationFrame(() => {
              gsap.fromTo(cardEl,
                { y: -150, opacity: 0, scale: 0.6, rotation: (Math.random() - 0.5) * 30 },
                { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.0, ease: "elastic.out(1, 0.5)", force3D: true, onComplete: () => { this.isAnimating = false; } }
              );
            });
          });
        }
      });

      tl.to(cardEl, { scale: 0.8, duration: 0.2, ease: "sine.inOut", force3D: true })
        .to(cardEl, { x: -40, rotation: -5, duration: 0.1, ease: "sine.inOut", force3D: true })
        .to(cardEl, { x: 40, rotation: 5, duration: 0.1, ease: "sine.inOut", force3D: true })
        .to(cardEl, { x: -20, rotation: -2, duration: 0.1, ease: "sine.inOut", force3D: true })
        .to(cardEl, { x: 20, rotation: 2, duration: 0.1, ease: "sine.inOut", force3D: true })
        .to(cardEl, { x: 0, rotation: 0, opacity: 0, duration: 0.2, ease: "sine.inOut", force3D: true });
    },

    // --- Methods: Study & Swipe ---
    toggleReverseMode() {
      if (this.isAnimating || this.currentCards.length === 0) return;
      this.isReverseMode = !this.isReverseMode;
      this.isFlipped = false;

      this.$nextTick(() => {
        if (this.$refs.cardElement) {
          gsap.fromTo(this.$refs.cardElement,
            { rotationY: this.isReverseMode ? -90 : 90, scale: 0.8, opacity: 0.5 },
            { rotationY: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(0.5, 0.4)", force3D: true }
          );
        }
      });
    },
    resetOverlay() {
      if (this.$refs.likeStamp) this.$refs.likeStamp.style.opacity = 0;
      if (this.$refs.nopeStamp) this.$refs.nopeStamp.style.opacity = 0;
      if (this.$refs.overlayBg) this.$refs.overlayBg.style.backgroundColor = 'transparent';
      if (this.$refs.likeIcon) {
        this.$refs.likeIcon.style.transform = 'scale(1)';
        this.$refs.likeIcon.style.color = 'rgba(255,255,255,0.6)';
      }
      if (this.$refs.nopeIcon) {
        this.$refs.nopeIcon.style.transform = 'scale(1)';
        this.$refs.nopeIcon.style.color = 'rgba(255,255,255,0.6)';
      }
    },
    flipCard() {
      if (this.isAnimating) return;
      this.isFlipped = !this.isFlipped;
    },
    initDragLoop() {
      if (!this.dragLoop) {
        this.dragLoop = AnimationUtils.createRenderLoop((dt) => this.updateDrag(dt));
      }
    },
    startDrag(e) {
      if (this.isAnimating || this.currentCards.length === 0) return;

      if (this.$refs.cardElement) {
        gsap.killTweensOf(this.$refs.cardElement);
        gsap.set(this.$refs.cardElement, { opacity: 1, scale: 1, willChange: "transform" });
      }

      this.isDragging = true;
      this.hasDragged = false;
      this.isSwipeMode = null;

      this.startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      this.startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;

      this.targetSwipeX = 0;
      this.currentSwipeX = 0;
      this.swipeY = 0;

      if (this.$refs.cardElement) {
        gsap.set(this.$refs.cardElement, { willChange: "transform" });
      }

      this.initDragLoop();
      this.dragLoop.start();
    },
    onDrag(e) {
      if (!this.isDragging) return;
      const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      const y = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
      const deltaX = x - this.startX;
      const deltaY = y - this.startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) this.hasDragged = true;

      if (this.isSwipeMode === null) {
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
          this.isSwipeMode = false;
        } else if (Math.abs(deltaX) > 2) {
          this.isSwipeMode = true;
        }
      }

      if (this.isSwipeMode !== false) {
        this.targetSwipeX = deltaX;
      }
    },
    updateDrag(dt) {
      if (!this.isDragging || this.isSwipeMode === false || !this.$refs.cardElement) return;

      const speed = 14;
      this.currentSwipeX = AnimationUtils.lerpAdjusted(this.currentSwipeX, this.targetSwipeX, speed, dt);
      const rotate = this.currentSwipeX * 0.04;

      gsap.set(this.$refs.cardElement, {
        x: this.currentSwipeX,
        rotation: rotate,
        force3D: true
      });

      const likeOpacity = this.currentSwipeX > 20 ? Math.min(1, this.currentSwipeX / 100) : 0;
      const nopeOpacity = this.currentSwipeX < -20 ? Math.min(1, -this.currentSwipeX / 100) : 0;

      if (this.$refs.likeStamp) this.$refs.likeStamp.style.opacity = likeOpacity;
      if (this.$refs.nopeStamp) this.$refs.nopeStamp.style.opacity = nopeOpacity;

      if (this.$refs.overlayBg) {
        if (this.currentSwipeX > 0) this.$refs.overlayBg.style.backgroundColor = `rgba(16, 185, 129, ${likeOpacity * 0.2})`;
        else if (this.currentSwipeX < 0) this.$refs.overlayBg.style.backgroundColor = `rgba(239, 68, 68, ${nopeOpacity * 0.2})`;
        else this.$refs.overlayBg.style.backgroundColor = 'transparent';
      }

      const likeScale = this.currentSwipeX > 20 ? 1.2 : 1;
      const nopeScale = this.currentSwipeX < -20 ? 1.2 : 1;
      const likeColor = this.currentSwipeX > 20 ? '#34d399' : 'rgba(255,255,255,0.6)';
      const nopeColor = this.currentSwipeX < -20 ? '#f87171' : 'rgba(255,255,255,0.6)';

      if (this.$refs.likeIcon) {
        this.$refs.likeIcon.style.transform = `scale(${likeScale})`;
        this.$refs.likeIcon.style.color = likeColor;
      }
      if (this.$refs.nopeIcon) {
        this.$refs.nopeIcon.style.transform = `scale(${nopeScale})`;
        this.$refs.nopeIcon.style.color = nopeColor;
      }
    },
    endDrag(e) {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.dragLoop) this.dragLoop.stop();

      if (this.isSwipeMode !== false) {
        const threshold = window.innerWidth * 0.25;
        if (this.currentSwipeX > threshold) {
          this.swipeOut(1);
          return;
        }
        else if (this.currentSwipeX < -threshold) {
          this.swipeOut(-1);
          return;
        }
        else {
          gsap.to(this.$refs.cardElement, { x: 0, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", force3D: true });
          if (this.$refs.likeStamp) gsap.to(this.$refs.likeStamp, { opacity: 0, duration: 0.3 });
          if (this.$refs.nopeStamp) gsap.to(this.$refs.nopeStamp, { opacity: 0, duration: 0.3 });
          if (this.$refs.overlayBg) gsap.to(this.$refs.overlayBg, { backgroundColor: 'transparent', duration: 0.3 });
          if (this.$refs.likeIcon) gsap.to(this.$refs.likeIcon, { scale: 1, color: 'rgba(255,255,255,0.6)', duration: 0.3 });
          if (this.$refs.nopeIcon) gsap.to(this.$refs.nopeIcon, { scale: 1, color: 'rgba(255,255,255,0.6)', duration: 0.3 });

          this.targetSwipeX = 0;
          this.currentSwipeX = 0;
        }
      }

      if (this.$refs.cardElement) {
        gsap.set(this.$refs.cardElement, { willChange: "auto" });
      }

      this.swipeY = 0;
      this.isSwipeMode = null;
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
        gsap.killTweensOf(cardEl);
        gsap.set(cardEl, { opacity: 1, scale: 1, willChange: "transform" });
      }

      const card = this.currentCards[this.currentIndex];
      if (!card.stats) card.stats = { likes: 0, nopes: 0, status: 'new' };

      const isButtonAction = this.currentSwipeX === 0;
      const oldStatus = card.stats.status;

      if (direction === 1) {
        this.sessionStats.like++;
        card.stats.likes++;
        card.stats.status = 'mastered';
        if (this.$refs.likeIcon) gsap.to(this.$refs.likeIcon, { color: '#34d399', scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
        if (typeof confetti === 'function') {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#34d399', '#10b981', '#059669'], disableForReducedMotion: true, zIndex: 100 });
        }
      } else {
        this.sessionStats.nope++;
        card.stats.nopes++;
        card.stats.status = 'learning';
        if (this.$refs.nopeIcon) gsap.to(this.$refs.nopeIcon, { color: '#f87171', scale: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
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

      const tl = gsap.timeline({
        onComplete: () => {
          this.isFlipped = false;
          this.currentSwipeX = 0;
          this.targetSwipeX = 0;
          this.resetOverlay();

          if (this.currentIndex < this.currentCards.length - 1) {
            this.currentIndex++;

            this.$nextTick(() => {
              requestAnimationFrame(() => {
                this.isAnimating = false;

                gsap.fromTo(cardEl,
                  { x: 0, y: 80, opacity: 0, rotation: (Math.random() - 0.5) * 20, scale: 0.8, transformOrigin: "50% 100%" },
                  {
                    x: 0, y: 0, opacity: 1, rotation: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.6)", force3D: true, onComplete: () => {
                      gsap.set(cardEl, { willChange: "auto" });
                    }
                  }
                );
              });
            });
          } else {
            this.isCompleted = true;
            this.isAnimating = false;

            gsap.set(cardEl, { willChange: "auto" });

            this.markStudyComplete();

            const targetPercent = (this.sessionStats.like + this.sessionStats.nope) > 0
              ? (this.sessionStats.like / (this.sessionStats.like + this.sessionStats.nope)) * 100
              : 0;

            this.donutPercentage = 0;
            let proxy = { val: 0 };
            this.$nextTick(() => {
              gsap.to(proxy, {
                val: targetPercent,
                duration: 1.5,
                ease: "power3.out",
                onUpdate: () => {
                  this.donutPercentage = proxy.val;
                }
              });
            });

            if (typeof confetti === 'function') {
              const duration = 1.0 * 1000;
              const end = Date.now() + duration;
              const frame = () => {
                confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ['#facc15', '#fbbf24', '#f59e0b', '#34d399', '#60a5fa'], zIndex: 100 });
                confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ['#facc15', '#fbbf24', '#f59e0b', '#34d399', '#60a5fa'], zIndex: 100 });
                if (Date.now() < end) requestAnimationFrame(frame);
              };
              frame();
            }
          }
        }
      });

      if (isButtonAction) {
        if (direction === 1) {
          if (this.$refs.likeStamp) tl.to(this.$refs.likeStamp, { opacity: 1, duration: 0.15 }, 0);
          if (this.$refs.overlayBg) tl.to(this.$refs.overlayBg, { backgroundColor: 'rgba(16, 185, 129, 0.2)', duration: 0.15 }, 0);
          tl.to(cardEl, { y: -30, scale: 1.05, rotation: direction * 5, duration: 0.2, ease: "sine.out", force3D: true }, 0)
            .to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.in", force3D: true });
        } else {
          if (this.$refs.nopeStamp) tl.to(this.$refs.nopeStamp, { opacity: 1, duration: 0.15 }, 0);
          if (this.$refs.overlayBg) tl.to(this.$refs.overlayBg, { backgroundColor: 'rgba(239, 68, 68, 0.2)', duration: 0.15 }, 0);
          tl.to(cardEl, { keyframes: [{ x: -30, rotation: -5, duration: 0.08, ease: "sine.inOut" }, { x: 20, rotation: 3, duration: 0.08, ease: "sine.inOut" }, { x: -10, rotation: -2, duration: 0.08, ease: "sine.inOut" }], force3D: true }, 0)
            .to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.in", force3D: true });
        }
      } else {
        tl.to(cardEl, { x: direction * window.innerWidth * 1.5, y: 100, rotation: direction * 45, opacity: 0, duration: 0.5, ease: "power2.inOut", force3D: true });
      }
    },
    resetStudy() {
      this.currentIndex = 0;
      this.isFlipped = false;
      this.isCompleted = false;
      this.currentSwipeX = 0;
      this.targetSwipeX = 0;
      this.sessionStats = { like: 0, nope: 0 };
      this.donutPercentage = 0;
      this.$nextTick(() => {
        if (this.$refs.cardElement) {
          gsap.killTweensOf(this.$refs.cardElement);
          gsap.set(this.$refs.cardElement, { clearProps: "all" });
          gsap.set(this.$refs.cardElement, { transformOrigin: "50% 100%" });
        }
        this.resetOverlay();
      });
    },

    // --- Methods: AI Assistant ---
    generatePrompt() {
      if (!this.aiTheme.trim()) return;
      this.generatedPrompt = `以下のテーマに基づいて、フラッシュカードアプリ用の学習データを作成してください。

テーマ: ${this.aiTheme}

出力は以下のJSONフォーマットに厳密に従ってください。JSON以外のテキスト（解説や挨拶など）は一切含めず、そのままプログラムでパースできるようにしてください。

\`\`\`json
{
  "categories": [
    { "id": "cat_1", "name": "カテゴリ名", "colorClass": "bg-blue-500 text-white border-blue-400" }
  ],
  "tags": [
    { "id": "tag_1", "name": "名詞", "categoryId": "cat_1", "colorClass": "bg-blue-500 text-white border-blue-400" },
    { "id": "tag_2", "name": "動詞", "categoryId": "cat_1", "colorClass": "bg-red-500 text-white border-red-400" }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "プロジェクト名",
      "description": "プロジェクトの説明",
      "categoryId": "cat_1",
      "cards": [
        {
          "front": "カードの表面（問題や単語）",
          "backDetails": [
            { "tagId": "tag_1", "value": "1つ目の意味（例：光）" },
            { "tagId": "tag_2", "value": "2つ目の意味（例：火をつける）" }
          ],
          "example": "例文や補足（省略可）"
        }
      ]
    }
  ]
}
\`\`\`

【ルール】
1. idは一意の文字列にしてください。
2. tagIdは、tags配列で定義したidを指定してください。タグが不要な場合は空文字("")にしてください。
3. categoryIdは、categories配列で定義したidを指定してください。
4. 1つのカードに対して複数の意味や異なる品詞がある場合は、必ず \`backDetails\` 配列に複数のオブジェクトを追加して表現してください。
5. colorClassには以下のいずれかを指定してください:
- bg-red-500 text-white border-red-400
- bg-blue-500 text-white border-blue-400
- bg-green-500 text-white border-green-400
- bg-yellow-500 text-white border-yellow-400
- bg-purple-500 text-white border-purple-400
- bg-pink-500 text-white border-pink-400
- bg-cyan-500 text-white border-cyan-400
- bg-orange-500 text-white border-orange-400
- bg-teal-500 text-white border-teal-400
6. カード(cards)は最低でも5枚以上作成してください。`;
    },
    copyPrompt() {
      if (!this.generatedPrompt) return;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(this.generatedPrompt).then(() => {
          this.copySuccess = true; setTimeout(() => this.copySuccess = false, 2000);
          this.addToast('コピーしました', 'success');
        }).catch(err => {
          console.error(err);
          this.fallbackCopyTextToClipboard(this.generatedPrompt);
        });
      } else {
        this.fallbackCopyTextToClipboard(this.generatedPrompt);
      }
    },
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus(); textArea.select();
      try {
        if (document.execCommand('copy')) {
          this.copySuccess = true; setTimeout(() => this.copySuccess = false, 2000);
          this.addToast('コピーしました', 'success');
        } else {
          this.showAlert('エラー', 'コピーに失敗しました。手動でコピーしてください。');
        }
      } catch (err) {
        this.showAlert('エラー', 'コピーに失敗しました。手動でコピーしてください。');
      }
      document.body.removeChild(textArea);
    },
    importAiData() {
      if (!this.importJsonText.trim()) return;
      try {
        let jsonStr = this.importJsonText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');

        const data = JSON.parse(jsonStr);
        if (!data.projects || !Array.isArray(data.projects)) throw new Error("projects配列が見つかりません");

        const catIdMap = {}; const tagIdMap = {};

        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach(cat => {
            const newId = 'cat_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            catIdMap[cat.id] = newId;
            this.categories.push({ id: newId, name: cat.name || 'AIカテゴリ', colorClass: cat.colorClass || this.getRandomColor(), expanded: false, newTagName: '' });
          });
        }

        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => {
            const newId = 'tag_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            tagIdMap[tag.id] = newId;
            this.tags.push({ id: newId, name: tag.name || 'AIタグ', categoryId: catIdMap[tag.categoryId] || tag.categoryId, colorClass: tag.colorClass || this.getRandomColor() });
          });
        }

        data.projects.forEach(proj => {
          const newProjId = 'proj_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const newCards = (proj.cards || []).map(card => {
            const newDetails = (card.backDetails || []).map(detail => ({ tagId: tagIdMap[detail.tagId] || detail.tagId || '', value: detail.value || '', expanded: false }));
            return { front: card.front || '', backDetails: newDetails, example: card.example || '', stats: { likes: 0, nopes: 0, status: 'new' } };
          });
          this.projects.unshift({
            id: newProjId, title: proj.title || 'AI生成プロジェクト', description: proj.description || '',
            categoryId: catIdMap[proj.categoryId] || proj.categoryId || (this.categories[0] ? this.categories[0].id : ''),
            cards: newCards
          });
        });

        this.updateMaps();
        this.forceSave();
        this.importJsonText = ''; this.generatedPrompt = ''; this.aiTheme = '';
        this.showAlert('インポート完了', 'AIデータのインポートが完了しました！');
        this.currentView = 'home';
      } catch (e) {
        this.showAlert('エラー', 'JSONのパースに失敗しました。フォーマットを確認してください。\n\n' + e.message);
      }
    },

    // --- Init ---
    async init() {
      gsap.ticker.fps(120);

      await this.loadAndMigrateData();
      this.initStreak();

      // 動的トランジション方向の監視
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

        // ロード完了後にStreak画面を表示し、アニメーションを開始
        this.currentView = 'streak';
        this.animateStreak();
      };

      if (document.readyState === 'complete') hideLoader();
      else {
        window.addEventListener('load', hideLoader);
        setTimeout(hideLoader, 10000);
      }
    }
  }));
});

// Alpine.js の起動
Alpine.start();