"use client";

import { useFlashcard } from "@/features/flashcard/context/flashcard-context";

export function SettingsView() {
  const { resetAllData, showConfirm } = useFlashcard();

  const handleReset = () => {
    showConfirm(
      "データの初期化",
      "すべてのデータを初期状態に戻します。この操作は取り消せません。",
      () => { resetAllData(); },
      "初期化する",
    );
  };

  return (
    <div className="w-full" style={{ maxWidth: "28rem" }}>
      <div className="glass-panel-sm p-5">
        <h3 className="font-bold text-lg mb-2 text-red-400">
          <i className="fa-solid fa-triangle-exclamation" /> Danger Zone
        </h3>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          すべてのデータを初期状態に戻します。
        </p>
        <button onClick={handleReset} className="btn-danger-outline">
          データを初期化する
        </button>
      </div>
    </div>
  );
}
