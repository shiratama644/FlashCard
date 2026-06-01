"use client";

// 2. STUDY VIEW（index.html 188-339 の忠実移植）
import { useEffect } from "react";
import { useStore } from "@/store/StoreProvider";
import { Transition } from "../Transition";

function CardContainer() {
  const store = useStore();
  const card = store.currentCards[store.currentIndex];

  // @mousemove.window / @mouseup.window / @touchmove.window / @touchend.window 相当
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => store.onDrag(e);
    const onUp = () => store.endDrag();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="card-container"
      ref={(el) => {
        store.refs.cardElement = el;
      }}
      onMouseDown={(e) => store.startDrag(e.nativeEvent)}
      onTouchStart={(e) => store.startDrag(e.nativeEvent)}
      onClick={() => store.handleClick()}
    >
      <div
        className="card-overlay-bg"
        ref={(el) => {
          store.refs.overlayBg = el;
        }}
      >
        <div
          className="stamp stamp-like"
          ref={(el) => {
            store.refs.likeStamp = el;
          }}
        >
          LIKE
        </div>
        <div
          className="stamp stamp-nope"
          ref={(el) => {
            store.refs.nopeStamp = el;
          }}
        >
          NOPE
        </div>
      </div>

      <div className={`card-inner ${store.isFlipped ? "is-flipped" : ""}`}>
        {/* 表面 */}
        <div className="card-face card-front">
          <div className="card-icon-wrap">
            <i className="fa-regular fa-lightbulb text-xl text-yellow-300"></i>
          </div>

          {!store.isReverseMode && (
            <div className="w-full">
              <h2 className="card-word">{card?.front}</h2>
            </div>
          )}

          {store.isReverseMode && (
            <div className="card-reverse-content">
              <div className="card-details-list">
                {(card?.backDetails || []).map((detail, i) => (
                  <div key={"front_detail_" + i} className="card-detail-item">
                    {detail.tagId && store.tagMap[String(detail.tagId)] && (
                      <span className={`card-detail-tag ${store.tagMap[String(detail.tagId)].colorClass}`}>{store.tagMap[String(detail.tagId)].name}</span>
                    )}
                    <span className={`card-detail-val ${detail.tagId ? "with-tag" : "no-tag"}`}>{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-hint">
            <i className="fa-solid fa-hand-pointer"></i> Tap to flip
          </div>
        </div>

        {/* 裏面 */}
        <div className="card-face card-back">
          <div className="card-icon-wrap">
            <i className="fa-solid fa-language text-xl text-cyan-300"></i>
          </div>
          <div className="w-full flex-1 flex flex-col justify-center">
            {!store.isReverseMode && (
              <div className="w-full mb-6">
                <div className="card-details-list">
                  {(card?.backDetails || []).map((detail, i) => (
                    <div key={"back_detail_" + i} className="card-detail-item">
                      {detail.tagId && store.tagMap[String(detail.tagId)] && (
                        <span className={`card-detail-tag ${store.tagMap[String(detail.tagId)].colorClass}`}>{store.tagMap[String(detail.tagId)].name}</span>
                      )}
                      <span className={`card-detail-val ${detail.tagId ? "with-tag" : "no-tag"}`}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {store.isReverseMode && (
              <div className="flex flex-col items-center justify-center mb-6 my-auto">
                <h2 className="card-word">{card?.front}</h2>
              </div>
            )}

            {card?.example && (
              <div className="card-example">
                <p>{`"${card?.example || ""}"`}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudyView() {
  const store = useStore();
  const hasCards = store.currentCards.length > 0;

  return (
    <Transition
      show={store.currentView === "study"}
      className="view-container bg-blur-light"
      enter="view-enter-active"
      enterStart="view-enter-from-right"
      enterEnd="view-enter-to"
      leave="view-leave-active-fast"
      leaveStart="view-enter-to"
      leaveEnd="view-leave-to-right"
    >
      <header className="view-header study-header">
        <button onClick={() => store.goHome()} className="btn-icon btn-glass">
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <div className="study-header-title">
          <span className="truncate w-full">{store.activeProject?.title}</span>
          <button onClick={() => store.toggleReverseMode()} className="mode-toggle-btn" title="タップして切り替え">
            <i className={`fa-solid fa-right-left ${store.isReverseMode ? "text-cyan-300" : "text-yellow-300"}`}></i>
            <span>{store.isReverseMode ? "意味から学習中" : "単語から学習中"}</span>
          </button>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={() => store.shuffleCards()} className="btn-icon btn-glass" title="シャッフル">
            <i className="fa-solid fa-shuffle"></i>
          </button>
          <button onClick={() => (store.currentView = "cardList")} className="btn-icon btn-glass" title="カード一覧">
            <i className="fa-solid fa-list"></i>
          </button>
        </div>
      </header>

      {hasCards && (
        <div className="progress-wrap px-4 mb-2">
          <div className="progress-text">
            <div className="progress-badge">
              <span className="text-white">{store.currentIndex + 1}</span>
              <span className="progress-divider">/</span>
              <span className="progress-total">{store.currentCards.length}</span>
            </div>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${((store.currentIndex + 1) / store.currentCards.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      <main className="study-main">
        {!hasCards && (
          <div className="empty-state">
            <i className="fa-regular fa-folder-open empty-icon"></i>
            <h2 className="text-xl font-bold mb-2">No Cards Yet</h2>
            <p className="settings-desc mb-6">カード一覧から単語を追加してください</p>
            <button onClick={() => (store.currentView = "cardList")} className="btn-secondary w-full">
              カード一覧へ
            </button>
          </div>
        )}

        {hasCards && <CardContainer />}
      </main>

      {hasCards && (
        <footer className="study-footer">
          <button
            onClick={() => store.swipeOut(-1)}
            className="swipe-btn nope"
            ref={(el) => {
              store.refs.nopeIcon = el;
            }}
          >
            <div className="swipe-btn-circle">
              <i className="fa-solid fa-xmark"></i>
            </div>
            <span className="swipe-btn-text">まだ (←)</span>
          </button>
          <div className="swipe-indicator">
            <i className="fa-solid fa-arrows-left-right"></i>
            <span>SWIPE</span>
          </div>
          <button
            onClick={() => store.swipeOut(1)}
            className="swipe-btn like"
            ref={(el) => {
              store.refs.likeIcon = el;
            }}
          >
            <div className="swipe-btn-circle">
              <i className="fa-solid fa-check"></i>
            </div>
            <span className="swipe-btn-text">覚えた (→)</span>
          </button>
        </footer>
      )}
    </Transition>
  );
}
