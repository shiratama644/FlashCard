"use client";

// カテゴリ編集モーダル（index.html 749-773）
import { useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";

// 編集中カテゴリの名前と選択中の色のシグネチャ。閉じている間は短絡する。
function editCategoryModalSignature(store: FlashcardStore): string {
  if (!store.showEditCategoryModal) return "inactive";
  const ec = store.editingCategory;
  return JSON.stringify([ec.name, ec.colorClass]);
}

export function EditCategoryModal() {
  const store = useStoreView(editCategoryModalSignature);
  const ec = store.editingCategory;

  return (
    <Transition
      show={store.showEditCategoryModal}
      className="modal-overlay"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget) store.update(() => (store.showEditCategoryModal = false));
      }}
    >
      <div className="modal-content">
        <h2 className="modal-title">カテゴリを編集</h2>
        <input type="text" value={ec.name} onChange={(e) => store.update(() => (store.editingCategory = { ...store.editingCategory, name: e.target.value }))} placeholder="カテゴリ名" className="input-field mb-4" />

        <label className="input-label">カラー</label>
        <div className="color-picker">
          {store.tagColors.map((color) => (
            <button
              key={color}
              onClick={() => store.update(() => (store.editingCategory = { ...store.editingCategory, colorClass: color }))}
              className={`color-btn ${ec.colorClass === color ? "selected" : ""}`}
              style={{ backgroundColor: store.getColorCode(color) }}
            ></button>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={() => store.update(() => (store.showEditCategoryModal = false))} className="btn-secondary">
            キャンセル
          </button>
          <button onClick={() => store.saveCategoryEdit()} className={`btn-primary ${!ec.name ? "disabled" : ""}`}>
            保存
          </button>
        </div>
      </div>
    </Transition>
  );
}
