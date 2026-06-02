"use client";

// アプリのルート（index.html body の app-wrapper 相当）。
// 初期描画はストア初期値（未ロード＝streak ビュー / データ空 / 連続記録 0）で
// 決定的なため、SSR/SSG でも安全に描画できる（旧来の mounted ゲートは撤去）。
// データ・ブラウザ API 依存の副作用は各コンポーネントの useEffect 側で実行され、
// ロード完了までは #global-loader（全画面・最前面）が中身を覆う。
import { useEffect } from "react";
import { useStoreInstance } from "@/features/flashcard/state/StoreProvider";
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
  // AppContent 自身はレンダリングでストア値を読まない（子が各自で購読する）ため、
  // ここでは購読しない。これにより commit のたびにツリー全体が再描画されるのを防ぐ。
  const store = useStoreInstance();

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
  return (
    <>
      <GlobalLoader />
      <AppContent />
    </>
  );
}
