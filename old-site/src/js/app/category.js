import { TAG_COLORS } from '../constants.js';

export const categoryMethods = {
  getRandomColor() { return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]; },
  getColorCode(colorClass) {
    if (!colorClass) return '#ffffff';
    const map = { 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 'yellow': '#eab308', 'purple': '#a855f7', 'pink': '#ec4899', 'cyan': '#06b6d4', 'orange': '#f97316', 'teal': '#14b8a6', 'slate': '#64748b' };
    for (const key in map) { if (colorClass.includes(key)) return map[key]; }
    return '#ffffff';
  },
  addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.categories.push({ id: 'cat_' + Date.now(), name: this.newCategoryName.trim(), colorClass: this.getRandomColor(), expanded: true, newTagName: '' });
    this.newCategoryName = '';
    this.updateMaps(); this.forceSave();
  },
  deleteCategory(id) {
    this.showConfirm('カテゴリの削除', 'このカテゴリと、中に含まれるすべてのタグを削除しますか？', () => {
      this.categories = this.categories.filter(c => c.id !== id);
      this.tags = this.tags.filter(t => t.categoryId !== id);
      this.updateMaps(); this.forceSave();
      this.addToast('カテゴリを削除しました', 'success');
    });
  },
  openEditCategory(cat) { this.editingCategory = { ...cat }; this.showEditCategoryModal = true; },
  saveCategoryEdit() {
    if (!this.editingCategory.name.trim()) return;
    const index = this.categories.findIndex(c => c.id === this.editingCategory.id);
    if (index !== -1) {
      this.categories[index].name = this.editingCategory.name.trim();
      this.categories[index].colorClass = this.editingCategory.colorClass;
      this.updateMaps(); this.forceSave();
    }
    this.showEditCategoryModal = false;
  },
  getTagsByCategory(categoryId) { return this.tags.filter(t => t.categoryId == categoryId); },
  addTagToCategory(category) {
    if (!category.newTagName || !category.newTagName.trim()) return;
    this.tags.push({ id: Date.now(), name: category.newTagName.trim(), categoryId: category.id, colorClass: this.getRandomColor() });
    category.newTagName = '';
    this.updateMaps(); this.forceSave();
  },
  deleteTag(id) {
    this.showConfirm('タグの削除', 'このタグを削除しますか？', () => {
      this.tags = this.tags.filter(t => t.id !== id);
      this.updateMaps(); this.forceSave();
      this.addToast('タグを削除しました', 'success');
    });
  },
  openEditTag(tag) { this.editingTag = { ...tag }; this.showEditTagModal = true; },
  saveTagEdit() {
    if (!this.editingTag.name.trim()) return;
    const index = this.tags.findIndex(t => t.id === this.editingTag.id);
    if (index !== -1) {
      this.tags[index].name = this.editingTag.name.trim();
      this.tags[index].colorClass = this.editingTag.colorClass;
      this.updateMaps(); this.forceSave();
    }
    this.showEditTagModal = false;
  }
};