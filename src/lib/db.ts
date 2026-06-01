// old-site/src/js/db.js の忠実移植（Dexie / IndexedDB）
import Dexie, { type Table } from "dexie";
import type { Category, Project, Tag } from "./types";

class FlashcardDB extends Dexie {
  categories!: Table<Category, string | number>;
  tags!: Table<Tag, string | number>;
  projects!: Table<Project, string | number>;

  constructor() {
    super("FlashcardDB");
    this.version(1).stores({
      categories: "id",
      tags: "id",
      projects: "id",
    });
  }
}

export const db = new FlashcardDB();
