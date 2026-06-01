"use client";

// カテゴリ編集モーダル（index.html 749-773）
import { useStore } from "@/store/StoreProvider";
import { Transition } from "../Transition";

export function EditCategoryModal() {
  const store = useStore();
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
        <input type="text" value={ec.name} onChange={(e) => store.update(() => (ec.name = e.target.value))} placeholder="カテゴリ名" className="input-field mb-4" />

        <label className="input-label">カラー</label>
        <div className="color-picker">
          {store.tagColors.map((color) => (
            <button
              key={color}
              onClick={() => store.update(() => (ec.colorClass = color))}
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
