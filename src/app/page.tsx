"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useStreak } from "@/features/flashcard/hooks/use-streak";

export default function StreakPage() {
  const { streakData, weekDays, displayStreak, animateStreak, streakMessage } = useStreak();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      animateStreak();
    }
  }, [animateStreak]);

  return (
    <div className="view-container flex flex-col items-center justify-between p-6 z-50" style={{ position: "relative", backgroundColor: "#13151a" }}>
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        <div className="text-8xl animate-flame" style={{ filter: "drop-shadow(0 0 40px rgba(255, 123, 0, 0.6))" }}>
          🔥
        </div>

        <div className="text-center">
          <div className="text-6xl font-extrabold text-[#ff7b00] mb-1" style={{ textShadow: "0 0 40px rgba(255,123,0,0.4)" }}>
            {displayStreak}
          </div>
          <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
            Day Streak
          </div>
        </div>

        <div
          className="text-base font-bold text-center whitespace-pre-wrap"
          style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: streakMessage }}
        />

        <div className="flex gap-2">
          {weekDays.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-xs font-bold"
                style={{ color: day.isToday ? "#ff7b00" : "rgba(255,255,255,0.4)" }}
              >
                {day.dayName}
              </span>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: day.isStudied
                    ? "#ff7b00"
                    : day.isToday
                      ? "rgba(255,123,0,0.15)"
                      : "rgba(255,255,255,0.05)",
                  border: day.isToday ? "2px solid rgba(255,123,0,0.4)" : "none",
                }}
              >
                {day.isStudied ? (
                  <i className="fa-solid fa-check text-[#13151a] text-xl" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-[#4b4f5a]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full" style={{ maxWidth: "20rem" }}>
        <Link
          href="/home"
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg no-underline"
          style={{ padding: "1rem", textDecoration: "none" }}
        >
          <i className="fa-solid fa-play" />
          続ける
        </Link>
        <div className="text-center mt-3">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {streakData.studyHistory.length > 0
              ? `合計 ${streakData.studyHistory.length} 日学習`
              : "今日が初日です！"}
          </span>
        </div>
      </div>
    </div>
  );
}
