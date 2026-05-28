import { Badge } from "@/components/ui/badge";

export default function StatsViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-extrabold">Stats</h1>
      <div className="flex gap-2">
        <Badge>Mastered 0</Badge>
        <Badge>Learning 0</Badge>
        <Badge>New 2</Badge>
      </div>
    </main>
  );
}
