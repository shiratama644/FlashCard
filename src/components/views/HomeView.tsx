"use client";

// 1. HOME VIEW（index.html 118-183 の忠実移植）
import { useStore } from "@/store/StoreProvider";
import { Transition } from "../Transition";

export function HomeView() {
  const store = useStore();

  return (
    <Transition
      show={store.currentView === "home"}
      className="view-container"
      enter="view-enter-active"
      enterStart="view-enter-from-left"
      enterEnd="view-enter-to"
      leave="view-leave-active-fast"
      leaveStart="view-enter-to"
      leaveEnd="view-leave-to-left"
    >
      <header className="view-header">
        <h1 className="view-title">
          <i className="fa-solid fa-layer-group text-purple-400"></i> Projects
        </h1>
        <div className="flex gap-3">
          <button onClick={() => (store.currentView = "ai")} className="btn-icon btn-gradient-purple" title="AIで生成">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </button>
          <button onClick={() => (store.currentView = "categories")} className="btn-icon btn-glass" title="カテゴリ・タグ管理">
            <i className="fa-solid fa-folder-tree"></i>
          </button>
          <button onClick={() => (store.currentView = "settings")} className="btn-icon btn-glass" title="設定">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </header>

      <main className="view-main pt-0">
        <div className="project-grid">
          {store.projects.map((project) => (
            <div key={String(project.id)} onClick={() => store.openProject(project.id)} className="project-card">
              <div className="project-card-bg"></div>

              <div className="project-card-header">
                <div className="project-info">
                  <div>
                    <span className={`category-badge ${store.categoryMap[String(project.categoryId)]?.colorClass || "default-badge"}`}>
                      {store.categoryMap[String(project.categoryId)]?.name || "未分類"}
                    </span>
                  </div>
                  <h2 className="project-title">{project.title}</h2>
                </div>

                <div className="project-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.shareProject(project);
                    }}
                    className="btn-icon btn-panel"
                    title="共有する"
                  >
                    <i className="fa-solid fa-share-nodes text-sm"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.openProject(project.id, true);
                    }}
                    className="btn-icon btn-panel"
                    title="裏面(意味)から学習"
                  >
                    <i className="fa-solid fa-right-left text-sm"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.openStats(project.id);
                    }}
                    className="btn-icon btn-panel"
                    title="統計を見る"
                  >
                    <i className="fa-solid fa-chart-pie text-sm"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.openEditProject(project);
                    }}
                    className="btn-icon btn-panel"
                    title="編集する"
                  >
                    <i className="fa-solid fa-pen text-sm"></i>
                  </button>
                </div>
              </div>

              <p className="project-desc">{project.description}</p>
              <div className="project-meta">
                <i className="fa-regular fa-clone"></i> <span>{project.cards.length + " cards"}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => store.update(() => (store.showProjectModal = true))} className="fab-btn fab-cyan" title="新規プロジェクト">
        <i className="fa-solid fa-plus"></i>
      </button>
    </Transition>
  );
}
