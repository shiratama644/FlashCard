import { CardAnimations } from "../../animations/card";
import type { FlashcardStore } from "../FlashcardStore";
import type { Card, Id, Project, Tag } from "../../data/types";
import { replaceWhere } from "../storeUtils";

export interface ProjectActions {
  getTagsForCurrentProject(): Tag[];
  openProject(id: Id, reverse?: boolean): void;
  goHome(): void;
  addProject(): void;
  openEditProject(project: Project): void;
  saveProjectEdit(): void;
  deleteProject(id: Id): void;
  shareProject(project: Project): void;
  openCardModal(index?: number | null): void;
  addDetail(): void;
  removeDetail(index: number): void;
  saveCard(): void;
  deleteCard(index: number): void;
  openStats(id: Id): void;
  shuffleCards(): void;
  syncActiveProject(): void;
  toggleDetailExpanded(index: number): void;
  setDetailTag(index: number, tagId: Id | ""): void;
  setDetailValue(index: number, value: string): void;
}

export const createProjectActions = (store: FlashcardStore): ProjectActions => ({
  getTagsForCurrentProject(): Tag[] {
    return store.activeProject ? store.getTagsByCategory(store.activeProject.categoryId) : [];
  },
  openProject(id: Id, reverse = false): void {
    store.activeProjectId = id;
    store.activeProject = store.projects.find((p) => p.id === id) || null;
    store.currentCards = store.activeProject ? store.activeProject.cards : [];
    store.calculateStats();
    store.isReverseMode = reverse;
    store.currentIndex = 0;
    store.isFlipped = false;
    store.isCompleted = false;
    store.currentSwipeX = 0;
    store.targetSwipeX = 0;
    store.sessionStats = { like: 0, nope: 0 };
    store.donutPercentage = 0;
    store.commit();

    store.nextTick(() => {
      store.raf(() => {
        store.currentView = "study";
        store.nextTick(() => {
          CardAnimations.resetCardState(store.refs.cardElement);
          store.resetOverlay();
        });
      });
    });
  },
  goHome(): void {
    store.forceSave();
    store.currentView = "home";
    setTimeout(() => {
      if (store.currentView === "home") {
        store.activeProjectId = null;
        store.activeProject = null;
        store.currentCards = [];
        store.isCompleted = false;
        store.commit();
      }
    }, 300);
  },
  addProject(): void {
    if (!store.newProjectTitle.trim() || !store.newProjectCategoryId) return;
    store.projects = [{ id: Date.now(), title: store.newProjectTitle, description: store.newProjectDesc, categoryId: store.newProjectCategoryId, cards: [] }, ...store.projects];
    store.newProjectTitle = "";
    store.newProjectDesc = "";
    store.newProjectCategoryId = "";
    store.showProjectModal = false;
    store.forceSave();
    store.commit();
  },
  openEditProject(project: Project): void {
    store.editingProject = { id: project.id, title: project.title, description: project.description || "", categoryId: project.categoryId };
    store.showEditProjectModal = true;
    store.commit();
  },
  saveProjectEdit(): void {
    if (!store.editingProject.title.trim() || !store.editingProject.categoryId) return;
    const index = store.projects.findIndex((p) => p.id === store.editingProject.id);
    if (index !== -1) {
      const title = store.editingProject.title.trim();
      const description = store.editingProject.description;
      const categoryId = store.editingProject.categoryId;
      store.projects = replaceWhere(store.projects, (p) => p.id === store.editingProject.id, (p) => ({ ...p, title, description, categoryId }));
      store.syncActiveProject();
      store.forceSave();
    }
    store.showEditProjectModal = false;
    store.commit();
  },
  deleteProject(id: Id): void {
    store.showConfirm("プロジェクトの削除", "このプロジェクトと、中に含まれるすべてのカードを削除しますか？", () => {
      store.projects = store.projects.filter((p) => p.id !== id);
      store.forceSave();
      store.showEditProjectModal = false;
      store.commit();
      store.addToast("プロジェクトを削除しました", "success");
    });
  },
  shareProject(project: Project): void {
    try {
      const category = store.categoryMap[String(project.categoryId)];
      const projectTags: Tag[] = [];
      const cleanCards = project.cards.map((card) => {
        const cleanDetails = card.backDetails.map((detail) => ({ tagId: detail.tagId, value: detail.value }));
        return { front: card.front, backDetails: cleanDetails, example: card.example };
      });
      const cleanProject = { title: project.title, description: project.description, categoryId: project.categoryId, cards: cleanCards };

      project.cards.forEach((card) => {
        card.backDetails.forEach((detail) => {
          if (detail.tagId) {
            const tag = store.tagMap[String(detail.tagId)];
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
          .then(() => store.addToast("共有しました", "success"))
          .catch((err: DOMException) => {
            if (err.name !== "AbortError") store.addToast("共有に失敗しました", "error");
          });
      } else {
        store.fallbackCopyTextToClipboard(shareText);
        store.showAlert("共有", "お使いのブラウザは共有機能に対応していないため、テキストをクリップボードにコピーしました。");
      }
    } catch {
      store.addToast("共有データの作成に失敗しました", "error");
    }
  },
  openCardModal(index: number | null = null): void {
    store.showCardModal = true;
    store.isBackDetailsExpanded = true;
    store.editingCardIndex = index;
    if (index !== null && store.activeProject) {
      const card = store.activeProject.cards[index];
      store.newCardFront = card.front;
      store.newCardExample = card.example || "";
      // 先頭だけ展開した新しい配列を構築する（in-place の [0].expanded 代入を避ける）。
      store.newCardDetails = card.backDetails.map((d, i) => ({ tagId: d.tagId || "", value: d.value, expanded: i === 0 }));
    } else {
      store.newCardFront = "";
      store.newCardDetails = [{ tagId: "", value: "", expanded: true }];
      store.newCardExample = "";
    }
    store.commit();
    store.nextTick(() => {
      if (store.refs.frontInput) store.refs.frontInput.focus();
    });
  },
  addDetail(): void {
    store.newCardDetails = [...store.newCardDetails.map((d) => ({ ...d, expanded: false })), { tagId: "", value: "", expanded: true }];
    store.commit();
    store.nextTick(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(".detail-value-input");
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    });
  },
  removeDetail(index: number): void {
    if (store.newCardDetails.length > 1) store.newCardDetails = store.newCardDetails.filter((_, i) => i !== index);
    else store.newCardDetails = [{ tagId: "", value: "", expanded: true }];
    store.commit();
  },
  saveCard(): void {
    if (!store.newCardFront.trim()) return;
    const validDetails = store.newCardDetails.filter((d) => d.value.trim() !== "");
    if (validDetails.length === 0) return;
    const project = store.projects.find((p) => p.id === store.activeProjectId);
    if (project) {
      const newCardData: Card = {
        front: store.newCardFront,
        backDetails: validDetails.map((d) => ({ tagId: d.tagId, value: d.value.trim() })),
        example: store.newCardExample,
        stats: { likes: 0, nopes: 0, status: "new" },
      };
      let newCards: Card[];
      if (store.editingCardIndex !== null) {
        const editIndex = store.editingCardIndex;
        const card: Card = { ...newCardData, stats: project.cards[editIndex].stats || { likes: 0, nopes: 0, status: "new" } };
        newCards = project.cards.map((c, i) => (i === editIndex ? card : c));
      } else {
        newCards = [...project.cards, newCardData];
        if (store.isCompleted) {
          store.isCompleted = false;
          store.currentIndex = newCards.length - 1;
        }
      }
      store.projects = replaceWhere(store.projects, (p) => p.id === store.activeProjectId, (p) => ({ ...p, cards: newCards }));
      store.syncActiveProject();
    }
    store.calculateStats();
    store.showCardModal = false;
    store.forceSave();
    store.commit();
  },
  deleteCard(index: number): void {
    store.showConfirm("カードの削除", "このカードを削除しますか？", () => {
      const project = store.projects.find((p) => p.id === store.activeProjectId);
      if (project) {
        const newCards = project.cards.filter((_, i) => i !== index);
        store.projects = replaceWhere(store.projects, (p) => p.id === store.activeProjectId, (p) => ({ ...p, cards: newCards }));
        store.syncActiveProject();
        if (store.currentIndex >= newCards.length) store.currentIndex = Math.max(0, newCards.length - 1);
        if (newCards.length === 0) store.isCompleted = false;
        store.calculateStats();
        store.forceSave();
        store.commit();
        store.addToast("カードを削除しました", "success");
      }
    });
  },
  openStats(id: Id): void {
    store.activeProjectId = id;
    store.activeProject = store.projects.find((p) => p.id === id) || null;
    store.currentCards = store.activeProject ? store.activeProject.cards : [];
    store.calculateStats();
    store.commit();
    store.nextTick(() => {
      store.raf(() => {
        store.currentView = "stats";
      });
    });
  },
  shuffleCards(): void {
    if (!store.activeProject || store.activeProject.cards.length === 0 || store.isAnimating) return;
    store.isAnimating = true;
    store.commit();
    const cardEl = store.refs.cardElement;

    CardAnimations.shuffle(cardEl, () => {
      // 元配列をコピーしてシャッフルし、新しい cards 配列として差し替える（in-place swap を避ける）。
      const array = [...store.activeProject!.cards];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      store.projects = replaceWhere(store.projects, (p) => p.id === store.activeProjectId, (p) => ({ ...p, cards: array }));
      store.syncActiveProject();
      store.currentIndex = 0;
      store.isCompleted = false;
      store.sessionStats = { like: 0, nope: 0 };
      store.donutPercentage = 0;
      store.isFlipped = false;
      store.targetSwipeX = 0;
      store.currentSwipeX = 0;
      store.forceSave();
      store.resetOverlay();
      store.commit();

      store.nextTick(() => {
        store.raf(() => {
          CardAnimations.shuffleEnter(cardEl, () => {
            store.isAnimating = false;
            store.commit();
          });
        });
      });
    });
  },
  // activeProjectId を基に activeProject / currentCards を projects から再導出する（エイリアス整合）。
  // projects を immutable に差し替えた直後に呼び、表示側が参照する派生値を最新に保つ。
  syncActiveProject(): void {
    store.activeProject = store.projects.find((p) => p.id === store.activeProjectId) || null;
    store.currentCards = store.activeProject ? store.activeProject.cards : [];
  },
  // CardModal の裏面詳細（newCardDetails）の immutable 更新（インライン nested mutation の置換）。
  toggleDetailExpanded(index: number): void {
    store.newCardDetails = store.newCardDetails.map((d, i) => (i === index ? { ...d, expanded: !d.expanded } : d));
    store.commit();
  },
  setDetailTag(index: number, tagId: Id | ""): void {
    store.newCardDetails = store.newCardDetails.map((d, i) => (i === index ? { ...d, tagId } : d));
    store.commit();
  },
  setDetailValue(index: number, value: string): void {
    store.newCardDetails = store.newCardDetails.map((d, i) => (i === index ? { ...d, value } : d));
    store.commit();
  },
});
