"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/animation/gsap.client";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { useStreak } from "@/features/flashcard/hooks/use-streak";
import { ViewTransition } from "@/components/flashcard/app/view-transition";
import { StreakView } from "@/components/flashcard/views/streak-view";
import { HomeView } from "@/components/flashcard/views/home-view";
import { StudyView } from "@/components/flashcard/views/study-view";
import { CardListView } from "@/components/flashcard/views/card-list-view";
import { StatsView } from "@/components/flashcard/views/stats-view";
import { CategoriesView } from "@/components/flashcard/views/categories-view";
import { SettingsView } from "@/components/flashcard/views/settings-view";
import { AiView } from "@/components/flashcard/views/ai-view";

type View = "streak" | "home" | "study" | "cardList" | "stats" | "categories" | "settings" | "ai";
type SubView = "cardList" | "stats" | "categories" | "settings" | "ai";

const SUB_VIEWS: SubView[] = ["cardList", "stats", "categories", "settings", "ai"];
const isSubView = (v: View): v is SubView => SUB_VIEWS.includes(v as SubView);

/**
 * State-driven SPA controller — faithful port of old-site's single Alpine
 * component. `currentView` drives every screen transition (no URL changes);
 * all views stay mounted (mirroring `x-show`) so their state survives
 * navigation, while ViewTransition animates the directional enter/leave.
 */
export function FlashcardApp() {
  const { activeProject, setActiveProjectId, forceSave } = useFlashcard();
  const { weekDays, displayStreak, streakMessage, animateStreak, markStudyComplete } = useStreak();

  const [currentView, setCurrentView] = useState<View>("streak");
  const [reverseMode, setReverseMode] = useState(false);
  const [sessionNonce, setSessionNonce] = useState(0);
  const [lastSubView, setLastSubView] = useState<SubView>("cardList");
  const goHomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  // GSAP global frame rate — matches old-site `gsap.ticker.fps(120)`.
  useEffect(() => {
    gsap.ticker.fps(120);
  }, []);

  // Dynamic transition direction (old-site $watch on currentView).
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (currentView === "cardList" || currentView === "stats") {
      root.style.setProperty("--tx", "2.5rem");
      root.style.setProperty("--ty", "0");
    } else {
      root.style.setProperty("--tx", "0");
      root.style.setProperty("--ty", "2.5rem");
    }
  }, [currentView]);

  useEffect(() => {
    if (isSubView(currentView)) setLastSubView(currentView);
  }, [currentView]);

  // Replay the streak count-up whenever the streak screen is shown.
  useEffect(() => {
    if (currentView === "streak") animateStreak();
  }, [currentView, animateStreak]);

  const goHome = useCallback(() => {
    forceSave();
    setCurrentView("home");
    if (goHomeTimer.current) clearTimeout(goHomeTimer.current);
    goHomeTimer.current = setTimeout(() => {
      if (currentViewRef.current === "home") setActiveProjectId(null);
    }, 300);
  }, [forceSave, setActiveProjectId]);

  const openProject = useCallback(
    (id: string | number, reverse = false) => {
      setActiveProjectId(id);
      setReverseMode(reverse);
      setSessionNonce((n) => n + 1);
      setCurrentView("study");
    },
    [setActiveProjectId],
  );

  const openStats = useCallback(
    (id: string | number) => {
      setActiveProjectId(id);
      setCurrentView("stats");
    },
    [setActiveProjectId],
  );

  const goBackFromSubView = useCallback(() => {
    if (currentView === "cardList") {
      setCurrentView("study");
    } else {
      goHome();
    }
  }, [currentView, goHome]);

  const subView: SubView = isSubView(currentView) ? currentView : lastSubView;

  const subViewTitle = (() => {
    switch (subView) {
      case "cardList":
        return `${activeProject?.title || ""} - Cards`;
      case "stats":
        return activeProject?.title || "Stats";
      case "categories":
        return "Categories & Tags";
      case "settings":
        return "Settings";
      case "ai":
        return "AI Assistant";
    }
  })();

  const subViewIcon = subView === "ai" ? "fa-wand-magic-sparkles" : "";
  const subViewIconStyle = subView === "ai" ? { color: "#c084fc" } : undefined;

  return (
    <>
      <ViewTransition
        show={currentView === "streak"}
        direction="fade"
        className="view-container streak-view"
      >
        <StreakView
          weekDays={weekDays}
          displayStreak={displayStreak}
          streakMessage={streakMessage}
          onContinue={() => setCurrentView("home")}
        />
      </ViewTransition>

      <ViewTransition show={currentView === "home"} direction="left" className="view-container">
        <HomeView
          onOpenProject={openProject}
          onOpenStats={openStats}
          onOpenAi={() => setCurrentView("ai")}
          onOpenCategories={() => setCurrentView("categories")}
          onOpenSettings={() => setCurrentView("settings")}
        />
      </ViewTransition>

      <ViewTransition show={currentView === "study"} direction="right" className="view-container bg-blur-light">
        <StudyView
          reverse={reverseMode}
          sessionNonce={sessionNonce}
          active={currentView === "study"}
          onBack={goHome}
          onOpenCardList={() => setCurrentView("cardList")}
          onStudyComplete={markStudyComplete}
        />
      </ViewTransition>

      <ViewTransition show={isSubView(currentView)} direction="dynamic" className="view-container bg-blur">
        <header className="view-header border-b">
          <button onClick={goBackFromSubView} className="btn-icon btn-glass shrink-0">
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div className="view-title flex-1 min-w-0 justify-center px-4 flex items-center gap-2">
            {subViewIcon && <i className={`fa-solid ${subViewIcon}`} style={subViewIconStyle} />}
            <h1 className="truncate text-center w-full text-lg font-bold">{subViewTitle}</h1>
          </div>
          <div className="shrink-0" style={{ width: "2.5rem" }} />
        </header>

        <main className={`view-main${subView === "ai" ? " flex flex-col items-center" : ""}`}>
          {subView === "cardList" && <CardListView />}
          {subView === "stats" && <StatsView />}
          {subView === "categories" && <CategoriesView />}
          {subView === "settings" && <SettingsView />}
          {subView === "ai" && <AiView />}
        </main>
      </ViewTransition>
    </>
  );
}
