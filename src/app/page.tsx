import Link from "next/link";

const views = ["home", "study", "stats", "categories", "settings", "ai"] as const;

export default function RootPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-extrabold">Flashcard (Next.js Migration)</h1>
      <p className="text-white/80">Vite + Alpine.js から App Router へ移行した土台です。</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {views.map((view) => (
          <Link key={view} href={`/${view}`} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-semibold hover:bg-white/20">
            {view}
          </Link>
        ))}
      </div>
    </main>
  );
}
