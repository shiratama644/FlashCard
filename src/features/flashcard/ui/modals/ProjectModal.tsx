"use client";

// プロジェクト追加モーダル（index.html 640-670）
import { useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";
import { CustomSelect } from "../CustomSelect";

// 入力中の各フィールドとカテゴリ候補（id/名前/色）のシグネチャ。
// 閉じている間は短絡する。
function projectModalSignature(store: FlashcardStore): string {
  if (!store.showProjectModal) return "inactive";
  return JSON.stringify([
    store.newProjectCategoryId,
    store.newProjectTitle,
    store.newProjectDesc,
    store.categories.map((c) => [c.id, c.name, c.colorClass]),
  ]);
}

export function ProjectModal() {
  const store = useStoreView(projectModalSignature);
  const options = store.categories.map((c) => ({ id: c.id, name: c.name, colorClass: c.colorClass }));

  return (
    <Transition
      show={store.showProjectModal}
      className="modal-overlay"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget) store.update(() => (store.showProjectModal = false));
      }}
    >
      <div className="modal-content">
        <h2 className="modal-title">新規プロジェクト</h2>

        <CustomSelect
          value={store.newProjectCategoryId}
          placeholder="カテゴリを選択 (必須)"
          options={options}
          onChange={(id) => store.update(() => (store.newProjectCategoryId = id))}
        />

        <input
          type="text"
          value={store.newProjectTitle}
          onChange={(e) => store.update(() => (store.newProjectTitle = e.target.value))}
          placeholder="プロジェクト名 (例: 漢文・再読文字)"
          className="input-field mb-3"
        />
        <input
          type="text"
          value={store.newProjectDesc}
          onChange={(e) => store.update(() => (store.newProjectDesc = e.target.value))}
          placeholder="説明 (任意)"
          className="input-field mb-6"
        />

        <div className="modal-footer">
          <button onClick={() => store.update(() => (store.showProjectModal = false))} className="btn-secondary">
            キャンセル
          </button>
          <button onClick={() => store.addProject()} className={`btn-primary ${!store.newProjectCategoryId || !store.newProjectTitle ? "disabled" : ""}`}>
            作成
          </button>
        </div>
      </div>
    </Transition>
  );
}
