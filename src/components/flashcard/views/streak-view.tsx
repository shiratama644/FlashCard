"use client";

type WeekDay = {
  date: string;
  dayName: string;
  isStudied: boolean;
  isToday: boolean;
};

type StreakViewProps = {
  weekDays: WeekDay[];
  displayStreak: number;
  streakMessage: string;
  onContinue: () => void;
};

export function StreakView({ weekDays, displayStreak, streakMessage, onContinue }: StreakViewProps) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* 炎アイコン */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-4">
          <div className="streak-glow" />
          <div className="streak-spark" />
          <i className="fa-solid fa-fire-flame-curved streak-flame-icon" />
        </div>

        {/* 日数 */}
        <div className="streak-number">{displayStreak}</div>
        <div className="streak-label">日連続記録</div>

        {/* カレンダー */}
        <div className="w-full mb-8">
          {/* 曜日ラベル */}
          <div className="grid grid-cols-7 w-full mb-3 px-1">
            {weekDays.map((day) => (
              <div
                key={`label_${day.date}`}
                className={`text-center text-sm font-bold ${day.isToday ? "text-[#ff7b00]" : "text-gray-500"}`}
              >
                {day.dayName}
              </div>
            ))}
          </div>

          {/* カプセルバー */}
          <div className="streak-calendar-bg">
            {/* 背景バーレイヤー */}
            <div className="absolute inset-1.5 grid grid-cols-7 gap-0">
              {weekDays.map((day, index) => {
                const isFirst = day.isStudied && (index === 0 || !weekDays[index - 1].isStudied);
                const isLast = day.isStudied && (index === 6 || !weekDays[index + 1]?.isStudied);
                return (
                  <div
                    key={`bar_${day.date}`}
                    className={[
                      "h-full",
                      day.isStudied ? "streak-bar-fill" : "opacity-0",
                      isFirst ? "rounded-l-full" : "",
                      isLast ? "rounded-r-full" : "",
                    ].join(" ")}
                    style={
                      day.isStudied
                        ? { backgroundSize: "700% 100%", backgroundPosition: `${index * (100 / 6)}% 0` }
                        : undefined
                    }
                  />
                );
              })}
            </div>
            {/* アイコンレイヤー */}
            <div className="relative z-10 grid grid-cols-7 h-10">
              {weekDays.map((day) => (
                <div key={`icon_${day.date}`} className="streak-day-icon-wrap">
                  {day.isStudied ? (
                    <i className="fa-solid fa-check streak-day-check" />
                  ) : (
                    <div className="streak-day-dot" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 動的メッセージ */}
        <div
          className="streak-message"
          dangerouslySetInnerHTML={{ __html: streakMessage }}
        />
      </div>

      {/* 続行ボタン */}
      <div className="w-full max-w-md mt-8 pb-4">
        <button
          type="button"
          onClick={onContinue}
          className="btn-streak-continue"
        >
          次へ
        </button>
      </div>
    </>
  );
}
