import type { Category, Project, Tag } from "@/types/flashcard";
import { getDb } from "@/lib/db/dexie.client";

export type FlashcardData = {
  categories: Category[];
  tags: Tag[];
  projects: Project[];
};

export async function loadFlashcardData(): Promise<FlashcardData | null> {
  const db = getDb();
  if (!db) return null;

  const [categories, tags, projects] = await Promise.all([
    db.categories.toArray(),
    db.tags.toArray(),
    db.projects.toArray(),
  ]);

  if (categories.length === 0 && tags.length === 0 && projects.length === 0) {
    return null;
  }

  return { categories, tags, projects };
}

export async function saveFlashcardData(data: FlashcardData): Promise<void> {
  const db = getDb();
  if (!db) return;

  const plain: FlashcardData = JSON.parse(JSON.stringify(data));

  await db.transaction("rw", db.categories, db.tags, db.projects, async () => {
    const existingCatIds = await db.categories.toCollection().primaryKeys();
    const existingTagIds = await db.tags.toCollection().primaryKeys();
    const existingProjIds = await db.projects.toCollection().primaryKeys();

    const newCatIds = new Set(plain.categories.map((c) => c.id));
    const newTagIds = new Set(plain.tags.map((t) => t.id));
    const newProjIds = new Set(plain.projects.map((p) => p.id));

    const catsToDelete = existingCatIds.filter((id) => !newCatIds.has(id));
    const tagsToDelete = existingTagIds.filter((id) => !newTagIds.has(id));
    const projsToDelete = existingProjIds.filter((id) => !newProjIds.has(id));

    if (catsToDelete.length > 0) await db.categories.bulkDelete(catsToDelete);
    if (tagsToDelete.length > 0) await db.tags.bulkDelete(tagsToDelete);
    if (projsToDelete.length > 0) await db.projects.bulkDelete(projsToDelete);

    await db.categories.bulkPut(plain.categories);
    await db.tags.bulkPut(plain.tags);
    await db.projects.bulkPut(plain.projects);
  });
}
