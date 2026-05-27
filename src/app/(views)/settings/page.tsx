import { Button } from "@/components/ui/button";

export default function SettingsViewPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <Button variant="danger">データ初期化</Button>
    </main>
  );
}
