"use client";

// 0. STREAK VIEW（index.html 48-113 の忠実移植）
import { useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";
import { buildStreakMessage } from "./streakMessage";

// STREAK が表示する値（アニメ中のカウント displayStreak / 連続日数 /
// 週カレンダーの曜日名・本日・学習済みフラグ）のシグネチャ。
// 非表示中は短絡し、commit ごとの再計算を避ける。
function streakSignature(store: FlashcardStore): string {
  if (store.currentView !== "streak") return "inactive";
  return JSON.stringify([
    store.displayStreak,
    store.streakData.currentStreak,
    store.weekDays.map((d) => [d.dayName, d.isToday, d.isStudied]),
  ]);
}

export function StreakView() {
  const store = useStoreView(streakSignature);
  const { weekDays } = store;

  return (
    <Transition
      show={store.currentView === "streak"}
      className="view-container streak-view"
      enter="view-enter-active"
      enterStart="opacity-0 scale-95"
      enterEnd="opacity-100 scale-100"
      leave="view-leave-active-fast"
      leaveStart="opacity-100"
      leaveEnd="opacity-0 scale-105"
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* 炎アイコン */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-4">
          <div className="streak-glow"></div>
          <div className="streak-spark"></div>
          <i className="fa-solid fa-fire-flame-curved streak-flame-icon"></i>
        </div>

        {/* 日数 */}
        <div className="streak-number">{store.displayStreak}</div>
        <div className="streak-label">日連続記録</div>

        {/* カレンダー */}
        <div className="w-full mb-8">
          {/* 曜日ラベル */}
          <div className="grid grid-cols-7 w-full mb-3 px-1">
            {weekDays.map((day, i) => (
              <div key={i} className={`text-center text-sm font-bold ${day.isToday ? "text-[#ff7b00]" : "text-gray-500"}`}>
                {day.dayName}
              </div>
            ))}
          </div>

          {/* カプセルバー */}
          <div className="streak-calendar-bg">
            {/* 背景バーレイヤー */}
            <div className="absolute inset-1.5 grid grid-cols-7 gap-0">
              {weekDays.map((day, index) => {
                const cls = [
                  "h-full",
                  day.isStudied ? "streak-bar-fill" : "",
                  day.isStudied && (index === 0 || !weekDays[index - 1].isStudied) ? "rounded-l-full" : "",
                  day.isStudied && (index === 6 || !weekDays[index + 1].isStudied) ? "rounded-r-full" : "",
                  !day.isStudied ? "opacity-0" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const style = day.isStudied ? { backgroundSize: "700% 100%", backgroundPosition: `${index * (100 / 6)}% 0` } : undefined;
                return <div key={index} className={cls} style={style}></div>;
              })}
            </div>
            {/* アイコンレイヤー */}
            <div className="relative z-10 grid grid-cols-7 h-10">
              {weekDays.map((day, i) => (
                <div key={i} className="streak-day-icon-wrap">
                  {day.isStudied ? <i className="fa-solid fa-check streak-day-check"></i> : <div className="streak-day-dot"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 動的メッセージ */}
        <div className="streak-message">{buildStreakMessage(store.streakData.currentStreak)}</div>
      </div>

      {/* 続行ボタン */}
      <div className="w-full max-w-md mt-8 pb-4">
        <button onClick={() => store.continueFromStreak()} className="btn-streak-continue">
          次へ
        </button>
      </div>
    </Transition>
  );
}
