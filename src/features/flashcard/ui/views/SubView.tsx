"use client";

// 共有サブビュー（cardList / stats / categories / settings / ai）
// index.html 344-573 の忠実移植
import { useStoreView, useStoreInstance } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";
import { Collapse } from "../Collapse";

// 一覧が表示するカード（表面・裏面の意味の連結）のシグネチャ。
// 当該ビュー非表示中は短絡する。
function cardListSignature(store: FlashcardStore): string {
  if (store.currentView !== "cardList") return "inactive";
  return JSON.stringify(store.currentCards.map((c) => [c.front, c.backDetails.map((d) => d.value)]));
}

function CardListView() {
  const store = useStoreView(cardListSignature);
  return (
    <div className="w-full">
      {store.currentCards.length === 0 && <div className="empty-text">カードがありません</div>}
      <div className="list-grid">
        {store.currentCards.map((card, index) => (
          <div key={card.front + "_" + index} className="card-list-item">
            <div className="list-item-info">
              <div className="list-item-title">{card.front}</div>
              <div className="list-item-desc">{card.backDetails.map((d) => d.value).join(", ")}</div>
            </div>
            <div className="list-item-actions">
              <button onClick={() => store.openCardModal(index)} className="btn-small-icon btn-edit">
                <i className="fa-solid fa-pen"></i>
              </button>
              <button onClick={() => store.deleteCard(index)} className="btn-small-icon btn-delete">
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 進捗集計とカード別データ（正解/不正解数・状態）のシグネチャ。非表示中は短絡する。
function statsSignature(store: FlashcardStore): string {
  if (store.currentView !== "stats") return "inactive";
  const ps = store.projectStats;
  return JSON.stringify([
    ps.mastered,
    ps.learning,
    ps.new,
    ps.masteredRate,
    ps.learningRate,
    ps.newRate,
    store.activeProject?.cards.map((c) => [c.front, c.stats?.likes ?? 0, c.stats?.nopes ?? 0, c.stats?.status ?? "new"]) ?? null,
  ]);
}

function StatsView() {
  const store = useStoreView(statsSignature);
  const { projectStats, activeProject } = store;
  const statusClass = (card: { stats?: { status: string } }) => {
    if (card.stats?.status === "mastered") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (card.stats?.status === "learning") return "bg-red-500/20 text-red-300 border-red-500/30";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };
  return (
    <div className="stats-grid w-full">
      <div className="stats-col-1">
        <div className="stats-summary-card">
          <h2 className="stats-title">
            <i className="fa-solid fa-chart-simple text-cyan-400"></i> 学習進捗
          </h2>

          <div className="flex justify-between items-end mb-2">
            <div className="stats-main-val">
              <span>{projectStats.mastered}</span>
              <span className="stats-sub-val">
                {" "}
                / <span>{activeProject?.cards.length || 0}</span>
              </span>
            </div>
            <div className="stats-badge">Mastered</div>
          </div>

          <div className="stats-bar-wrap">
            <div className="stats-bar bg-emerald-500" style={{ width: `${projectStats.masteredRate}%` }}></div>
            <div className="stats-bar bg-red-500" style={{ width: `${projectStats.learningRate}%` }}></div>
            <div className="stats-bar bg-slate-500" style={{ width: `${projectStats.newRate}%` }}></div>
          </div>

          <div className="stats-legend">
            <div className="stats-legend-item text-emerald-400">
              <div className="stats-legend-label">
                <span className="stats-dot bg-emerald-500"></span> 覚えた
              </div>
              <span>{projectStats.mastered}</span>
            </div>
            <div className="stats-legend-item text-red-400">
              <div className="stats-legend-label">
                <span className="stats-dot bg-red-500"></span> 学習中
              </div>
              <span>{projectStats.learning}</span>
            </div>
            <div className="stats-legend-item text-slate-400">
              <div className="stats-legend-label">
                <span className="stats-dot bg-slate-500"></span> 未学習
              </div>
              <span>{projectStats.new}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-col-3">
        <h3 className="stats-section-title">カード別データ</h3>
        <div className="stats-card-grid">
          {(!activeProject || activeProject.cards.length === 0) && <div className="stats-empty-text">カードがありません</div>}
          {activeProject?.cards.map((card, i) => (
            <div key={card.front + "_" + i} className="stats-card-item">
              <div className="flex-1 min-w-0 pr-4">
                <div className="font-bold text-lg truncate">{card.front}</div>
                <div className="stats-card-counts">
                  <span className="count-badge count-like">
                    <i className="fa-solid fa-check mr-1"></i>
                    <span>{card.stats?.likes || 0}</span>
                  </span>
                  <span className="count-badge count-nope">
                    <i className="fa-solid fa-xmark mr-1"></i>
                    <span>{card.stats?.nopes || 0}</span>
                  </span>
                </div>
              </div>
              <div>
                <span className={`status-badge ${statusClass(card)}`}>
                  {card.stats?.status === "mastered" ? "覚えた" : card.stats?.status === "learning" ? "学習中" : "未学習"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 新規カテゴリ名と各カテゴリ（名前・色・開閉・タグ入力）および配下タグのシグネチャ。
// 非表示中は短絡する。
function categoriesSignature(store: FlashcardStore): string {
  if (store.currentView !== "categories") return "inactive";
  return JSON.stringify([
    store.newCategoryName,
    store.categories.map((cat) => [
      cat.id,
      cat.name,
      cat.colorClass,
      cat.expanded ?? false,
      cat.newTagName ?? "",
      store.getTagsByCategory(cat.id).map((t) => [t.id, t.name, t.colorClass]),
    ]),
  ]);
}

function CategoriesView() {
  const store = useStoreView(categoriesSignature);
  return (
    <div className="w-full">
      <div className="input-group">
        <input
          type="text"
          value={store.newCategoryName}
          onChange={(e) => store.update(() => (store.newCategoryName = e.target.value))}
          placeholder="新しいカテゴリ名"
          className="input-field"
        />
        <button onClick={() => store.addCategory()} className="btn-primary shrink-0">
          追加
        </button>
      </div>

      <div className="category-grid">
        {store.categories.map((cat) => (
          <div key={String(cat.id)} className="category-card">
            <div className="category-header" onClick={() => store.toggleCategoryExpanded(cat.id)}>
              <div className="category-title-wrap">
                <i className={`fa-solid fa-chevron-right chevron-icon ${cat.expanded ? "rotated" : ""}`}></i>
                <span className={`color-dot ${cat.colorClass.split(" ")[0]}`}></span>
                <span className="font-bold">{cat.name}</span>
              </div>
              <div className="category-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.openEditCategory(cat);
                  }}
                  className="btn-text-icon"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.deleteCategory(cat.id);
                  }}
                  className="btn-text-icon danger"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <Collapse show={!!cat.expanded}>
              <div className="category-body">
                <div className="tag-input-group">
                  <input
                    type="text"
                    value={cat.newTagName || ""}
                    onChange={(e) => store.setCategoryNewTagName(cat.id, e.target.value)}
                    placeholder="新しいタグ名"
                    className="input-field input-field-sm"
                  />
                  <button onClick={() => store.addTagToCategory(cat)} className="btn-secondary btn-secondary-sm shrink-0">
                    追加
                  </button>
                </div>
                <div className="tag-list">
                  {store.getTagsByCategory(cat.id).map((tag) => (
                    <div key={String(tag.id)} className="tag-item" onClick={() => store.openEditTag(tag)}>
                      <span className={`tag-badge ${tag.colorClass}`}>{tag.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          store.deleteTag(tag.id);
                        }}
                        className="tag-delete-btn"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                  {store.getTagsByCategory(cat.id).length === 0 && <span className="empty-tag-text">タグがありません</span>}
                </div>
              </div>
            </Collapse>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  // 表示する動的な状態を持たない（操作ハンドラのみ）。購読は不要。
  const store = useStoreInstance();
  return (
    <div className="settings-container">
      <div className="glass-panel-sm p-5">
        <h3 className="font-bold text-lg mb-2 text-red-400">
          <i className="fa-solid fa-triangle-exclamation"></i> Danger Zone
        </h3>
        <p className="settings-desc">すべてのデータを初期状態に戻します。</p>
        <button onClick={() => store.resetAllData()} className="btn-danger-outline">
          データを初期化する
        </button>
      </div>
    </div>
  );
}

// AI タブの選択・テーマ入力・生成プロンプト・コピー状態・インポート文字列のシグネチャ。
// 非表示中は短絡する。
function aiSignature(store: FlashcardStore): string {
  if (store.currentView !== "ai") return "inactive";
  return JSON.stringify([store.aiTab, store.aiTheme, store.generatedPrompt, store.copySuccess, store.importJsonText]);
}

function AiView() {
  const store = useStoreView(aiSignature);
  return (
    <div className="ai-container">
      <div className="ai-tabs">
        <button onClick={() => store.update(() => (store.aiTab = "prompt"))} className={`ai-tab-btn ${store.aiTab === "prompt" ? "active" : "inactive"}`}>
          プロンプト生成
        </button>
        <button onClick={() => store.update(() => (store.aiTab = "import"))} className={`ai-tab-btn ${store.aiTab === "import" ? "active" : "inactive"}`}>
          JSONインポート
        </button>
      </div>

      <Transition show={store.aiTab === "prompt"} enter="view-enter-active" enterStart="modal-enter-from" enterEnd="modal-enter-to" leave="" leaveStart="" leaveEnd="">
        <div className="ai-card">
          <h2 className="ai-step-title">1. 作ってほしい内容を入力</h2>
          <p className="ai-step-desc">例: 「TOEIC頻出の英単語50選」「高校日本史の重要年号」など</p>
          <div className="flex gap-2">
            <input type="text" value={store.aiTheme} onChange={(e) => store.update(() => (store.aiTheme = e.target.value))} placeholder="テーマを入力..." className="input-field" />
            <button onClick={() => store.generatePrompt()} className="btn-primary btn-primary-purple shrink-0">
              生成
            </button>
          </div>
        </div>

        {store.generatedPrompt && (
          <div className="ai-card">
            <div className="flex justify-between items-start sm:items-center gap-3 mb-3 flex-col sm:flex-row">
              <h2 className="ai-step-title mb-0">2. AI (ChatGPT等) にペースト</h2>
              <button onClick={() => store.copyPrompt()} className={`ai-copy-btn ${store.copySuccess ? "success" : "normal"}`}>
                <i className={`fa-solid ${store.copySuccess ? "fa-check" : "fa-copy"}`}></i>
                <span>{store.copySuccess ? "コピーしました！" : "コピー"}</span>
              </button>
            </div>
            <textarea readOnly value={store.generatedPrompt} className="textarea-field ai-textarea-readonly"></textarea>
            <p className="ai-help-text">コピーしたテキストをAIに送信し、返ってきたJSONコードを「JSONインポート」タブに貼り付けてください。</p>
          </div>
        )}
      </Transition>

      <Transition show={store.aiTab === "import"} enter="view-enter-active" enterStart="modal-enter-from" enterEnd="modal-enter-to" leave="" leaveStart="" leaveEnd="">
        <div className="ai-card">
          <h2 className="ai-step-title">AIが生成したJSONを貼り付け</h2>
          <p className="ai-step-desc">
            AIから出力された <code>```json ... ```</code> の中身をここに貼り付けてください。
          </p>

          <textarea
            value={store.importJsonText}
            onChange={(e) => store.update(() => (store.importJsonText = e.target.value))}
            placeholder='{"categories": [...], "tags": [...], "projects": [...]}'
            className="textarea-field ai-textarea"
          ></textarea>

          <button onClick={() => store.importAiData()} className={`btn-primary w-full flex items-center justify-center gap-2 ${!store.importJsonText.trim() ? "disabled" : ""}`}>
            <i className="fa-solid fa-download"></i> アプリに取り込む
          </button>
        </div>
      </Transition>
    </div>
  );
}

// サブビューの外枠（表示状態・現在ビュー・ヘッダのアイコン/タイトル）のシグネチャ。
// サブビュー非表示中は短絡する（内側ビューはそれぞれ自前で購読する）。
function subViewSignature(store: FlashcardStore): string {
  if (!store.isSubView) return "inactive";
  return JSON.stringify([store.currentView, store.subViewIcon, store.subViewTitle]);
}

export function SubView() {
  const store = useStoreView(subViewSignature);
  const view = store.currentView;

  return (
    <Transition
      show={store.isSubView}
      className="view-container bg-blur"
      enter="view-enter-active"
      enterStart="view-enter-from-dynamic"
      enterEnd="view-enter-to"
      leave="view-leave-active-fast"
      leaveStart="view-enter-to"
      leaveEnd="view-leave-to-dynamic"
    >
      <header className="view-header border-b">
        <button onClick={() => store.goBackFromSubView()} className="btn-icon btn-glass shrink-0">
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <div className="subview-title-wrap">
          {store.subViewIcon && <i className={`fa-solid ${store.subViewIcon}`} style={{ color: "#c084fc" }}></i>}
          <h1 className="truncate text-center w-full text-lg font-bold">{store.subViewTitle}</h1>
        </div>

        <div className="header-spacer"></div>
      </header>

      <main className={`view-main ${view === "ai" ? "flex flex-col items-center" : ""}`}>
        {view === "cardList" && <CardListView />}
        {view === "stats" && <StatsView />}
        {view === "categories" && <CategoriesView />}
        {view === "settings" && <SettingsView />}
        {view === "ai" && <AiView />}
      </main>

      {view === "cardList" && (
        <button onClick={() => store.openCardModal()} className="fab-btn fab-purple" title="カードを追加">
          <i className="fa-solid fa-plus"></i>
        </button>
      )}
    </Transition>
  );
}
