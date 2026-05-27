import { ProjectCard } from "@/components/flashcard/project-card";

export default function HomeViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-extrabold">Projects</h1>
      <ProjectCard title="多義語・英単語" description="品詞で意味が変わる単語" categoryName="英語" cardCount={2} />
    </main>
  );
}
