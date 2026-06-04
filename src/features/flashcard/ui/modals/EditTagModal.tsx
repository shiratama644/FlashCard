"use client";

// タグ編集モーダル（index.html 775-799）
import { useStoreView } from "@/features/flashcard/state/StoreProvider";
import type { FlashcardStore } from "@/features/flashcard/state/FlashcardStore";
import { Transition } from "../Transition";

// 編集中タグの名前と選択中の色のシグネチャ。閉じている間は短絡する。
function editTagModalSignature(store: FlashcardStore): string {
  if (!store.showEditTagModal) return "inactive";
  const et = store.editingTag;
  return JSON.stringify([et.name, et.colorClass]);
}

export function EditTagModal() {
  const store = useStoreView(editTagModalSignature);
  const et = store.editingTag;

  return (
    <Transition
      show={store.showEditTagModal}
      className="modal-overlay"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget) store.update(() => (store.showEditTagModal = false));
      }}
    >
      <div className="modal-content">
        <h2 className="modal-title">タグを編集</h2>
        <input type="text" value={et.name} onChange={(e) => store.update(() => (store.editingTag = { ...store.editingTag, name: e.target.value }))} placeholder="タグ名" className="input-field mb-4" />

        <label className="input-label">カラー</label>
        <div className="color-picker">
          {store.tagColors.map((color) => (
            <button
              key={color}
              onClick={() => store.update(() => (store.editingTag = { ...store.editingTag, colorClass: color }))}
              className={`color-btn ${et.colorClass === color ? "selected" : ""}`}
              style={{ backgroundColor: store.getColorCode(color) }}
            ></button>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={() => store.update(() => (store.showEditTagModal = false))} className="btn-secondary">
            キャンセル
          </button>
          <button onClick={() => store.saveTagEdit()} className={`btn-primary ${!et.name ? "disabled" : ""}`}>
            保存
          </button>
        </div>
      </div>
    </Transition>
  );
}
