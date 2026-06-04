import type { FlashcardStore } from "../FlashcardStore";
import { TAG_COLORS } from "../../data/constants";
import type { Category, Id, Tag } from "../../data/types";
import { replaceWhere } from "../storeUtils";

export interface CategoryActions {
  getRandomColor(): string;
  getColorCode(colorClass: string): string;
  addCategory(): void;
  deleteCategory(id: Id): void;
  openEditCategory(cat: Category): void;
  saveCategoryEdit(): void;
  getTagsByCategory(categoryId: Id): Tag[];
  addTagToCategory(category: Category): void;
  deleteTag(id: Id): void;
  openEditTag(tag: Tag): void;
  saveTagEdit(): void;
  toggleCategoryExpanded(id: Id): void;
  setCategoryNewTagName(id: Id, value: string): void;
}

export const createCategoryActions = (store: FlashcardStore): CategoryActions => ({
  getRandomColor(): string {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  },
  getColorCode(colorClass: string): string {
    if (!colorClass) return "#ffffff";
    const map: Record<string, string> = { red: "#ef4444", blue: "#3b82f6", green: "#22c55e", yellow: "#eab308", purple: "#a855f7", pink: "#ec4899", cyan: "#06b6d4", orange: "#f97316", teal: "#14b8a6", slate: "#64748b" };
    for (const key in map) {
      if (colorClass.includes(key)) return map[key];
    }
    return "#ffffff";
  },
  addCategory(): void {
    if (!store.newCategoryName.trim()) return;
    store.categories = [...store.categories, { id: "cat_" + Date.now(), name: store.newCategoryName.trim(), colorClass: store.getRandomColor(), expanded: true, newTagName: "" }];
    store.newCategoryName = "";
    store.updateMaps();
    store.forceSave();
    store.commit();
  },
  deleteCategory(id: Id): void {
    store.showConfirm("カテゴリの削除", "このカテゴリと、中に含まれるすべてのタグを削除しますか？", () => {
      store.categories = store.categories.filter((c) => c.id !== id);
      store.tags = store.tags.filter((t) => t.categoryId !== id);
      store.updateMaps();
      store.forceSave();
      store.commit();
      store.addToast("カテゴリを削除しました", "success");
    });
  },
  openEditCategory(cat: Category): void {
    store.editingCategory = { id: cat.id, name: cat.name, colorClass: cat.colorClass };
    store.showEditCategoryModal = true;
    store.commit();
  },
  saveCategoryEdit(): void {
    if (!store.editingCategory.name.trim()) return;
    const index = store.categories.findIndex((c) => c.id === store.editingCategory.id);
    if (index !== -1) {
      const name = store.editingCategory.name.trim();
      const colorClass = store.editingCategory.colorClass;
      store.categories = replaceWhere(store.categories, (c) => c.id === store.editingCategory.id, (c) => ({ ...c, name, colorClass }));
      store.updateMaps();
      store.forceSave();
    }
    store.showEditCategoryModal = false;
    store.commit();
  },
  getTagsByCategory(categoryId: Id): Tag[] {
    return store.tags.filter((t) => t.categoryId == categoryId);
  },
  addTagToCategory(category: Category): void {
    if (!category.newTagName || !category.newTagName.trim()) return;
    store.tags = [...store.tags, { id: Date.now(), name: category.newTagName.trim(), categoryId: category.id, colorClass: store.getRandomColor() }];
    store.categories = replaceWhere(store.categories, (c) => c.id === category.id, (c) => ({ ...c, newTagName: "" }));
    store.updateMaps();
    store.forceSave();
    store.commit();
  },
  deleteTag(id: Id): void {
    store.showConfirm("タグの削除", "このタグを削除しますか？", () => {
      store.tags = store.tags.filter((t) => t.id !== id);
      store.updateMaps();
      store.forceSave();
      store.commit();
      store.addToast("タグを削除しました", "success");
    });
  },
  openEditTag(tag: Tag): void {
    store.editingTag = { id: tag.id, name: tag.name, colorClass: tag.colorClass };
    store.showEditTagModal = true;
    store.commit();
  },
  saveTagEdit(): void {
    if (!store.editingTag.name.trim()) return;
    const index = store.tags.findIndex((t) => t.id === store.editingTag.id);
    if (index !== -1) {
      const name = store.editingTag.name.trim();
      const colorClass = store.editingTag.colorClass;
      store.tags = replaceWhere(store.tags, (t) => t.id === store.editingTag.id, (t) => ({ ...t, name, colorClass }));
      store.updateMaps();
      store.forceSave();
    }
    store.showEditTagModal = false;
    store.commit();
  },
  // SubView のカテゴリ展開トグル（categories を新配列で差し替える immutable 更新）。
  toggleCategoryExpanded(id: Id): void {
    store.categories = replaceWhere(store.categories, (c) => c.id === id, (c) => ({ ...c, expanded: !c.expanded }));
    store.commit();
  },
  // SubView のタグ名入力（categories を新配列で差し替える immutable 更新）。
  setCategoryNewTagName(id: Id, value: string): void {
    store.categories = replaceWhere(store.categories, (c) => c.id === id, (c) => ({ ...c, newTagName: value }));
    store.commit();
  },
});
