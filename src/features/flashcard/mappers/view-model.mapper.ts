import type { Category, Project } from "@/types/flashcard";

export function createCategoryMap(categories: Category[]) {
  return Object.fromEntries(categories.map((category) => [category.id, category]));
}

export function projectToSummary(project: Project, categoryName: string) {
  return {
    id: project.id,
    title: project.title,
    description: project.description ?? "",
    categoryName,
    cardCount: project.cards.length,
  };
}
