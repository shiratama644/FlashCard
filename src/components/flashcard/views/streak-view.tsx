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
  studyHistoryCount: number;
  onContinue: () => void;
};

export function StreakView({ weekDays, displayStreak, streakMessage, studyHistoryCount, onContinue }: StreakViewProps) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center w-full" style={{ maxWidth: "28rem" }}>
        {/* Fire icon — Alpine era: fa-fire-flame-curved with gradient + glow */}
        <div className="relative flex items-center justify-center" style={{ width: "10rem", height: "10rem", marginBottom: "1rem" }}>
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "#ffc800", filter: "blur(48px)", opacity: 0.2, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <div className="absolute" style={{ top: "0.5rem", right: "2rem", width: "0.75rem", height: "0.75rem", backgroundColor: "#ffc800", borderRadius: "9999px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <i
            className="fa-solid fa-fire-flame-curved animate-flame"
            style={{
              fontSize: "8rem",
              background: "linear-gradient(to bottom, #ffc800, #ff7b00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.15))",
              transformOrigin: "bottom center",
            }}
          />
        </div>

        {/* Streak count */}
        <div
          style={{
            fontSize: "7rem",
            lineHeight: 1,
            fontWeight: 800,
            background: "linear-gradient(to bottom, #ffc800, #ff7b00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.05em",
          }}
        >
          {displayStreak}
        </div>
        <div className="text-2xl font-bold mt-2" style={{ color: "#ff7b00", marginBottom: "3rem" }}>
          日連続記録
        </div>

        {/* Capsule bar calendar — Alpine era design */}
        <div className="w-full" style={{ marginBottom: "2rem" }}>
          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", width: "100%", marginBottom: "0.75rem", paddingInline: "0.25rem" }}>
            {weekDays.map((day) => (
              <div
                key={`label_${day.date}`}
                className="text-center text-sm font-bold"
                style={{ color: day.isToday ? "#ff7b00" : "rgba(255,255,255,0.4)" }}
              >
                {day.dayName}
              </div>
            ))}
          </div>

          {/* Capsule bar */}
          <div className="relative w-full" style={{ backgroundColor: "#2a2d36", borderRadius: "9999px", padding: "0.375rem" }}>
            {/* Gradient background layer */}
            <div className="absolute" style={{ inset: "0.375rem", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
              {weekDays.map((day, index) => {
                const isFirst = day.isStudied && (index === 0 || !weekDays[index - 1].isStudied);
                const isLast = day.isStudied && (index === 6 || !weekDays[index + 1]?.isStudied);
                return (
                  <div
                    key={`bar_${day.date}`}
                    style={{
                      height: "100%",
                      opacity: day.isStudied ? 1 : 0,
                      background: day.isStudied ? "linear-gradient(to right, #ffc800, #ff7b00)" : "none",
                      backgroundSize: day.isStudied ? "700% 100%" : undefined,
                      backgroundPosition: day.isStudied ? `${index * (100 / 6)}% 0` : undefined,
                      borderTopLeftRadius: isFirst ? "9999px" : 0,
                      borderBottomLeftRadius: isFirst ? "9999px" : 0,
                      borderTopRightRadius: isLast ? "9999px" : 0,
                      borderBottomRightRadius: isLast ? "9999px" : 0,
                    }}
                  />
                );
              })}
            </div>
            {/* Icon layer */}
            <div className="relative" style={{ zIndex: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", height: "2.5rem" }}>
              {weekDays.map((day) => (
                <div key={`icon_${day.date}`} className="flex items-center justify-center h-full">
                  {day.isStudied ? (
                    <i className="fa-solid fa-check" style={{ color: "#13151a", fontSize: "1.25rem" }} />
                  ) : (
                    <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "9999px", backgroundColor: "#4b4f5a" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic message */}
        <div
          className="text-center text-lg font-bold whitespace-pre-wrap"
          style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: streakMessage }}
        />
      </div>

      {/* Duolingo-style button */}
      <div className="w-full" style={{ maxWidth: "28rem", marginTop: "2rem", paddingBottom: "1rem" }}>
        <button
          type="button"
          onClick={onContinue}
          className="w-full flex items-center justify-center text-xl font-bold uppercase"
          style={{
            padding: "1rem",
            borderRadius: "1rem",
            backgroundColor: "#1cb0f6",
            color: "white",
            letterSpacing: "0.1em",
            boxShadow: "0 4px 0 0 #1899d6",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseDown={(e) => {
            const el = e.currentTarget;
            el.style.boxShadow = "none";
            el.style.transform = "translateY(4px)";
          }}
          onMouseUp={(e) => {
            const el = e.currentTarget;
            el.style.boxShadow = "0 4px 0 0 #1899d6";
            el.style.transform = "translateY(0)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.boxShadow = "0 4px 0 0 #1899d6";
            el.style.transform = "translateY(0)";
          }}
        >
          次へ
        </button>
        <div className="text-center mt-3">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {studyHistoryCount > 0 ? `合計 ${studyHistoryCount} 日学習` : "今日が初日です！"}
          </span>
        </div>
      </div>
    </>
  );
}
