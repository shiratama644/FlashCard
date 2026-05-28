import Dexie, { type Table } from "dexie";
import type { Category, Project, Tag } from "@/types/flashcard";

class FlashcardDB extends Dexie {
  categories!: Table<Category, string | number>;
  tags!: Table<Tag, string | number>;
  projects!: Table<Project, string | number>;

  constructor() {
    super("FlashcardDB");
    this.version(1).stores({
      categories: "id",
      tags: "id, categoryId",
      projects: "id, categoryId",
    });
  }
}

let db: FlashcardDB | null = null;

export function getDb() {
  if (typeof window === "undefined") return null;
  if (!db) db = new FlashcardDB();
  return db;
}
