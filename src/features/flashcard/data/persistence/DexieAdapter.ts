// IndexedDB(Dexie) への永続化アダプタ（無料/ゲスト用・既定）。
// 既存 dataActions の Dexie 直書きロジックをそのまま移設したもので、挙動は不変。
import { db } from "../db";
import type { Id } from "../types";
import type { PersistenceAdapter, PersistenceSnapshot } from "./types";

export class DexieAdapter implements PersistenceAdapter {
  async loadAll(): Promise<PersistenceSnapshot | null> {
    const categories = await db.categories.toArray();
    const tags = await db.tags.toArray();
    const projects = await db.projects.toArray();
    // どのテーブルにもデータが無ければ「未保存」とみなす（旧 loadAndMigrateData と同条件）。
    if (categories.length === 0 && tags.length === 0 && projects.length === 0) return null;
    return { categories, tags, projects };
  }

  async saveAll(data: PersistenceSnapshot): Promise<void> {
    // data は呼び出し側で隔離済みの plain スナップショット（PersistenceAdapter の契約）。
    // そのため再 clone はせず、そのまま Dexie へ書き込む。
    await db.transaction("rw", db.categories, db.tags, db.projects, async () => {
      const existingCatIds = await db.categories.toCollection().primaryKeys();
      const existingTagIds = await db.tags.toCollection().primaryKeys();
      const existingProjIds = await db.projects.toCollection().primaryKeys();

      const newCatIds = data.categories.map((c) => c.id);
      const newTagIds = data.tags.map((t) => t.id);
      const newProjIds = data.projects.map((p) => p.id);

      const catsToDelete = existingCatIds.filter((id) => !newCatIds.includes(id as Id));
      const tagsToDelete = existingTagIds.filter((id) => !newTagIds.includes(id as Id));
      const projsToDelete = existingProjIds.filter((id) => !newProjIds.includes(id as Id));

      if (catsToDelete.length > 0) await db.categories.bulkDelete(catsToDelete);
      if (tagsToDelete.length > 0) await db.tags.bulkDelete(tagsToDelete);
      if (projsToDelete.length > 0) await db.projects.bulkDelete(projsToDelete);

      await db.categories.bulkPut(data.categories);
      await db.tags.bulkPut(data.tags);
      await db.projects.bulkPut(data.projects);
    });
  }
}
