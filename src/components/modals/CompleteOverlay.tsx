"use client";

// 完了画面（index.html 597-638）
import { useStore } from "@/store/StoreProvider";
import { Transition } from "../Transition";

export function CompleteOverlay() {
  const store = useStore();

  return (
    <Transition
      show={store.isCompleted}
      className="complete-overlay"
      enter="complete-enter-active"
      enterStart="complete-enter-from"
      enterEnd="complete-enter-to"
      leave="complete-leave-active"
      leaveStart="complete-enter-to"
      leaveEnd="complete-leave-to"
    >
      <div className="complete-card">
        <div className="complete-bg"></div>

        <h2 className="complete-title">Session Complete!</h2>
        <p className="complete-desc">今日の学習が完了しました🎉</p>

        <div className="donut-container">
          <svg viewBox="0 0 36 36" className="donut-svg">
            <path className="donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
            <path
              className="donut-fill"
              strokeDasharray={`${store.donutPercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="donut-text-wrap">
            <span className="donut-val">{Math.round(store.donutPercentage) + "%"}</span>
            <span className="donut-label">Accuracy</span>
          </div>
        </div>

        <div className="complete-stats">
          <div className="complete-stat-item">
            <div className="complete-stat-icon like">
              <i className="fa-solid fa-check"></i>
            </div>
            <div className="complete-stat-val like">{store.sessionStats.like}</div>
            <div className="complete-stat-label">覚えた</div>
          </div>
          <div className="complete-stat-item">
            <div className="complete-stat-icon nope">
              <i className="fa-solid fa-xmark"></i>
            </div>
            <div className="complete-stat-val nope">{store.sessionStats.nope}</div>
            <div className="complete-stat-label">まだ</div>
          </div>
        </div>

        <button onClick={() => store.resetStudy()} className="btn-large">
          <i className="fa-solid fa-rotate-right"></i> もう一度学習する
        </button>
        <button onClick={() => store.goHome()} className="btn-large-glass">
          ホームに戻る
        </button>
      </div>
    </Transition>
  );
}
