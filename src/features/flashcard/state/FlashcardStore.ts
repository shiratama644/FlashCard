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
import { clone, createEmptyRefs, type AnyDetail, type StoreRefs } from "./storeUtils";
import { DexieAdapter } from "../data/persistence/DexieAdapter";
import { SupabaseAdapter } from "../data/persistence/SupabaseAdapter";
import type { PersistenceAdapter, PersistenceSnapshot } from "../data/persistence/types";

// クライアントから見たティア。premium のときだけクラウド(Supabase)アダプタを使う。
// 未ログイン(guest)・無料(free)は従来どおり IndexedDB(Dexie) のまま。
export type StoreTier = "guest" | "free" | "premium";

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

  // 永続層アダプタ。既定は IndexedDB(Dexie)。課金(premium)ユーザーのログイン時に
  // applyAuth() がクラウド(Supabase)アダプタへ差し替える。ストアは loadAll/saveAll の
  // インターフェースだけに依存し、保存先の実体を意識しない。
  adapter: PersistenceAdapter = new DexieAdapter();
  // 現在のティア（guest/free/premium）。applyAuth() がセッションに応じて更新する。
  tier: StoreTier = "guest";
  // init() の多重実行を防ぎつつ、applyAuth() が「初回ロード完了」を待てるようにする。
  private initPromise: Promise<void> | null = null;

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

  // ---- currentView ----
  // setter は状態更新（_currentView の代入 + 再描画通知）だけを行う純粋な setter。
  // ビュー切替に伴う副作用（遷移用 CSS 変数 --tx/--ty の設定、streak の
  // カウントアップ起動）は ViewTransitionEffects（useLayoutEffect）側へ分離した（SKILL #5）。
  get currentView(): ViewName {
    return this._currentView;
  }
  set currentView(v: ViewName) {
    this._currentView = v;
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
  // 初回ロード。多重呼び出しは同じ Promise を返す（applyAuth がこれを await して
  // 「Dexie ロード完了」を保証できるようにする）。
  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.runInit();
    return this.initPromise;
  }

  private async runInit(): Promise<void> {
    setupAnimations();
    await this.loadAndMigrateData();
    this.initStreak();
    // 遷移用 CSS 変数（--tx/--ty）の初期値は ViewTransitionEffects がマウント時に
    // 設定する（currentView="streak" → bottom 方向）。ここでは設定しない。
    this.isLoaded = true;
    this._currentView = "streak";
    // データ確定後に連続記録のカウントアップを起動（currentView は不変なので
    // ViewTransitionEffects の副作用は再実行されない。ここで明示的に呼ぶ）。
    this.animateStreak();
    this.commit();
  }

  // セッション(ティア)に応じて永続層アダプタを選ぶ。premium のときだけ Supabase に切替える。
  // - 初回ロード(Dexie)完了を待ってから処理する（初回同期で正しいローカルデータを使うため）。
  // - guest/free は Dexie のまま（＝既存挙動を完全維持）。
  // - premium 初回でクラウドが空ならローカルを 1 度だけアップロード（ローカルは消さない）。
  // - 切替に失敗したら Dexie に戻して継続する（クラウド接続不可でもアプリは使える）。
  async applyAuth(tier: StoreTier): Promise<void> {
    await this.init();
    this.tier = tier;

    const wantCloud = tier === "premium";
    const isCloud = this.adapter instanceof SupabaseAdapter;
    if (wantCloud === isCloud) return; // 変更不要（guest/free は常に Dexie のまま）

    if (wantCloud) {
      // ログイン中の表示データ（=Dexie からロード済み）を初回同期用に退避。
      const local: PersistenceSnapshot = {
        categories: this.categories,
        tags: this.tags,
        projects: this.projects,
      };
      this.adapter = new SupabaseAdapter();
      try {
        const cloud = await this.adapter.loadAll();
        if (cloud) {
          // クラウドにデータあり → クラウドを正として表示を差し替える。
          this.categories = cloud.categories;
          this.tags = cloud.tags;
          this.projects = cloud.projects;
        } else {
          // クラウド未保存 → ローカルに何かあれば初回アップロード（ローカルは保持）。
          const hasLocal =
            local.categories.length > 0 || local.tags.length > 0 || local.projects.length > 0;
          if (hasLocal) await this.adapter.saveAll(clone(local));
        }
        this.ensureCardStats();
        this.updateMaps();
        this.commit();
      } catch {
        // クラウド接続不可 → Dexie に戻して従来どおり動作（次回ログインで再試行）。
        this.adapter = new DexieAdapter();
        this.tier = "free";
        this.addToast("クラウド同期に接続できませんでした。ローカルデータで継続します", "error");
      }
    } else {
      // premium → guest/free（ログアウト等）。Dexie に戻してローカルを再読込する。
      this.adapter = new DexieAdapter();
      try {
        const localSnapshot = await this.adapter.loadAll();
        if (localSnapshot) {
          this.categories = localSnapshot.categories;
          this.tags = localSnapshot.tags;
          this.projects = localSnapshot.projects;
          this.ensureCardStats();
          this.updateMaps();
          this.commit();
        }
      } catch {
        // 失敗時は現状の表示を維持（致命的ではない）。
      }
    }
  }

  // stats 未設定のカードに初期値を補完した新しい projects を構築する（loadAndMigrateData と同条件）。
  private ensureCardStats(): void {
    this.projects = this.projects.map((p) => ({
      ...p,
      cards: p.cards.map((c) => (c.stats ? c : { ...c, stats: { likes: 0, nopes: 0, status: "new" as const } })),
    }));
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
