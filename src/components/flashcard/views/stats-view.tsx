"use client";

import { useMemo } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";

export function StatsView() {
  const { activeProject } = useFlashcard();

  const projectStats = useMemo(() => {
    if (!activeProject) return { mastered: 0, learning: 0, new: 0, total: 0, masteredRate: 0, learningRate: 0, newRate: 0 };

    const total = activeProject.cards.length;
    const mastered = activeProject.cards.filter((c) => c.stats?.status === "mastered").length;
    const learning = activeProject.cards.filter((c) => c.stats?.status === "learning").length;
    const newCount = total - mastered - learning;

    return {
      mastered,
      learning,
      new: newCount,
      total,
      masteredRate: total > 0 ? (mastered / total) * 100 : 0,
      learningRate: total > 0 ? (learning / total) * 100 : 0,
      newRate: total > 0 ? (newCount / total) * 100 : 0,
    };
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="text-center mt-8" style={{ color: "rgba(255,255,255,0.5)" }}>
        プロジェクトが選択されていません
      </div>
    );
  }

  return (
    <div className="stats-grid w-full">
      <div className="stats-col-1">
        <div className="stats-summary-card">
          <h2 className="stats-title">
            <i className="fa-solid fa-chart-simple text-cyan-400" /> 学習進捗
          </h2>

          <div className="flex justify-between items-end mb-2">
            <div className="stats-main-val">
              <span>{projectStats.mastered}</span>
              <span className="stats-sub-val"> / {activeProject.cards.length}</span>
            </div>
            <div className="stats-badge">Mastered</div>
          </div>

          <div className="stats-bar-wrap">
            <div className="stats-bar bg-emerald-500" style={{ width: `${projectStats.masteredRate}%` }} />
            <div className="stats-bar bg-red-500" style={{ width: `${projectStats.learningRate}%` }} />
            <div className="stats-bar bg-slate-500" style={{ width: `${projectStats.newRate}%` }} />
          </div>

          <div className="stats-legend">
            <div className="stats-legend-item text-emerald-400">
              <div className="stats-legend-label"><span className="stats-dot bg-emerald-500" /> 覚えた</div>
              <span>{projectStats.mastered}</span>
            </div>
            <div className="stats-legend-item text-red-400">
              <div className="stats-legend-label"><span className="stats-dot bg-red-500" /> 学習中</div>
              <span>{projectStats.learning}</span>
            </div>
            <div className="stats-legend-item text-slate-400">
              <div className="stats-legend-label"><span className="stats-dot bg-slate-500" /> 未学習</div>
              <span>{projectStats.new}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-col-3">
        <h3 className="font-bold mb-3 px-1 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
          カード別データ
        </h3>
        <div className="stats-card-grid">
          {activeProject.cards.length === 0 && (
            <div className="text-center py-4 text-sm" style={{ color: "rgba(255,255,255,0.5)", gridColumn: "1 / -1" }}>
              カードがありません
            </div>
          )}
          {activeProject.cards.map((card, index) => {
            const status = card.stats?.status || "new";
            return (
              <div key={`${card.front}_${index}`} className="stats-card-item">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-bold text-lg truncate">{card.front}</div>
                  <div className="stats-card-counts">
                    <span className="count-badge count-like">
                      <i className="fa-solid fa-check mr-1" />
                      <span>{card.stats?.likes || 0}</span>
                    </span>
                    <span className="count-badge count-nope">
                      <i className="fa-solid fa-xmark mr-1" />
                      <span>{card.stats?.nopes || 0}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`status-badge ${
                      status === "mastered"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : status === "learning"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                    }`}
                  >
                    {status === "mastered" ? "覚えた" : status === "learning" ? "学習中" : "未学習"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
