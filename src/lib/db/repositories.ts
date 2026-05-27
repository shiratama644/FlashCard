import type { Category, Project, Tag } from "@/types/flashcard";
import { getDb } from "@/lib/db/dexie.client";

type FlashcardData = {
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

  await db.transaction("rw", db.categories, db.tags, db.projects, async () => {
    await db.categories.clear();
    await db.tags.clear();
    await db.projects.clear();

    await db.categories.bulkPut(data.categories);
    await db.tags.bulkPut(data.tags);
    await db.projects.bulkPut(data.projects);
  });
}
