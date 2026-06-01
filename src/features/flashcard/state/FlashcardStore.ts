// old-site/src/js/app/* の Alpine ステートを忠実移植したストア。
// Alpine の「フィールドを直接書き換える → リアクティブに再描画」モデルを、
// 可変インスタンス + commit()（React 再描画トリガ）で再現する。
import { setupAnimations } from "../animations/setup";
import type { RenderLoop } from "../animations/utils";
import { TAG_COLORS } from "../data/constants";
import type {
  Card,
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
} from "../data/types";
import { createAiActions, type AiActions } from "./actions/aiActions";
import { createCategoryActions, type CategoryActions } from "./actions/categoryActions";
import { createDataActions, type DataActions } from "./actions/dataActions";
import { createProjectActions, type ProjectActions } from "./actions/projectActions";
import { createStudyActions, type StudyActions } from "./actions/studyActions";
import { createStreakActions, type StreakActions } from "./actions/streakActions";
import { createUiActions, type UiActions } from "./actions/uiActions";
import { createEmptyRefs, type AnyDetail, type StoreRefs } from "./storeUtils";

export class FlashcardStore {
  // ---- React 連携 ----
  commit: () => void = () => {};
  refs: StoreRefs = createEmptyRefs();
  dragLoop: RenderLoop | null = null;
  saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  streakTimer: ReturnType<typeof setInterval> | null = null;

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

  goBackFromSubView!: UiActions["goBackFromSubView"];
  addToast!: UiActions["addToast"];
  removeToast!: UiActions["removeToast"];
  showToast!: UiActions["showToast"];
  showConfirm!: UiActions["showConfirm"];
  showAlert!: UiActions["showAlert"];
  confirmDialog!: UiActions["confirmDialog"];
  cancelDialog!: UiActions["cancelDialog"];
  initStreak!: StreakActions["initStreak"];
  formatDate!: StreakActions["formatDate"];
  generateWeekDays!: StreakActions["generateWeekDays"];
  markStudyComplete!: StreakActions["markStudyComplete"];
  animateStreak!: StreakActions["animateStreak"];
  continueFromStreak!: StreakActions["continueFromStreak"];
  updateMaps!: DataActions["updateMaps"];
  calculateStats!: DataActions["calculateStats"];
  updateStatsRates!: DataActions["updateStatsRates"];
  loadAndMigrateData!: DataActions["loadAndMigrateData"];
  scheduleSave!: DataActions["scheduleSave"];
  forceSave!: DataActions["forceSave"];
  saveData!: DataActions["saveData"];
  resetAllData!: DataActions["resetAllData"];
  getRandomColor!: CategoryActions["getRandomColor"];
  getColorCode!: CategoryActions["getColorCode"];
  addCategory!: CategoryActions["addCategory"];
  deleteCategory!: CategoryActions["deleteCategory"];
  openEditCategory!: CategoryActions["openEditCategory"];
  saveCategoryEdit!: CategoryActions["saveCategoryEdit"];
  getTagsByCategory!: CategoryActions["getTagsByCategory"];
  addTagToCategory!: CategoryActions["addTagToCategory"];
  deleteTag!: CategoryActions["deleteTag"];
  openEditTag!: CategoryActions["openEditTag"];
  saveTagEdit!: CategoryActions["saveTagEdit"];
  getTagsForCurrentProject!: ProjectActions["getTagsForCurrentProject"];
  openProject!: ProjectActions["openProject"];
  goHome!: ProjectActions["goHome"];
  addProject!: ProjectActions["addProject"];
  openEditProject!: ProjectActions["openEditProject"];
  saveProjectEdit!: ProjectActions["saveProjectEdit"];
  deleteProject!: ProjectActions["deleteProject"];
  shareProject!: ProjectActions["shareProject"];
  openCardModal!: ProjectActions["openCardModal"];
  addDetail!: ProjectActions["addDetail"];
  removeDetail!: ProjectActions["removeDetail"];
  saveCard!: ProjectActions["saveCard"];
  deleteCard!: ProjectActions["deleteCard"];
  openStats!: ProjectActions["openStats"];
  shuffleCards!: ProjectActions["shuffleCards"];
  toggleReverseMode!: StudyActions["toggleReverseMode"];
  resetOverlay!: StudyActions["resetOverlay"];
  flipCard!: StudyActions["flipCard"];
  initDragLoop!: StudyActions["initDragLoop"];
  startDrag!: StudyActions["startDrag"];
  onDrag!: StudyActions["onDrag"];
  updateDrag!: StudyActions["updateDrag"];
  endDrag!: StudyActions["endDrag"];
  handleClick!: StudyActions["handleClick"];
  swipeOut!: StudyActions["swipeOut"];
  resetStudy!: StudyActions["resetStudy"];
  generatePrompt!: AiActions["generatePrompt"];
  copyPrompt!: AiActions["copyPrompt"];
  fallbackCopyTextToClipboard!: AiActions["fallbackCopyTextToClipboard"];
  importAiData!: AiActions["importAiData"];

  constructor() {
    Object.assign(
      this,
      createUiActions(this),
      createStreakActions(this),
      createDataActions(this),
      createCategoryActions(this),
      createProjectActions(this),
      createStudyActions(this),
      createAiActions(this)
    );
  }

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
  nextTick(cb: () => void): void {
    requestAnimationFrame(cb);
  }
  raf(cb: () => void): void {
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
    const highlight = (text: string) => `<span class=\"text-[#ff7b00]\">${text}</span>`;

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
