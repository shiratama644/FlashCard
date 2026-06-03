import { z } from "zod";
import type { FlashcardStore } from "../FlashcardStore";
import { db } from "../../data/db";
import { DEFAULT_CATEGORIES, DEFAULT_PROJECTS, DEFAULT_TAGS } from "../../data/constants";
import { CategorySchema, ProjectSchema, TagSchema } from "../../data/schema";
import type { Category, Id, Project, Tag } from "../../data/types";
import { clone } from "../storeUtils";

export interface DataActions {
  updateMaps(): void;
  calculateStats(): void;
  updateStatsRates(): void;
  loadAndMigrateData(): Promise<void>;
  scheduleSave(): void;
  forceSave(): Promise<void>;
  saveData(): Promise<void>;
  resetAllData(): void;
}

export const createDataActions = (store: FlashcardStore): DataActions => ({
  updateMaps(): void {
    store.categoryMap = store.categories.reduce<Record<string, Category>>((acc, cat) => {
      acc[String(cat.id)] = cat;
      return acc;
    }, {});
    store.tagMap = store.tags.reduce<Record<string, Tag>>((acc, tag) => {
      acc[String(tag.id)] = tag;
      return acc;
    }, {});
  },
  calculateStats(): void {
    if (!store.activeProject || store.activeProject.cards.length === 0) {
      store.projectStats = { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 };
      return;
    }
    const total = store.activeProject.cards.length;
    let mastered = 0,
      learning = 0,
      newCards = 0;
    store.activeProject.cards.forEach((c) => {
      if (!c.stats) newCards++;
      else if (c.stats.status === "mastered") mastered++;
      else if (c.stats.status === "learning") learning++;
      else newCards++;
    });
    store.projectStats = {
      mastered,
      learning,
      new: newCards,
      masteredRate: (mastered / total) * 100,
      learningRate: (learning / total) * 100,
      newRate: (newCards / total) * 100,
    };
  },
  updateStatsRates(): void {
    if (!store.activeProject) return;
    const total = store.activeProject.cards.length;
    if (total === 0) return;
    store.projectStats = {
      ...store.projectStats,
      masteredRate: (store.projectStats.mastered / total) * 100,
      learningRate: (store.projectStats.learning / total) * 100,
      newRate: (store.projectStats.new / total) * 100,
    };
  },
  async loadAndMigrateData(): Promise<void> {
    try {
      const cats = await db.categories.toArray();
      const tags = await db.tags.toArray();
      const projs = await db.projects.toArray();

      if (cats.length > 0 || tags.length > 0 || projs.length > 0) {
        store.categories = cats;
        store.tags = tags;
        store.projects = projs;
      } else {
        const loadedCategories = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_categories_v4") : null;
        const loadedTags = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_tags_v4") : null;
        const loadedProjects = typeof localStorage !== "undefined" ? localStorage.getItem("flashcard_projects_v4") : null;

        if (loadedCategories && loadedTags && loadedProjects) {
          const parsedCats = z.array(CategorySchema).safeParse(JSON.parse(loadedCategories));
          const parsedTags = z.array(TagSchema).safeParse(JSON.parse(loadedTags));
          const parsedProjs = z.array(ProjectSchema).safeParse(JSON.parse(loadedProjects));
          store.categories = parsedCats.success ? (parsedCats.data as Category[]) : clone(DEFAULT_CATEGORIES);
          store.tags = parsedTags.success ? (parsedTags.data as Tag[]) : clone(DEFAULT_TAGS);
          store.projects = parsedProjs.success ? (parsedProjs.data as Project[]) : clone(DEFAULT_PROJECTS);
        } else {
          store.categories = clone(DEFAULT_CATEGORIES);
          store.tags = clone(DEFAULT_TAGS);
          store.projects = clone(DEFAULT_PROJECTS);
        }
        store.forceSave();
      }
      // stats 未設定のカードだけ初期値を補完した新しい projects を構築する（in-place 補完を避ける）。
      store.projects = store.projects.map((p) => ({
        ...p,
        cards: p.cards.map((c) => (c.stats ? c : { ...c, stats: { likes: 0, nopes: 0, status: "new" } })),
      }));
      store.updateMaps();
      store.commit();
    } catch {
      store.categories = clone(DEFAULT_CATEGORIES);
      store.tags = clone(DEFAULT_TAGS);
      store.projects = clone(DEFAULT_PROJECTS);
      store.updateMaps();
      store.commit();
      store.addToast("データの読み込みに失敗し、初期データをロードしました", "error");
    }
  },
  scheduleSave(): void {
    if (store.saveTimeoutId) clearTimeout(store.saveTimeoutId);
    store.saveTimeoutId = setTimeout(() => {
      store.saveData();
    }, 1500);
  },
  forceSave(): Promise<void> {
    if (store.saveTimeoutId) {
      clearTimeout(store.saveTimeoutId);
      store.saveTimeoutId = null;
    }
    return store.saveData();
  },
  async saveData(): Promise<void> {
    if (store.isSaving) {
      store.saveQueue = true;
      return;
    }
    store.isSaving = true;
    store.saveQueue = false;
    try {
      const plainCategories = clone(store.categories);
      const plainTags = clone(store.tags);
      const plainProjects = clone(store.projects);

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
      store.addToast("データの保存に失敗しました", "error");
    } finally {
      store.isSaving = false;
      if (store.saveQueue) store.saveData();
    }
  },
  resetAllData(): void {
    store.showConfirm(
      "データ初期化",
      "すべてのデータを初期化しますか？\nこの操作は取り消せません。",
      async () => {
        try {
          store.categories = clone(DEFAULT_CATEGORIES);
          store.tags = clone(DEFAULT_TAGS);
          store.projects = clone(DEFAULT_PROJECTS);
          store.updateMaps();
          await store.forceSave();
          store.currentView = "home";
          store.addToast("データを初期化しました", "success");
        } catch {
          store.addToast("データの初期化に失敗しました", "error");
        }
      },
      "初期化する"
    );
  },
});
