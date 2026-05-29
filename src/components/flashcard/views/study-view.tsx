"use client";

import { useCallback, useEffect } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { useStudySession } from "@/features/flashcard/hooks/use-study-session";
import type { Card, CardStatus } from "@/types/flashcard";

type StudyViewProps = {
  reverse: boolean;
  sessionNonce: number;
  active: boolean;
  onBack: () => void;
  onOpenCardList: () => void;
  onStudyComplete: () => void;
};

export function StudyView({ reverse, sessionNonce, active, onBack, onOpenCardList, onStudyComplete }: StudyViewProps) {
  const { activeProject, tagMap, setProjects, forceSave } = useFlashcard();

  // Faithful old-site logic: right swipe → mastered (immediately), left → learning.
  // The swiped card is identified by reference (matching old-site's in-place update),
  // falling back to the session index so shuffled order stays correct.
  const handleCardSwiped = useCallback(
    (projectId: string | number, cardIdx: number, direction: 1 | -1, card: Card) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const newCards = [...p.cards];
          let origIdx = p.cards.indexOf(card);
          if (origIdx === -1) origIdx = cardIdx;
          const existing = newCards[origIdx];
          if (!existing) return p;
          const stats = existing.stats ?? { likes: 0, nopes: 0, status: "new" as const };
          const likes = stats.likes + (direction === 1 ? 1 : 0);
          const nopes = stats.nopes + (direction === -1 ? 1 : 0);
          const status: CardStatus = direction === 1 ? "mastered" : "learning";
          newCards[origIdx] = { ...existing, stats: { likes, nopes, status } };
          return { ...p, cards: newCards };
        }),
      );
    },
    [setProjects],
  );

  const {
    currentCards,
    currentIndex,
    isFlipped,
    isCompleted,
    isReverseMode,
    sessionStats,
    donutPercentage,
    toggleReverseMode,
    shuffleCards,
    resetStudy,
    swipeOut,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClick,
    cardRef,
    overlayBgRef,
    likeStampRef,
    nopeStampRef,
    likeIconRef,
    nopeIconRef,
  } = useStudySession(activeProject, tagMap, handleCardSwiped, { reverse, sessionNonce, enabled: active });

  useEffect(() => {
    if (isCompleted) {
      onStudyComplete();
      forceSave();
    }
  }, [isCompleted, onStudyComplete, forceSave]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="empty-state">
          <i className="fa-regular fa-folder-open empty-icon" />
          <h2 className="text-xl font-bold mb-2">プロジェクトが選択されていません</h2>
          <button onClick={onBack} className="btn-secondary w-full">
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const currentCard = currentCards[currentIndex];

  return (
    <>
      <header className="view-header border-b" style={{ paddingBottom: "0.5rem", border: "none" }}>
        <button onClick={onBack} className="btn-icon btn-glass">
          <i className="fa-solid fa-chevron-left" />
        </button>

        <div className="study-header-title">
          <span className="truncate w-full">{activeProject.title}</span>
          <button onClick={toggleReverseMode} className="mode-toggle-btn" title="タップして切り替え">
            <i className={`fa-solid fa-right-left ${isReverseMode ? "text-cyan-300" : "text-yellow-300"}`} />
            <span>{isReverseMode ? "意味から学習中" : "単語から学習中"}</span>
          </button>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={shuffleCards} className="btn-icon btn-glass" title="シャッフル">
            <i className="fa-solid fa-shuffle" />
          </button>
          <button onClick={onOpenCardList} className="btn-icon btn-glass" title="カード一覧">
            <i className="fa-solid fa-list" />
          </button>
        </div>
      </header>

      {currentCards.length > 0 && !isCompleted && (
        <div className="progress-wrap px-4 mb-2">
          <div className="progress-text">
            <div className="progress-badge">
              <span className="text-white">{currentIndex + 1}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", margin: "0 0.25rem" }}>/</span>
              <span style={{ color: "rgba(255,255,255,0.8)" }}>{currentCards.length}</span>
            </div>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentIndex + 1) / currentCards.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <main className="study-main">
        {currentCards.length === 0 && (
          <div className="empty-state">
            <i className="fa-regular fa-folder-open empty-icon" />
            <h2 className="text-xl font-bold mb-2">No Cards Yet</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
              カード一覧から単語を追加してください
            </p>
            <button onClick={onOpenCardList} className="btn-secondary w-full">
              カード一覧へ
            </button>
          </div>
        )}

        {currentCards.length > 0 && !isCompleted && currentCard && (
          <div
            ref={cardRef}
            className="card-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            style={{ touchAction: "none" }}
          >
            <div ref={overlayBgRef} className="card-overlay-bg">
              <div ref={likeStampRef} className="stamp stamp-like">LIKE</div>
              <div ref={nopeStampRef} className="stamp stamp-nope">NOPE</div>
            </div>

            <div className={`card-inner ${isFlipped ? "is-flipped" : ""}`}>
              {/* Front face */}
              <div className="card-face card-front">
                <div className="card-icon-wrap">
                  <i className="fa-regular fa-lightbulb text-xl text-yellow-300" />
                </div>

                {!isReverseMode ? (
                  <div className="w-full">
                    <h2 className="card-word">{currentCard.front}</h2>
                  </div>
                ) : (
                  <div className="w-full flex-1 flex flex-col justify-center items-center mt-12 mb-8">
                    <div className="card-details-list">
                      {(currentCard.backDetails || []).map((detail, i) => (
                        <div key={`front_detail_${i}`} className="card-detail-item">
                          {detail.tagId && tagMap[detail.tagId] && (
                            <span className={`card-detail-tag ${tagMap[detail.tagId].colorClass}`}>
                              {tagMap[detail.tagId].name}
                            </span>
                          )}
                          <span className={`card-detail-val ${detail.tagId ? "with-tag" : "no-tag"}`}>
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card-hint">
                  <i className="fa-solid fa-hand-pointer" /> Tap to flip
                </div>
              </div>

              {/* Back face */}
              <div className="card-face card-back">
                <div className="card-icon-wrap">
                  <i className="fa-solid fa-language text-xl text-cyan-300" />
                </div>
                <div className="w-full flex-1 flex flex-col justify-center">
                  {!isReverseMode ? (
                    <div className="w-full mb-6">
                      <div className="card-details-list">
                        {(currentCard.backDetails || []).map((detail, i) => (
                          <div key={`back_detail_${i}`} className="card-detail-item">
                            {detail.tagId && tagMap[detail.tagId] && (
                              <span className={`card-detail-tag ${tagMap[detail.tagId].colorClass}`}>
                                {tagMap[detail.tagId].name}
                              </span>
                            )}
                            <span className={`card-detail-val ${detail.tagId ? "with-tag" : "no-tag"}`}>
                              {detail.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center mb-6 my-auto">
                      <h2 className="card-word">{currentCard.front}</h2>
                    </div>
                  )}

                  {currentCard.example && (
                    <div className="card-example">
                      <span className="text-yellow-200">&ldquo;</span>
                      {currentCard.example}
                      <span className="text-yellow-200">&rdquo;</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="complete-card">
            <div className="complete-bg" />
            <h2 className="complete-title">Session Complete!</h2>
            <p className="complete-desc">今日の学習が完了しました🎉</p>

            <div className="donut-container">
              <svg viewBox="0 0 36 36" className="donut-svg">
                <path
                  className="donut-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-fill"
                  strokeDasharray={`${donutPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-text-wrap">
                <span className="donut-val">{Math.round(donutPercentage)}%</span>
                <span className="donut-label">Accuracy</span>
              </div>
            </div>

            <div className="complete-stats">
              <div className="complete-stat-item">
                <div className="complete-stat-icon like"><i className="fa-solid fa-check" /></div>
                <div className="complete-stat-val like">{sessionStats.like}</div>
                <div className="complete-stat-label">覚えた</div>
              </div>
              <div className="complete-stat-item">
                <div className="complete-stat-icon nope"><i className="fa-solid fa-xmark" /></div>
                <div className="complete-stat-val nope">{sessionStats.nope}</div>
                <div className="complete-stat-label">まだ</div>
              </div>
            </div>

            <button onClick={resetStudy} className="btn-large">
              <i className="fa-solid fa-rotate-right" /> もう一度学習する
            </button>
            <button onClick={onBack} className="btn-large-glass">
              ホームに戻る
            </button>
          </div>
        )}
      </main>

      {currentCards.length > 0 && !isCompleted && (
        <footer className="study-footer">
          <button onClick={() => swipeOut(-1)} className="swipe-btn nope">
            <div className="swipe-btn-circle">
              <i ref={nopeIconRef} className="fa-solid fa-xmark" style={{ color: "rgba(255,255,255,0.6)", transition: "color 0.15s, transform 0.15s" }} />
            </div>
            <span className="swipe-btn-text">まだ (←)</span>
          </button>
          <div className="swipe-indicator">
            <i className="fa-solid fa-arrows-left-right" />
            <span>SWIPE</span>
          </div>
          <button onClick={() => swipeOut(1)} className="swipe-btn like">
            <div className="swipe-btn-circle">
              <i ref={likeIconRef} className="fa-solid fa-check" style={{ color: "rgba(255,255,255,0.6)", transition: "color 0.15s, transform 0.15s" }} />
            </div>
            <span className="swipe-btn-text">覚えた (→)</span>
          </button>
        </footer>
      )}
    </>
  );
}
