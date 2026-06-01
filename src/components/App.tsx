"use client";

// アプリのルート（index.html body の app-wrapper 相当）。
// SSR と localStorage/Date 由来のハイドレーション不整合を避けるため、
// 実体はマウント後にのみ描画する（ローダーは常時描画）。
import { useEffect, useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { GlobalLoader } from "./GlobalLoader";
import { ToastContainer } from "./Toast";
import { StreakView } from "./views/StreakView";
import { HomeView } from "./views/HomeView";
import { StudyView } from "./views/StudyView";
import { SubView } from "./views/SubView";
import { DialogModal } from "./modals/DialogModal";
import { CompleteOverlay } from "./modals/CompleteOverlay";
import { ProjectModal } from "./modals/ProjectModal";
import { CardModal } from "./modals/CardModal";
import { EditCategoryModal } from "./modals/EditCategoryModal";
import { EditTagModal } from "./modals/EditTagModal";
import { EditProjectModal } from "./modals/EditProjectModal";

function AppContent() {
  const store = useStore();

  // init.js の keydown / beforeunload リスナー相当
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (store.currentView !== "study" || store.currentCards.length === 0 || store.isAnimating || store.isCompleted) return;
      if (e.key === "ArrowRight") store.swipeOut(1);
      else if (e.key === "ArrowLeft") store.swipeOut(-1);
      else if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        store.flipCard();
      }
    };
    const onBeforeUnload = () => {
      void store.forceSave();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-wrapper">
      <ToastContainer />

      <div className="app-container">
        <StreakView />
        <HomeView />
        <StudyView />
        <SubView />
      </div>

      <DialogModal />
      <CompleteOverlay />
      <ProjectModal />
      <CardModal />
      <EditCategoryModal />
      <EditTagModal />
      <EditProjectModal />
    </div>
  );
}

export function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <GlobalLoader />
      {mounted && <AppContent />}
    </>
  );
}
