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
    <div className="settings-container">
      <div className="glass-panel-sm p-5">
        <h3 className="font-bold text-lg mb-2 text-red-400">
          <i className="fa-solid fa-triangle-exclamation" /> Danger Zone
        </h3>
        <p className="settings-desc">
          すべてのデータを初期状態に戻します。
        </p>
        <button onClick={handleReset} className="btn-danger-outline">
          データを初期化する
        </button>
      </div>
    </div>
  );
}
