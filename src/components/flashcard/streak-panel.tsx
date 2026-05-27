type StreakPanelProps = {
  currentStreak: number;
};

export function StreakPanel({ currentStreak }: StreakPanelProps) {
  return (
    <section className="rounded-3xl border border-yellow-300/40 bg-yellow-500/10 p-6 text-center">
      <p className="text-sm text-yellow-200">連続学習日数</p>
      <p className="text-5xl font-extrabold text-yellow-300">{currentStreak}</p>
    </section>
  );
}
