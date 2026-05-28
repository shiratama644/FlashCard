"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreakData = {
  currentStreak: number;
  lastStudyDate: string | null;
  studyHistory: string[];
};

type WeekDay = {
  date: string;
  dayName: string;
  isStudied: boolean;
  isToday: boolean;
};

const STORAGE_KEY = "flashcard_streak_data";
const MAX_HISTORY = 365;

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function diffDays(a: Date, b: Date): number {
  const aCopy = new Date(a);
  const bCopy = new Date(b);
  aCopy.setHours(0, 0, 0, 0);
  bCopy.setHours(0, 0, 0, 0);
  return Math.floor((aCopy.getTime() - bCopy.getTime()) / (1000 * 60 * 60 * 24));
}

function generateWeekDays(studyHistory: string[]): WeekDay[] {
  const today = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const days: WeekDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    days.push({
      date: dateStr,
      dayName: dayNames[d.getDay()],
      isStudied: studyHistory.includes(dateStr),
      isToday: i === 0,
    });
  }
  return days;
}

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastStudyDate: null,
    studyHistory: [],
  });
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [displayStreak, setDisplayStreak] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    let data: StreakData = { currentStreak: 0, lastStudyDate: null, studyHistory: [] };
    if (saved) {
      try {
        data = JSON.parse(saved) as StreakData;
      } catch {
        /* ignore */
      }
    }

    if (data.lastStudyDate) {
      const diff = diffDays(new Date(), new Date(data.lastStudyDate));
      if (diff > 1) {
        data.currentStreak = 0;
      }
    }

    // Cap history
    if (data.studyHistory.length > MAX_HISTORY) {
      data.studyHistory = data.studyHistory.slice(-MAX_HISTORY);
    }

    setStreakData(data);
    setWeekDays(generateWeekDays(data.studyHistory));
  }, []);

  const markStudyComplete = useCallback(() => {
    setStreakData((prev) => {
      const todayStr = formatDate(new Date());
      if (prev.lastStudyDate === todayStr) return prev;

      let newStreak: number;
      if (prev.lastStudyDate) {
        const diff = diffDays(new Date(), new Date(prev.lastStudyDate));
        newStreak = diff === 1 ? prev.currentStreak + 1 : 1;
      } else {
        newStreak = 1;
      }

      const newHistory = prev.studyHistory.includes(todayStr)
        ? prev.studyHistory
        : [...prev.studyHistory.slice(-(MAX_HISTORY - 1)), todayStr];

      const next: StreakData = {
        currentStreak: newStreak,
        lastStudyDate: todayStr,
        studyHistory: newHistory,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setWeekDays(generateWeekDays(next.studyHistory));
      return next;
    });
  }, []);

  const animateStreak = useCallback(() => {
    const target = streakData.currentStreak;
    if (target === 0) {
      setDisplayStreak(0);
      return;
    }
    let current = 0;
    const stepTime = 16;
    const increment = Math.max(1, Math.ceil(target / (1000 / stepTime)));

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayStreak(target);
        clearInterval(timer);
      } else {
        setDisplayStreak(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [streakData.currentStreak]);

  const streakMessage = (() => {
    const streak = streakData.currentStreak;
    const today = new Date().getDay();
    const isWeekend = today === 0 || today === 6;
    const hl = (text: string) => `<span class="text-[#ff7b00]">${text}</span>`;

    if (streak === 0) return `今日から${hl("新しい記録")}を始めましょう！`;
    if (streak === 1) return `素晴らしいスタートです！\n明日も${hl("頑張りましょう！")}`;
    if (streak % 100 === 0) return `信じられません！ついに${hl(streak + "日達成")}！\n鉄の意志ですね！`;
    if (streak % 50 === 0) return `すごい！${hl(streak + "日連続")}達成！\n毎日の積み重ねの賜物です！`;
    if (streak % 10 === 0) return `おめでとう！${hl(streak + "日連続")}達成！\nこの調子で続けましょう！`;
    if (streak % 7 === 0) return `おめでとう！${hl("パーフェクトな連続記録")}を達成したね！\n来週も続けられるかな？`;
    if (isWeekend) return `週末も${hl("記録を伸ばそう！")}\n継続は力なり！`;

    const messages = [
      `素晴らしいペースです！\n${hl("その調子")}で明日も頑張りましょう！`,
      `いいペースですね！\n${hl("毎日の学習")}が力になります！`,
      `今日も学習できましたね！\n${hl("連続記録")}をどんどん伸ばそう！`,
      `止まらない勢いですね！\n${hl("明日も")}この場所で会いましょう！`,
    ];
    const seed = new Date().getDate();
    return messages[seed % messages.length];
  })();

  return {
    streakData,
    weekDays,
    displayStreak,
    markStudyComplete,
    animateStreak,
    streakMessage,
  };
}
