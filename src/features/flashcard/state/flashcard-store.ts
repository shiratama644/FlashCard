import type { Category, Project, Tag } from "@/types/flashcard";

export type FlashcardStore = {
  categories: Category[];
  tags: Tag[];
  projects: Project[];
  activeProjectId: string | number | null;
};

export const initialFlashcardStore: FlashcardStore = {
  categories: [],
  tags: [],
  projects: [],
  activeProjectId: null,
};
