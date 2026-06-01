// old-site/src/js/app/* の Alpine ステートを忠実移植したストア。
// Alpine の「フィールドを直接書き換える → リアクティブに再描画」モデルを、
// 可変インスタンス + commit()（React 再描画トリガ）で再現する。
import { setupAnimations } from "@/lib/animations/setup";
import { AnimationUtils, type RenderLoop } from "@/lib/animations/utils";
import { CardAnimations, type CardRefs } from "@/lib/animations/card";
import { Effects } from "@/lib/animations/effects";
import { db } from "@/lib/db";
import { CategorySchema, ProjectSchema, TagSchema } from "@/lib/schema";
import { z } from "zod";
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS, DEFAULT_TAGS, TAG_COLORS } from "@/lib/constants";
import type {
  BackDetail,
  Card,
  CardStatus,
  Category,
  DialogState,
  Id,
  Project,
  ProjectStats,
  StreakData,
  Tag,
  Toast,
  ViewName,
  WeekDay,
} from "@/lib/types";

type AnyDetail = { tagId: Id | "" | null | undefined; value: string; expanded?: boolean };

// ディープコピー（old-site の JSON.parse(JSON.stringify(...)) と同等）
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

interface StoreRefs extends CardRefs {
  frontInput: HTMLInputElement | null;
}

const emptyRefs = (): StoreRefs => ({
  cardElement: null,
  likeStamp: null,
  nopeStamp: null,
  overlayBg: null,
  likeIcon: null,
  nopeIcon: null,
  frontInput: null,
});

export class FlashcardStore {
  // ---- React 連携 ----
  private commit: () => void = () => {};
  refs: StoreRefs = emptyRefs();
  private dragLoop: RenderLoop | null = null;
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private streakTimer: ReturnType<typeof setInterval> | null = null;

  // ---- 状態（state.js 準拠）----
  isLoaded = false;
  private _currentView: ViewName = "streak";
  tagColors: string[] = TAG_COLORS;
  categories: Category[] = [];
  tags: Tag[] = [];
  projects: Project[] = [];
  activeProjectId: Id | null = null;

  categoryMap: Record<string, Category> = {};
  tagMap: Record<string, Tag> = {};
  activeProject: Project | null = null;
  currentCards: Card[] = [];
  projectStats: ProjectStats = { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 };

  currentIndex = 0;
  isFlipped = false;
  isCompleted = false;
  isAnimating = false;
  isReverseMode = false;

  isDragging = false;
  hasDragged = false;
  isSwipeMode: boolean | null = null;
  startX = 0;
  startY = 0;
  targetSwipeX = 0;
  currentSwipeX = 0;
  swipeY = 0;

  sessionStats: { like: number; nope: number } = { like: 0, nope: 0 };
  donutPercentage = 0;

  streakData: StreakData = { currentStreak: 0, lastStudyDate: null, studyHistory: [] };
  weekDays: WeekDay[] = [];
  displayStreak = 0;

  isSaving = false;
  saveQueue = false;

  newCategoryName = "";
  showProjectModal = false;
  newProjectTitle = "";
  newProjectDesc = "";
  newProjectCategoryId: Id | "" = "";
  showCardModal = false;
  editingCardIndex: number | null = null;
  newCardFront = "";
  isBackDetailsExpanded = true;
  newCardDetails: AnyDetail[] = [{ tagId: "", value: "", expanded: true }];
  newCardExample = "";
  showEditCategoryModal = false;
  editingCategory: { id: Id | null; name: string; colorClass: string } = { id: null, name: "", colorClass: "" };
  showEditTagModal = false;
  editingTag: { id: Id | null; name: string; colorClass: string } = { id: null, name: "", colorClass: "" };
  showEditProjectModal = false;
  editingProject: { id: Id | null; title: string; description: string; categoryId: Id | "" } = { id: null, title: "", description: "", categoryId: "" };

  aiTab: "prompt" | "import" = "prompt";
  aiTheme = "";
  generatedPrompt = "";
  copySuccess = false;
  importJsonText = "";

  toasts: Toast[] = [];
  dialog: DialogState = { show: false, type: "alert", title: "", message: "", confirmText: "OK", cancelText: "キャンセル", onConfirm: null };

  // ---- React 連携の初期化 ----
  attach(commit: () => void): void {
    this.commit = commit;
  }

  // 単純なフィールド更新（Alpine の直接代入 + リアクティブ再描画 相当）
  render(): void {
    this.commit();
  }
  update(fn: () => void): void {
    fn();
    this.commit();
  }

  // $nextTick / requestAnimationFrame 相当
  private nextTick(cb: () => void): void {
    requestAnimationFrame(cb);
  }
  private raf(cb: () => void): void {
    requestAnimationFrame(cb);
  }

  // ---- currentView（$watch を setter で再現）----
  get currentView(): ViewName {
    return this._currentView;
  }
  set currentView(v: ViewName) {
    this._currentView = v;
    // init.js の $watch('currentView') 相当
    if (typeof document !== "undefined") {
      if (["cardList", "stats"].includes(v)) {
        document.documentElement.style.setProperty("--tx", "2.5rem");
        document.documentElement.style.setProperty("--ty", "0");
      } else {
        document.documentElement.style.setProperty("--tx", "0");
        document.documentElement.style.setProperty("--ty", "2.5rem");
      }
      if (v === "streak") this.animateStreak();
    }
    this.commit();
  }

  // ==========================================================
  // 算出プロパティ（index.js）
  // ==========================================================
  get isSubView(): boolean {
    return ["cardList", "stats", "categories", "settings", "ai"].includes(this._currentView);
  }
  get subViewTitle(): string {
    switch (this._currentView) {
      case "cardList":
        return (this.activeProject?.title || "") + " - Cards";
      case "stats":
        return this.activeProject?.title || "Stats";
      case "categories":
        return "Categories & Tags";
      case "settings":
        return "Settings";
      case "ai":
        return "AI Assistant";
      default:
        return "";
    }
  }
  get subViewIcon(): string {
    return this._currentView === "ai" ? "fa-wand-magic-sparkles" : "";
  }
  get subViewIconStyle(): string {
    return this._currentView === "ai" ? "color: #c084fc;" : "";
  }
  get streakMessage(): string {
    const streak = this.streakData.currentStreak;
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;
    const highlight = (text: string) => `<span class="text-[#ff7b00]">${text}</span>`;

    if (streak === 0) {
      return `今日から${highlight("新しい記録")}を始めましょう！`;
    } else if (streak === 1) {
      return `素晴らしいスタートです！\n明日も${highlight("頑張りましょう！")}`;
    } else if (streak % 100 === 0) {
      return `信じられません！ついに${highlight(streak + "日達成")}！\n鉄の意志ですね！`;
    } else if (streak % 50 === 0) {
      return `すごい！${highlight(streak + "日連続")}達成！\n毎日の積み重ねの賜物です！`;
    } else if (streak % 10 === 0) {
      return `おめでとう！${highlight(streak + "日連続")}達成！\nこの調子で続けましょう！`;
    } else if (streak % 7 === 0) {
      return `おめでとう！${highlight("パーフェクトな連続記録")}を達成したね！\n来週も続けられるかな？`;
    } else if (isWeekend) {
      return `週末も${highlight("記録を伸ばそう！")}\n継続は力なり！`;
    } else {
      const messages = [
        `素晴らしいペースです！\n${highlight("その調子")}で明日も頑張りましょう！`,
        `いいペースですね！\n${highlight("毎日の学習")}が力になります！`,
        `今日も学習できましたね！\n${highlight("連続記録")}をどんどん伸ばそう！`,
        `止まらない勢いですね！\n${highlight("明日も")}この場所で会いましょう！`,
      ];
      const seed = new Date().getDate();
      return messages[seed % messages.length];
    }
  }

  // ==========================================================
  // UI メソッド（ui.js）
  // ==========================================================
  goBackFromSubView(): void {
    if (this._currentView === "cardList") this.currentView = "study";
    else this.goHome();
  }
  addToast(message: string, type: Toast["type"] = "info"): void {
    const id = Date.now() + Math.random();
    this.toasts.push({ id, message, type, show: false });
    this.commit();
    setTimeout(() => this.removeToast(id), 3000);
  }
  removeToast(id: number): void {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast) {
      toast.show = false;
      this.commit();
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.commit();
      }, 500);
    }
  }
  // トーストの表示フラグを次フレームで立てる（x-init の $nextTick 相当）
  showToast(id: number): void {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast && !toast.show) {
      toast.show = true;
      this.commit();
    }
  }
  showConfirm(title: string, message: string, onConfirm: () => void, confirmText = "削除", cancelText = "キャンセル"): void {
    this.dialog = { show: true, type: "confirm", title, message, confirmText, cancelText, onConfirm };
    this.commit();
  }
  showAlert(title: string, message: string): void {
    this.dialog = { show: true, type: "alert", title, message, confirmText: "OK", cancelText: "", onConfirm: null };
    this.commit();
  }
  confirmDialog(): void {
    if (this.dialog.onConfirm) this.dialog.onConfirm();
    this.dialog.show = false;
    this.commit();
  }
  cancelDialog(): void {
    this.dialog.show = false;
    this.commit();
  }
  initStreak(): void {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("flashcard_streak_data");
      if (saved) {
        try {
          this.streakData = JSON.parse(saved);
        } catch {
          /* noop */
        }
      }
    }
    const today = new Date();
    if (this.streakData.lastStudyDate) {
      const lastDate = new Date(this.streakData.lastStudyDate);
      const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - lastDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) this.streakData.currentStreak = 0;
    }
    this.generateWeekDays();
    this.commit();
  }
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  generateWeekDays(): void {
    const today = new Date();
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    this.weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = this.formatDate(d);
      this.weekDays.push({ date: dateStr, dayName: days[d.getDay()], isStudied: this.streakData.studyHistory.includes(dateStr), isToday: i === 0 });
    }
  }
  markStudyComplete(): void {
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
      if (typeof localStorage !== "undefined") localStorage.setItem("flashcard_streak_data", JSON.stringify(this.streakData));
      this.generateWeekDays();
      this.commit();
    }
  }
  animateStreak(): void {
    const target = this.streakData.currentStreak;
    if (this.streakTimer) clearInterval(this.streakTimer);
    if (target === 0) {
      this.displayStreak = 0;
      this.commit();
      return;
    }
    let current = 0;
    const duration = 1000;
    const stepTime = 16;
    const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));
    this.streakTimer = setInterval(() => {
      current += increment;
      if (current >= target) {
        this.displayStreak = target;
        if (this.streakTimer) clearInterval(this.streakTimer);
      } else {
        this.displayStreak = current;
      }
      this.commit();
    }, stepTime);
  }
  continueFromStreak(): void {
    this.currentView = "home";
  }

  // ==========================================================
  // データ層（data.js）
  // ==========================================================
  updateMaps(): void {
    this.categoryMap = this.categories.reduce<Record<string, Category>>((acc, cat) => {
      acc[String(cat.id)] = cat;
      return acc;
    }, {});
    this.tagMap = this.tags.reduce<Record<string, Tag>>((acc, tag) => {
      acc[String(tag.id)] = tag;
      return acc;
    }, {});
  }
  calculateStats(): void {
    if (!this.activeProject || this.activeProject.cards.length === 0) {
      this.projectStats = { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 };
      return;
    }
    const total = this.activeProject.cards.length;
    let mastered = 0,
      learning = 0,
      newCards = 0;
    this.activeProject.cards.forEach((c) => {
      if (!c.stats) newCards++;
      else if (c.stats.status === "mastered") mastered++;
      else if (c.stats.status === "learning") learning++;
      else newCards++;
    });
    this.projectStats = {
      mastered,
      learning,
      new: newCards,
      masteredRate: (mastered / total) * 100,
      learningRate: (learning / total) * 100,
      newRate: (newCards / total) * 100,
    };
  }
  updateStatsRates(): void {
    if (!this.activeProject) return;
    const total = this.activeProject.cards.length;
    if (total === 0) return;
    this.projectStats.masteredRate = (this.projectStats.mastered / total) * 100;
    this.projectStats.learningRate = (this.projectStats.learning / total) * 100;
    this.projectStats.newRate = (this.projectStats.new / total) * 100;
  }
  async loadAndMigrateData(): Promise<void> {
    try {
      const cats = await db.categories.toArray();
      const tags = await db.tags.toArray();
      const projs = await db.projects.toArray();

      if (cats.length > 0 || tags.length > 0 || projs.length > 0) {
        this.categories = cats;
        this.tags = tags;
        this.projects = projs;
      } else {
        const loadedCategories = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_categories_v4") : null;
        const loadedTags = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_tags_v4") : null;
        const loadedProjects = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_projects_v4") : null;

        if (loadedCategories && loadedTags && loadedProjects) {
          const parsedCats = z.array(CategorySchema).safeParse(JSON.parse(loadedCategories));
          const parsedTags = z.array(TagSchema).safeParse(JSON.parse(loadedTags));
          const parsedProjs = z.array(ProjectSchema).safeParse(JSON.parse(loadedProjects));
          this.categories = parsedCats.success ? (parsedCats.data as Category[]) : clone(DEFAULT_CATEGORIES);
          this.tags = parsedTags.success ? (parsedTags.data as Tag[]) : clone(DEFAULT_TAGS);
          this.projects = parsedProjs.success ? (parsedProjs.data as Project[]) : clone(DEFAULT_PROJECTS);
        } else {
          this.categories = clone(DEFAULT_CATEGORIES);
          this.tags = clone(DEFAULT_TAGS);
          this.projects = clone(DEFAULT_PROJECTS);
        }
        this.forceSave();
      }
      this.projects.forEach((p) => {
        p.cards.forEach((c) => {
          if (!c.stats) c.stats = { likes: 0, nopes: 0, status: "new" };
        });
      });
      this.updateMaps();
      this.commit();
    } catch {
      this.categories = clone(DEFAULT_CATEGORIES);
      this.tags = clone(DEFAULT_TAGS);
      this.projects = clone(DEFAULT_PROJECTS);
      this.updateMaps();
      this.commit();
      this.addToast("データの読み込みに失敗し、初期データをロードしました", "error");
    }
  }
  scheduleSave(): void {
    if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = setTimeout(() => {
      this.saveData();
    }, 1500);
  }
  forceSave(): Promise<void> {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
    return this.saveData();
  }
  async saveData(): Promise<void> {
    if (this.isSaving) {
      this.saveQueue = true;
      return;
    }
    this.isSaving = true;
    this.saveQueue = false;
    try {
      const plainCategories = clone(this.categories);
      const plainTags = clone(this.tags);
      const plainProjects = clone(this.projects);

      await db.transaction("rw", db.categories, db.tags, db.projects, async () => {
        const existingCatIds = await db.categories.toCollection().primaryKeys();
        const existingTagIds = await db.tags.toCollection().primaryKeys();
        const existingProjIds = await db.projects.toCollection().primaryKeys();

        const newCatIds = plainCategories.map((c) => c.id);
        const newTagIds = plainTags.map((t) => t.id);
        const newProjIds = plainProjects.map((p) => p.id);

        const catsToDelete = existingCatIds.filter((id) => !newCatIds.includes(id as Id));
        const tagsToDelete = existingTagIds.filter((id) => !newTagIds.includes(id as Id));
        const projsToDelete = existingProjIds.filter((id) => !newProjIds.includes(id as Id));

        if (catsToDelete.length > 0) await db.categories.bulkDelete(catsToDelete);
        if (tagsToDelete.length > 0) await db.tags.bulkDelete(tagsToDelete);
        if (projsToDelete.length > 0) await db.projects.bulkDelete(projsToDelete);

        await db.categories.bulkPut(plainCategories);
        await db.tags.bulkPut(plainTags);
        await db.projects.bulkPut(plainProjects);
      });
    } catch {
      this.addToast("データの保存に失敗しました", "error");
    } finally {
      this.isSaving = false;
      if (this.saveQueue) this.saveData();
    }
  }
  resetAllData(): void {
    this.showConfirm(
      "データ初期化",
      "すべてのデータを初期化しますか？\nこの操作は取り消せません。",
      async () => {
        try {
          this.categories = clone(DEFAULT_CATEGORIES);
          this.tags = clone(DEFAULT_TAGS);
          this.projects = clone(DEFAULT_PROJECTS);
          this.updateMaps();
          await this.forceSave();
          this.currentView = "home";
          this.addToast("データを初期化しました", "success");
        } catch {
          this.addToast("データの初期化に失敗しました", "error");
        }
      },
      "初期化する"
    );
  }

  // ==========================================================
  // カテゴリ / タグ（category.js）
  // ==========================================================
  getRandomColor(): string {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  }
  getColorCode(colorClass: string): string {
    if (!colorClass) return "#ffffff";
    const map: Record<string, string> = { red: "#ef4444", blue: "#3b82f6", green: "#22c55e", yellow: "#eab308", purple: "#a855f7", pink: "#ec4899", cyan: "#06b6d4", orange: "#f97316", teal: "#14b8a6", slate: "#64748b" };
    for (const key in map) {
      if (colorClass.includes(key)) return map[key];
    }
    return "#ffffff";
  }
  addCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.categories.push({ id: "cat_" + Date.now(), name: this.newCategoryName.trim(), colorClass: this.getRandomColor(), expanded: true, newTagName: "" });
    this.newCategoryName = "";
    this.updateMaps();
    this.forceSave();
    this.commit();
  }
  deleteCategory(id: Id): void {
    this.showConfirm("カテゴリの削除", "このカテゴリと、中に含まれるすべてのタグを削除しますか？", () => {
      this.categories = this.categories.filter((c) => c.id !== id);
      this.tags = this.tags.filter((t) => t.categoryId !== id);
      this.updateMaps();
      this.forceSave();
      this.commit();
      this.addToast("カテゴリを削除しました", "success");
    });
  }
  openEditCategory(cat: Category): void {
    this.editingCategory = { id: cat.id, name: cat.name, colorClass: cat.colorClass };
    this.showEditCategoryModal = true;
    this.commit();
  }
  saveCategoryEdit(): void {
    if (!this.editingCategory.name.trim()) return;
    const index = this.categories.findIndex((c) => c.id === this.editingCategory.id);
    if (index !== -1) {
      this.categories[index].name = this.editingCategory.name.trim();
      this.categories[index].colorClass = this.editingCategory.colorClass;
      this.updateMaps();
      this.forceSave();
    }
    this.showEditCategoryModal = false;
    this.commit();
  }
  getTagsByCategory(categoryId: Id): Tag[] {
    return this.tags.filter((t) => t.categoryId == categoryId);
  }
  addTagToCategory(category: Category): void {
    if (!category.newTagName || !category.newTagName.trim()) return;
    this.tags.push({ id: Date.now(), name: category.newTagName.trim(), categoryId: category.id, colorClass: this.getRandomColor() });
    category.newTagName = "";
    this.updateMaps();
    this.forceSave();
    this.commit();
  }
  deleteTag(id: Id): void {
    this.showConfirm("タグの削除", "このタグを削除しますか？", () => {
      this.tags = this.tags.filter((t) => t.id !== id);
      this.updateMaps();
      this.forceSave();
      this.commit();
      this.addToast("タグを削除しました", "success");
    });
  }
  openEditTag(tag: Tag): void {
    this.editingTag = { id: tag.id, name: tag.name, colorClass: tag.colorClass };
    this.showEditTagModal = true;
    this.commit();
  }
  saveTagEdit(): void {
    if (!this.editingTag.name.trim()) return;
    const index = this.tags.findIndex((t) => t.id === this.editingTag.id);
    if (index !== -1) {
      this.tags[index].name = this.editingTag.name.trim();
      this.tags[index].colorClass = this.editingTag.colorClass;
      this.updateMaps();
      this.forceSave();
    }
    this.showEditTagModal = false;
    this.commit();
  }

  // ==========================================================
  // プロジェクト / カード（project.js）
  // ==========================================================
  getTagsForCurrentProject(): Tag[] {
    return this.activeProject ? this.getTagsByCategory(this.activeProject.categoryId) : [];
  }
  openProject(id: Id, reverse = false): void {
    this.activeProjectId = id;
    this.activeProject = this.projects.find((p) => p.id === id) || null;
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
    this.commit();

    this.nextTick(() => {
      this.raf(() => {
        this.currentView = "study";
        this.nextTick(() => {
          CardAnimations.resetCardState(this.refs.cardElement);
          this.resetOverlay();
        });
      });
    });
  }
  goHome(): void {
    this.forceSave();
    this.currentView = "home";
    setTimeout(() => {
      if (this._currentView === "home") {
        this.activeProjectId = null;
        this.activeProject = null;
        this.currentCards = [];
        this.isCompleted = false;
        this.commit();
      }
    }, 300);
  }
  addProject(): void {
    if (!this.newProjectTitle.trim() || !this.newProjectCategoryId) return;
    this.projects.unshift({ id: Date.now(), title: this.newProjectTitle, description: this.newProjectDesc, categoryId: this.newProjectCategoryId, cards: [] });
    this.newProjectTitle = "";
    this.newProjectDesc = "";
    this.newProjectCategoryId = "";
    this.showProjectModal = false;
    this.forceSave();
    this.commit();
  }
  openEditProject(project: Project): void {
    this.editingProject = { id: project.id, title: project.title, description: project.description || "", categoryId: project.categoryId };
    this.showEditProjectModal = true;
    this.commit();
  }
  saveProjectEdit(): void {
    if (!this.editingProject.title.trim() || !this.editingProject.categoryId) return;
    const index = this.projects.findIndex((p) => p.id === this.editingProject.id);
    if (index !== -1) {
      this.projects[index].title = this.editingProject.title.trim();
      this.projects[index].description = this.editingProject.description;
      this.projects[index].categoryId = this.editingProject.categoryId;
      this.forceSave();
    }
    this.showEditProjectModal = false;
    this.commit();
  }
  deleteProject(id: Id): void {
    this.showConfirm("プロジェクトの削除", "このプロジェクトと、中に含まれるすべてのカードを削除しますか？", () => {
      this.projects = this.projects.filter((p) => p.id !== id);
      this.forceSave();
      this.showEditProjectModal = false;
      this.commit();
      this.addToast("プロジェクトを削除しました", "success");
    });
  }
  shareProject(project: Project): void {
    try {
      const category = this.categoryMap[String(project.categoryId)];
      const projectTags: Tag[] = [];
      const cleanCards = project.cards.map((card) => {
        const cleanDetails = card.backDetails.map((detail) => ({ tagId: detail.tagId, value: detail.value }));
        return { front: card.front, backDetails: cleanDetails, example: card.example };
      });
      const cleanProject = { title: project.title, description: project.description, categoryId: project.categoryId, cards: cleanCards };

      project.cards.forEach((card) => {
        card.backDetails.forEach((detail) => {
          if (detail.tagId) {
            const tag = this.tagMap[String(detail.tagId)];
            if (tag && !projectTags.find((t) => t.id === tag.id)) projectTags.push({ id: tag.id, name: tag.name, categoryId: tag.categoryId, colorClass: tag.colorClass });
          }
        });
      });

      const cleanCategory = category ? [{ id: category.id, name: category.name, colorClass: category.colorClass }] : [];
      const shareDataObj = { categories: cleanCategory, tags: projectTags, projects: [cleanProject] };
      const jsonText = JSON.stringify(shareDataObj);

      let cardText = "";
      project.cards.slice(0, 5).forEach((card) => {
        const back = card.backDetails.map((d) => d.value).join(", ");
        cardText += `・${card.front} : ${back}\n`;
      });
      if (project.cards.length > 5) cardText += `...他 ${project.cards.length - 5}枚\n`;

      const shareText = `フラッシュカード「${project.title}」\n${project.description || ""}\n\n${cardText}\n▼アプリにインポート用データ\n\`\`\`json\n${jsonText}\n\`\`\``;

      if (typeof navigator !== "undefined" && navigator.share) {
        navigator
          .share({ title: project.title, text: shareText })
          .then(() => this.addToast("共有しました", "success"))
          .catch((err: DOMException) => {
            if (err.name !== "AbortError") this.addToast("共有に失敗しました", "error");
          });
      } else {
        this.fallbackCopyTextToClipboard(shareText);
        this.showAlert("共有", "お使いのブラウザは共有機能に対応していないため、テキストをクリップボードにコピーしました。");
      }
    } catch {
      this.addToast("共有データの作成に失敗しました", "error");
    }
  }
  openCardModal(index: number | null = null): void {
    this.showCardModal = true;
    this.isBackDetailsExpanded = true;
    this.editingCardIndex = index;
    if (index !== null && this.activeProject) {
      const card = this.activeProject.cards[index];
      this.newCardFront = card.front;
      this.newCardExample = card.example || "";
      this.newCardDetails = card.backDetails.map((d) => ({ tagId: d.tagId || "", value: d.value, expanded: false }));
      if (this.newCardDetails.length > 0) this.newCardDetails[0].expanded = true;
    } else {
      this.newCardFront = "";
      this.newCardDetails = [{ tagId: "", value: "", expanded: true }];
      this.newCardExample = "";
    }
    this.commit();
    this.nextTick(() => {
      if (this.refs.frontInput) this.refs.frontInput.focus();
    });
  }
  addDetail(): void {
    this.newCardDetails.forEach((d) => (d.expanded = false));
    this.newCardDetails.push({ tagId: "", value: "", expanded: true });
    this.commit();
    this.nextTick(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(".detail-value-input");
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  }
  removeDetail(index: number): void {
    if (this.newCardDetails.length > 1) this.newCardDetails.splice(index, 1);
    else this.newCardDetails[0] = { tagId: "", value: "", expanded: true };
    this.commit();
  }
  saveCard(): void {
    if (!this.newCardFront.trim()) return;
    const validDetails = this.newCardDetails.filter((d) => d.value.trim() !== "");
    if (validDetails.length === 0) return;
    const project = this.projects.find((p) => p.id === this.activeProjectId);
    if (project) {
      const newCardData: Card = {
        front: this.newCardFront,
        backDetails: validDetails.map((d) => ({ tagId: d.tagId, value: d.value.trim() })),
        example: this.newCardExample,
        stats: { likes: 0, nopes: 0, status: "new" },
      };
      if (this.editingCardIndex !== null) {
        newCardData.stats = project.cards[this.editingCardIndex].stats || { likes: 0, nopes: 0, status: "new" };
        project.cards[this.editingCardIndex] = newCardData;
      } else {
        project.cards.push(newCardData);
        if (this.isCompleted) {
          this.isCompleted = false;
          this.currentIndex = project.cards.length - 1;
        }
      }
    }
    this.calculateStats();
    this.showCardModal = false;
    this.forceSave();
    this.commit();
  }
  deleteCard(index: number): void {
    this.showConfirm("カードの削除", "このカードを削除しますか？", () => {
      const project = this.projects.find((p) => p.id === this.activeProjectId);
      if (project) {
        project.cards.splice(index, 1);
        if (this.currentIndex >= project.cards.length) this.currentIndex = Math.max(0, project.cards.length - 1);
        if (project.cards.length === 0) this.isCompleted = false;
        this.calculateStats();
        this.forceSave();
        this.commit();
        this.addToast("カードを削除しました", "success");
      }
    });
  }
  openStats(id: Id): void {
    this.activeProjectId = id;
    this.activeProject = this.projects.find((p) => p.id === id) || null;
    this.currentCards = this.activeProject ? this.activeProject.cards : [];
    this.calculateStats();
    this.commit();
    this.nextTick(() => {
      this.raf(() => {
        this.currentView = "stats";
      });
    });
  }
  shuffleCards(): void {
    if (!this.activeProject || this.activeProject.cards.length === 0 || this.isAnimating) return;
    this.isAnimating = true;
    this.commit();
    const cardEl = this.refs.cardElement;

    CardAnimations.shuffle(cardEl, () => {
      const array = this.activeProject!.cards;
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
      this.commit();

      this.nextTick(() => {
        this.raf(() => {
          CardAnimations.shuffleEnter(cardEl, () => {
            this.isAnimating = false;
            this.commit();
          });
        });
      });
    });
  }

  // ==========================================================
  // 学習 / スワイプ（study.js）
  // ==========================================================
  toggleReverseMode(): void {
    if (this.isAnimating || this.currentCards.length === 0) return;
    this.isReverseMode = !this.isReverseMode;
    this.isFlipped = false;
    this.commit();
    this.nextTick(() => {
      if (this.refs.cardElement) {
        CardAnimations.toggleReverse(this.refs.cardElement, this.isReverseMode);
      }
    });
  }
  resetOverlay(): void {
    if (this.refs.likeStamp) this.refs.likeStamp.style.opacity = "0";
    if (this.refs.nopeStamp) this.refs.nopeStamp.style.opacity = "0";
    if (this.refs.overlayBg) this.refs.overlayBg.style.backgroundColor = "transparent";
    if (this.refs.likeIcon) {
      this.refs.likeIcon.style.transform = "scale(1)";
      this.refs.likeIcon.style.color = "rgba(255,255,255,0.6)";
    }
    if (this.refs.nopeIcon) {
      this.refs.nopeIcon.style.transform = "scale(1)";
      this.refs.nopeIcon.style.color = "rgba(255,255,255,0.6)";
    }
  }
  flipCard(): void {
    if (this.isAnimating) return;
    this.isFlipped = !this.isFlipped;
    this.commit();
  }
  initDragLoop(): void {
    if (!this.dragLoop) this.dragLoop = AnimationUtils.createRenderLoop((dt) => this.updateDrag(dt));
  }
  startDrag(e: MouseEvent | TouchEvent): void {
    if (this.isAnimating || this.currentCards.length === 0) return;
    CardAnimations.prepareDrag(this.refs.cardElement);
    this.isDragging = true;
    this.hasDragged = false;
    this.isSwipeMode = null;
    const isMouse = e.type.includes("mouse");
    this.startX = isMouse ? (e as MouseEvent).pageX : (e as TouchEvent).touches[0].clientX;
    this.startY = isMouse ? (e as MouseEvent).pageY : (e as TouchEvent).touches[0].clientY;
    this.targetSwipeX = 0;
    this.currentSwipeX = 0;
    this.swipeY = 0;
    this.initDragLoop();
    this.dragLoop!.start();
  }
  onDrag(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    const isMouse = e.type.includes("mouse");
    const x = isMouse ? (e as MouseEvent).pageX : (e as TouchEvent).touches[0].clientX;
    const y = isMouse ? (e as MouseEvent).pageY : (e as TouchEvent).touches[0].clientY;
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) this.hasDragged = true;
    if (this.isSwipeMode === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) this.isSwipeMode = false;
      else if (Math.abs(deltaX) > 2) this.isSwipeMode = true;
    }
    if (this.isSwipeMode !== false) this.targetSwipeX = deltaX;
  }
  updateDrag(dt: number): void {
    if (!this.isDragging || this.isSwipeMode === false || !this.refs.cardElement) return;
    const speed = 14;
    this.currentSwipeX = AnimationUtils.lerpAdjusted(this.currentSwipeX, this.targetSwipeX, speed, dt);

    CardAnimations.updateDrag(this.refs.cardElement, this.currentSwipeX);

    const likeOpacity = this.currentSwipeX > 20 ? Math.min(1, this.currentSwipeX / 100) : 0;
    const nopeOpacity = this.currentSwipeX < -20 ? Math.min(1, -this.currentSwipeX / 100) : 0;

    if (this.refs.likeStamp) this.refs.likeStamp.style.opacity = String(likeOpacity);
    if (this.refs.nopeStamp) this.refs.nopeStamp.style.opacity = String(nopeOpacity);

    if (this.refs.overlayBg) {
      if (this.currentSwipeX > 0) this.refs.overlayBg.style.backgroundColor = `rgba(16, 185, 129, ${likeOpacity * 0.2})`;
      else if (this.currentSwipeX < 0) this.refs.overlayBg.style.backgroundColor = `rgba(239, 68, 68, ${nopeOpacity * 0.2})`;
      else this.refs.overlayBg.style.backgroundColor = "transparent";
    }

    if (this.refs.likeIcon) {
      this.refs.likeIcon.style.transform = `scale(${this.currentSwipeX > 20 ? 1.2 : 1})`;
      this.refs.likeIcon.style.color = this.currentSwipeX > 20 ? "#34d399" : "rgba(255,255,255,0.6)";
    }
    if (this.refs.nopeIcon) {
      this.refs.nopeIcon.style.transform = `scale(${this.currentSwipeX < -20 ? 1.2 : 1})`;
      this.refs.nopeIcon.style.color = this.currentSwipeX < -20 ? "#f87171" : "rgba(255,255,255,0.6)";
    }
  }
  endDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.dragLoop) this.dragLoop.stop();

    if (this.isSwipeMode !== false) {
      const threshold = window.innerWidth * 0.25;
      if (this.currentSwipeX > threshold) {
        this.swipeOut(1);
        return;
      } else if (this.currentSwipeX < -threshold) {
        this.swipeOut(-1);
        return;
      } else {
        CardAnimations.resetDrag(this.refs.cardElement, this.refs, () => {});
        this.targetSwipeX = 0;
        this.currentSwipeX = 0;
      }
    }
    CardAnimations.finalizeDrag(this.refs.cardElement);
    this.swipeY = 0;
    this.isSwipeMode = null;
  }
  handleClick(): void {
    if (this.hasDragged) return;
    this.flipCard();
  }
  swipeOut(direction: number): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.commit();
    const cardEl = this.refs.cardElement;

    if (cardEl && this.currentSwipeX === 0) {
      CardAnimations.prepareDrag(cardEl);
    }

    const card = this.currentCards[this.currentIndex];
    if (!card.stats) card.stats = { likes: 0, nopes: 0, status: "new" };
    const isButtonAction = this.currentSwipeX === 0;
    const oldStatus = card.stats.status;

    if (direction === 1) {
      this.sessionStats.like++;
      card.stats.likes++;
      card.stats.status = "mastered";
      CardAnimations.animateIcon(this.refs.likeIcon, "#34d399");
      Effects.playSwipeRightConfetti();
    } else {
      this.sessionStats.nope++;
      card.stats.nopes++;
      card.stats.status = "learning";
      CardAnimations.animateIcon(this.refs.nopeIcon, "#f87171");
    }

    const newStatus = card.stats.status as CardStatus;
    if (oldStatus !== newStatus) {
      if (oldStatus === "new") this.projectStats.new--;
      else if (oldStatus === "learning") this.projectStats.learning--;
      else if (oldStatus === "mastered") this.projectStats.mastered--;

      if (newStatus === "new") this.projectStats.new++;
      else if (newStatus === "learning") this.projectStats.learning++;
      else if (newStatus === "mastered") this.projectStats.mastered++;
      this.updateStatsRates();
    }

    this.scheduleSave();

    CardAnimations.swipeOut(cardEl, direction, isButtonAction, this.refs, () => {
      this.isFlipped = false;
      this.currentSwipeX = 0;
      this.targetSwipeX = 0;
      this.resetOverlay();
      if (this.currentIndex < this.currentCards.length - 1) {
        this.currentIndex++;
        this.commit();
        this.nextTick(() => {
          this.raf(() => {
            this.isAnimating = false;
            this.commit();
            CardAnimations.swipeNextEnter(cardEl, () => {
              CardAnimations.finalizeDrag(cardEl);
            });
          });
        });
      } else {
        this.isCompleted = true;
        this.isAnimating = false;
        this.commit();
        CardAnimations.finalizeDrag(cardEl);
        this.markStudyComplete();

        const targetPercent = this.sessionStats.like + this.sessionStats.nope > 0 ? (this.sessionStats.like / (this.sessionStats.like + this.sessionStats.nope)) * 100 : 0;
        this.donutPercentage = 0;
        this.commit();
        const proxy = { val: 0 };
        this.nextTick(() => {
          CardAnimations.animateDonut(proxy, targetPercent, () => {
            this.donutPercentage = proxy.val;
            this.commit();
          });
        });

        Effects.playCompleteConfetti();
      }
    });
  }
  resetStudy(): void {
    this.currentIndex = 0;
    this.isFlipped = false;
    this.isCompleted = false;
    this.currentSwipeX = 0;
    this.targetSwipeX = 0;
    this.sessionStats = { like: 0, nope: 0 };
    this.donutPercentage = 0;
    this.commit();
    this.nextTick(() => {
      CardAnimations.resetCardState(this.refs.cardElement);
      this.resetOverlay();
    });
  }

  // ==========================================================
  // AI（ai.js）
  // ==========================================================
  generatePrompt(): void {
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
    this.commit();
  }
  copyPrompt(): void {
    if (!this.generatedPrompt) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(this.generatedPrompt)
        .then(() => {
          this.copySuccess = true;
          this.commit();
          setTimeout(() => {
            this.copySuccess = false;
            this.commit();
          }, 2000);
          this.addToast("コピーしました", "success");
        })
        .catch((err) => {
          console.error(err);
          this.fallbackCopyTextToClipboard(this.generatedPrompt);
        });
    } else {
      this.fallbackCopyTextToClipboard(this.generatedPrompt);
    }
  }
  fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand("copy")) {
        this.copySuccess = true;
        this.commit();
        setTimeout(() => {
          this.copySuccess = false;
          this.commit();
        }, 2000);
        this.addToast("コピーしました", "success");
      } else {
        this.showAlert("エラー", "コピーに失敗しました。手動でコピーしてください。");
      }
    } catch {
      this.showAlert("エラー", "コピーに失敗しました。手動でコピーしてください。");
    }
    document.body.removeChild(textArea);
  }
  importAiData(): void {
    if (!this.importJsonText.trim()) return;
    try {
      let jsonStr = this.importJsonText.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");

      const data = JSON.parse(jsonStr);
      if (!data.projects || !Array.isArray(data.projects)) throw new Error("projects配列が見つかりません");

      const catIdMap: Record<string, string> = {};
      const tagIdMap: Record<string, string> = {};

      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((cat: { id: string; name?: string; colorClass?: string }) => {
          const newId = "cat_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          catIdMap[cat.id] = newId;
          this.categories.push({ id: newId, name: cat.name || "AIカテゴリ", colorClass: cat.colorClass || this.getRandomColor(), expanded: false, newTagName: "" });
        });
      }

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: { id: string; name?: string; categoryId?: string; colorClass?: string }) => {
          const newId = "tag_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          tagIdMap[tag.id] = newId;
          this.tags.push({ id: newId, name: tag.name || "AIタグ", categoryId: (tag.categoryId && catIdMap[tag.categoryId]) || tag.categoryId || "", colorClass: tag.colorClass || this.getRandomColor() });
        });
      }

      data.projects.forEach((proj: { id?: string; title?: string; description?: string; categoryId?: string; cards?: AnyDetailCard[] }) => {
        const newProjId = "proj_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        const newCards: Card[] = (proj.cards || []).map((card) => {
          const newDetails: BackDetail[] = (card.backDetails || []).map((detail) => ({ tagId: (detail.tagId && tagIdMap[detail.tagId]) || detail.tagId || "", value: detail.value || "", expanded: false }));
          return { front: card.front || "", backDetails: newDetails, example: card.example || "", stats: { likes: 0, nopes: 0, status: "new" } };
        });
        this.projects.unshift({
          id: newProjId,
          title: proj.title || "AI生成プロジェクト",
          description: proj.description || "",
          categoryId: (proj.categoryId && catIdMap[proj.categoryId]) || proj.categoryId || "",
          cards: newCards,
        });
      });

      this.updateMaps();
      this.calculateStats();
      this.forceSave();
      this.importJsonText = "";
      this.currentView = "home";
      this.commit();
      this.addToast("データを取り込みました", "success");
    } catch (e) {
      this.showAlert("インポートエラー", "JSONの解析に失敗しました。\n" + (e instanceof Error ? e.message : String(e)));
    }
  }

  // ==========================================================
  // 初期化（init.js）
  // ==========================================================
  async init(): Promise<void> {
    setupAnimations();
    await this.loadAndMigrateData();
    this.initStreak();
    // --tx/--ty の初期値（streak は bottom 方向）
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--tx", "0");
      document.documentElement.style.setProperty("--ty", "2.5rem");
    }
    this.isLoaded = true;
    this._currentView = "streak";
    this.animateStreak();
    this.commit();
  }

  dispose(): void {
    if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);
    if (this.streakTimer) clearInterval(this.streakTimer);
    if (this.dragLoop) this.dragLoop.stop();
  }
}

// AI インポートで参照するカード型（緩い構造）
interface AnyDetailCard {
  front?: string;
  example?: string;
  backDetails?: { tagId?: string; value?: string }[];
}
