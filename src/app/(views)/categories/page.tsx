import { CategoryManager } from "@/components/flashcard/category-manager";

export default function CategoriesViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-extrabold">Categories & Tags</h1>
      <CategoryManager />
    </main>
  );
}
