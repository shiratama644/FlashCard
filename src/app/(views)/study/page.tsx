import { StudyCard } from "@/components/flashcard/study-card";

export default function StudyViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-extrabold">Study</h1>
      <StudyCard front="light" backDetails={["光・ライト", "軽い・明るい", "火をつける・照らす"]} />
    </main>
  );
}
