import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AIViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-extrabold">AI Assistant</h1>
      <div className="flex gap-2">
        <Input placeholder="テーマを入力..." />
        <Button>生成</Button>
      </div>
    </main>
  );
}
