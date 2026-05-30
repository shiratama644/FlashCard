import { db } from '../db.js';
import { z } from 'zod';
import { CategorySchema, TagSchema, ProjectSchema } from '../schema.js';
import { DEFAULT_CATEGORIES, DEFAULT_TAGS, DEFAULT_PROJECTS } from '../constants.js';

export const dataMethods = {
  updateMaps() {
    this.categoryMap = this.categories.reduce((acc, cat) => { acc[cat.id] = cat; return acc; }, {});
    this.tagMap = this.tags.reduce((acc, tag) => { acc[tag.id] = tag; return acc; }, {});
  },
  calculateStats() {
    if (!this.activeProject || this.activeProject.cards.length === 0) {
      this.projectStats = { mastered: 0, learning: 0, new: 0, masteredRate: 0, learningRate: 0, newRate: 0 };
      return;
    }
    const total = this.activeProject.cards.length;
    let mastered = 0, learning = 0, newCards = 0;
    this.activeProject.cards.forEach(c => {
      if (!c.stats) newCards++;
      else if (c.stats.status === 'mastered') mastered++;
      else if (c.stats.status === 'learning') learning++;
      else newCards++;
    });
    this.projectStats = {
      mastered, learning, new: newCards,
      masteredRate: (mastered / total) * 100, learningRate: (learning / total) * 100, newRate: (newCards / total) * 100
    };
  },
  updateStatsRates() {
    if (!this.activeProject) return;
    const total = this.activeProject.cards.length;
    if (total === 0) return;
    this.projectStats.masteredRate = (this.projectStats.mastered / total) * 100;
    this.projectStats.learningRate = (this.projectStats.learning / total) * 100;
    this.projectStats.newRate = (this.projectStats.new / total) * 100;
  },
  async loadAndMigrateData() {
    try {
      const cats = await db.categories.toArray();
      const tags = await db.tags.toArray();
      const projs = await db.projects.toArray();

      if (cats.length > 0 || tags.length > 0 || projs.length > 0) {
        this.categories = cats; this.tags = tags; this.projects = projs;
      } else {
        let loadedCategories = localStorage.getItem('flashcard_categories_v4');
        let loadedTags = localStorage.getItem('flashcard_tags_v4');
        let loadedProjects = localStorage.getItem('flashcard_projects_v4');

        if (loadedCategories && loadedTags && loadedProjects) {
          const parsedCats = z.array(CategorySchema).safeParse(JSON.parse(loadedCategories));
          const parsedTags = z.array(TagSchema).safeParse(JSON.parse(loadedTags));
          const parsedProjs = z.array(ProjectSchema).safeParse(JSON.parse(loadedProjects));
          this.categories = parsedCats.success ? parsedCats.data : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
          this.tags = parsedTags.success ? parsedTags.data : JSON.parse(JSON.stringify(DEFAULT_TAGS));
          this.projects = parsedProjs.success ? parsedProjs.data : JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        } else {
          this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
          this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
          this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        }
        this.forceSave();
      }
      this.projects.forEach(p => { p.cards.forEach(c => { if (!c.stats) c.stats = { likes: 0, nopes: 0, status: 'new' }; }); });
      this.updateMaps();
    } catch (error) {
      this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
      this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
      this.updateMaps();
      this.addToast('データの読み込みに失敗し、初期データをロードしました', 'error');
    }
  },
  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => { this.saveData(); }, 1500);
  },
  forceSave() {
    if (this.saveTimeout) { clearTimeout(this.saveTimeout); this.saveTimeout = null; }
    return this.saveData();
  },
  async saveData() {
    if (this.isSaving) { this.saveQueue = true; return; }
    this.isSaving = true; this.saveQueue = false;
    try {
      const plainCategories = JSON.parse(JSON.stringify(this.categories));
      const plainTags = JSON.parse(JSON.stringify(this.tags));
      const plainProjects = JSON.parse(JSON.stringify(this.projects));

      await db.transaction('rw', db.categories, db.tags, db.projects, async () => {
        const existingCatIds = await db.categories.toCollection().primaryKeys();
        const existingTagIds = await db.tags.toCollection().primaryKeys();
        const existingProjIds = await db.projects.toCollection().primaryKeys();

        const newCatIds = plainCategories.map(c => c.id);
        const newTagIds = plainTags.map(t => t.id);
        const newProjIds = plainProjects.map(p => p.id);

        const catsToDelete = existingCatIds.filter(id => !newCatIds.includes(id));
        const tagsToDelete = existingTagIds.filter(id => !newTagIds.includes(id));
        const projsToDelete = existingProjIds.filter(id => !newProjIds.includes(id));

        if (catsToDelete.length > 0) await db.categories.bulkDelete(catsToDelete);
        if (tagsToDelete.length > 0) await db.tags.bulkDelete(tagsToDelete);
        if (projsToDelete.length > 0) await db.projects.bulkDelete(projsToDelete);

        await db.categories.bulkPut(plainCategories);
        await db.tags.bulkPut(plainTags);
        await db.projects.bulkPut(plainProjects);
      });
    } catch (error) {
      this.addToast('データの保存に失敗しました', 'error');
    } finally {
      this.isSaving = false;
      if (this.saveQueue) this.saveData();
    }
  },
  async resetAllData() {
    this.showConfirm('データ初期化', 'すべてのデータを初期化しますか？\nこの操作は取り消せません。', async () => {
      try {
        this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        this.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
        this.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
        this.updateMaps(); await this.forceSave();
        this.currentView = 'home';
        this.addToast('データを初期化しました', 'success');
      } catch (e) {
        this.addToast('データの初期化に失敗しました', 'error');
      }
    }, '初期化する');
  }
};