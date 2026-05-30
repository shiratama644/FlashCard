"use client";

import { useCallback, useState } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { ProjectFormModal } from "@/components/flashcard/project-form-modal";
import type { Project } from "@/types/flashcard";

type HomeViewProps = {
  onOpenProject: (projectId: string | number, isReverse?: boolean) => void;
  onOpenStats: (projectId: string | number) => void;
  onOpenAi: () => void;
  onOpenCategories: () => void;
  onOpenSettings: () => void;
};

export function HomeView({ onOpenProject, onOpenStats, onOpenAi, onOpenCategories, onOpenSettings }: HomeViewProps) {
  const {
    projects,
    categoryMap,
    addProject,
    deleteProject,
    saveProjectEdit,
    showConfirm,
    addToast,
    categories,
    tags,
  } = useFlashcard();

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const shareProject = useCallback(
    async (project: Project) => {
      const category = categoryMap[project.categoryId];
      const projectTags: typeof tags = [];

      const cleanCards = project.cards.map((card) => {
        const cleanDetails = card.backDetails.map((d) => ({ tagId: d.tagId, value: d.value }));
        return { front: card.front, backDetails: cleanDetails, example: card.example };
      });

      const cleanProject = { title: project.title, description: project.description, categoryId: project.categoryId, cards: cleanCards };

      project.cards.forEach((card) => {
        card.backDetails.forEach((detail) => {
          if (detail.tagId) {
            const tagItem = tags.find((t) => String(t.id) === String(detail.tagId));
            if (tagItem && !projectTags.find((pt) => pt.id === tagItem.id)) {
              projectTags.push({ id: tagItem.id, name: tagItem.name, categoryId: tagItem.categoryId, colorClass: tagItem.colorClass });
            }
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
        try {
          await navigator.share({ title: project.title, text: shareText });
          addToast("共有しました", "success");
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            addToast("共有に失敗しました", "error");
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareText);
          addToast("クリップボードにコピーしました", "success");
        } catch {
          addToast("共有に失敗しました", "error");
        }
      }
    },
    [categoryMap, tags, addToast],
  );

  const handleDeleteProject = useCallback(
    (id: string | number) => {
      showConfirm("プロジェクトの削除", "このプロジェクトと、中に含まれるすべてのカードを削除しますか？", () => {
        deleteProject(id);
        setEditingProject(null);
        addToast("プロジェクトを削除しました", "success");
      });
    },
    [showConfirm, deleteProject, addToast],
  );

  return (
    <>
      <header className="view-header">
        <h1 className="view-title">
          <i className="fa-solid fa-layer-group text-purple-400" /> Projects
        </h1>
        <div className="flex gap-3">
          <button onClick={onOpenAi} className="btn-icon btn-gradient-purple" title="AIで生成">
            <i className="fa-solid fa-wand-magic-sparkles" />
          </button>
          <button onClick={onOpenCategories} className="btn-icon btn-glass" title="カテゴリ・タグ管理">
            <i className="fa-solid fa-folder-tree" />
          </button>
          <button onClick={onOpenSettings} className="btn-icon btn-glass" title="設定">
            <i className="fa-solid fa-gear" />
          </button>
        </div>
      </header>

      <main className="view-main pt-0">
        <div className="project-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => onOpenProject(project.id)}
            >
              <div className="project-card-bg" />
              <div className="project-card-header">
                <div className="project-info">
                  <div>
                    <span
                      className={`category-badge ${categoryMap[project.categoryId]?.colorClass || "default-badge"}`}
                    >
                      {categoryMap[project.categoryId]?.name || "未分類"}
                    </span>
                  </div>
                  <h2 className="project-title">{project.title}</h2>
                </div>
                <div className="project-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); shareProject(project); }}
                    className="btn-icon btn-panel"
                    style={{ width: "2.5rem", height: "2.5rem" }}
                    title="共有する"
                  >
                    <i className="fa-solid fa-share-nodes text-sm" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenProject(project.id, true); }}
                    className="btn-icon btn-panel"
                    style={{ width: "2.5rem", height: "2.5rem" }}
                    title="裏面(意味)から学習"
                  >
                    <i className="fa-solid fa-right-left text-sm" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenStats(project.id); }}
                    className="btn-icon btn-panel"
                    style={{ width: "2.5rem", height: "2.5rem" }}
                    title="統計を見る"
                  >
                    <i className="fa-solid fa-chart-pie text-sm" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                    className="btn-icon btn-panel"
                    style={{ width: "2.5rem", height: "2.5rem" }}
                    title="編集する"
                  >
                    <i className="fa-solid fa-pen text-sm" />
                  </button>
                </div>
              </div>
              <p className="project-desc">{project.description}</p>
              <div className="project-meta">
                <i className="fa-regular fa-clone" />
                <span>{project.cards.length} cards</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => setShowNewModal(true)} className="fab-btn fab-cyan" title="新規プロジェクト">
        <i className="fa-solid fa-plus" />
      </button>

      {showNewModal && (
        <ProjectFormModal
          mode="new"
          categories={categories}
          onSave={(title, desc, catId) => {
            addProject(title, desc, catId);
            setShowNewModal(false);
            addToast("プロジェクトを作成しました", "success");
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          mode="edit"
          categories={categories}
          initialTitle={editingProject.title}
          initialDescription={editingProject.description || ""}
          initialCategoryId={editingProject.categoryId}
          onSave={(title, desc, catId) => {
            saveProjectEdit({ id: editingProject.id, title, description: desc, categoryId: catId });
            setEditingProject(null);
            addToast("プロジェクトを更新しました", "success");
          }}
          onDelete={() => handleDeleteProject(editingProject.id)}
          onClose={() => setEditingProject(null)}
        />
      )}
    </>
  );
}
