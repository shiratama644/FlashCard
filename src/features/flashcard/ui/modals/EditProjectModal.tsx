"use client";

// プロジェクト編集モーダル（index.html 801-834）
import { useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";
import { CustomSelect } from "../CustomSelect";

// 編集中プロジェクトの各値とカテゴリ候補のシグネチャ。閉じている間は短絡する。
function editProjectModalSignature(store: FlashcardStore): string {
  if (!store.showEditProjectModal) return "inactive";
  const ep = store.editingProject;
  return JSON.stringify([
    ep.id,
    ep.categoryId,
    ep.title,
    ep.description,
    store.categories.map((c) => [c.id, c.name, c.colorClass]),
  ]);
}

export function EditProjectModal() {
  const store = useStoreView(editProjectModalSignature);
  const ep = store.editingProject;
  const options = store.categories.map((c) => ({ id: c.id, name: c.name, colorClass: c.colorClass }));

  return (
    <Transition
      show={store.showEditProjectModal}
      className="modal-overlay"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget) store.update(() => (store.showEditProjectModal = false));
      }}
    >
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="modal-title mb-0">プロジェクトを編集</h2>
          <button onClick={() => ep.id !== null && store.deleteProject(ep.id)} className="btn-text-icon danger" title="プロジェクトを削除">
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>

        <CustomSelect
          value={ep.categoryId}
          placeholder="カテゴリを選択 (必須)"
          options={options}
          onChange={(id) => store.update(() => (ep.categoryId = id))}
        />

        <input type="text" value={ep.title} onChange={(e) => store.update(() => (ep.title = e.target.value))} placeholder="プロジェクト名" className="input-field mb-3" />
        <input type="text" value={ep.description} onChange={(e) => store.update(() => (ep.description = e.target.value))} placeholder="説明 (任意)" className="input-field mb-6" />

        <div className="modal-footer">
          <button onClick={() => store.update(() => (store.showEditProjectModal = false))} className="btn-secondary">
            キャンセル
          </button>
          <button onClick={() => store.saveProjectEdit()} className={`btn-primary ${!ep.categoryId || !ep.title ? "disabled" : ""}`}>
            保存
          </button>
        </div>
      </div>
    </Transition>
  );
}
