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

// アクション群を Object.assign で注入し、その型は末尾の interface 宣言マージで付与する。
// 実体は確実に注入されるため、宣言マージ警告は意図的に無効化する。
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class FlashcardStore {
  // ---- React 連携（useSyncExternalStore 用の外部ストア API）----
  // commit() で購読中のリスナーへ通知するだけのシンプルな外部ストア。
  // 各コンポーネントは useStoreSelector / useStoreView で「自分が表示する値の
  // シグネチャ」だけを購読するため、ストア全体のスナップショットは持たない
  // （ミュータブルなインスタンス参照を返してしまう getSnapshot の落とし穴を回避）。
  private listeners = new Set<() => void>();
  refs: StoreRefs = createEmptyRefs();
  dragLoop: RenderLoop | null = null;
  saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  streakTimer: ReturnType<typeof setInterval> | null = null;

  // ストアの変更を購読する（戻り値で解除）。
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  // 状態更新の確定。Alpine の「リアクティブ再描画」相当（旧 forceUpdate）。
  commit = (): void => {
    this.listeners.forEach((listener) => listener());
  };

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

  // アクション群のメソッドはクラス末尾の interface 宣言マージで型付けし、
  // 実体は constructor の Object.assign で注入する（下記参照）。

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

  // 単純なフィールド更新（Alpine の直接代入 + リアクティブ再描画 相当）
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

// アクション群の型をクラスへ宣言マージする（実体は constructor の Object.assign で注入）。
// これにより「アクション追加＝クラス本体の手書きミラーも修正」という二重管理を解消する。
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface FlashcardStore
  extends UiActions,
    StreakActions,
    DataActions,
    CategoryActions,
    ProjectActions,
    StudyActions,
    AiActions {}
