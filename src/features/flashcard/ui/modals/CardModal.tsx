"use client";

// カード追加・編集モーダル（index.html 672-747）
import { useStore } from "@/features/flashcard/state/StoreProvider";
import type { Id } from "@/features/flashcard/data/types";
import { Transition } from "../Transition";
import { Collapse } from "../Collapse";
import { CustomSelect } from "../CustomSelect";

export function CardModal() {
  const store = useStore();
  const tagOptions = store.getTagsForCurrentProject().map((t) => ({ id: t.id, name: t.name, colorClass: t.colorClass }));

  return (
    <Transition
      show={store.showCardModal}
      className="modal-overlay"
      enter="modal-enter-active"
      enterStart="modal-enter-from"
      enterEnd="modal-enter-to"
      leave="modal-leave-active"
      leaveStart="modal-enter-to"
      leaveEnd="modal-leave-to"
      onClick={(e) => {
        if (e.target === e.currentTarget) store.update(() => (store.showCardModal = false));
      }}
    >
      <div className="modal-content modal-content-md">
        <h2 className="modal-title">{store.editingCardIndex !== null ? "カードを編集" : "カードを追加"}</h2>

        <div className="modal-body hide-scrollbar">
          <div className="mb-4">
            <label className="input-label">表面</label>
            <input
              type="text"
              ref={(el) => {
                store.refs.frontInput = el;
              }}
              value={store.newCardFront}
              onChange={(e) => store.update(() => (store.newCardFront = e.target.value))}
              placeholder="例: light, 未"
              className="input-field"
            />
          </div>

          <div className="detail-group">
            <div className="detail-header" onClick={() => store.update(() => (store.isBackDetailsExpanded = !store.isBackDetailsExpanded))}>
              <span className="detail-header-title">裏面 (意味・詳細)</span>
              <i className={`fa-solid fa-chevron-right select-icon ${store.isBackDetailsExpanded ? "rotated" : ""}`}></i>
            </div>

            <Collapse show={store.isBackDetailsExpanded}>
              <div className="detail-body">
                {store.newCardDetails.map((detail, index) => (
                  <div key={"detail_" + index} className="detail-item">
                    <div className="detail-item-header" onClick={() => store.update(() => (detail.expanded = !detail.expanded))}>
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid fa-chevron-right select-icon ${detail.expanded ? "rotated" : ""}`}></i>
                        <span className="detail-header-title">{detail.value ? detail.value : "新しい意味"}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          store.removeDetail(index);
                        }}
                        className="btn-text-icon btn-text-icon-sm danger"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    <Collapse show={!!detail.expanded}>
                      <div className="detail-item-body">
                        <CustomSelect
                          value={(detail.tagId ?? "") as Id | ""}
                          placeholder="タグなし (選択)"
                          selectedName={detail.tagId ? store.tagMap[String(detail.tagId)]?.name : undefined}
                          options={tagOptions}
                          onChange={(id) => store.update(() => (detail.tagId = id))}
                          small
                          withNone
                          emptyText="このカテゴリにタグがありません"
                          boxStyle={{ marginBottom: "0.5rem" }}
                        />
                        <input
                          type="text"
                          value={detail.value}
                          onChange={(e) => store.update(() => (detail.value = e.target.value))}
                          placeholder="意味・内容"
                          className="input-field input-field-sm input-field-dark detail-value-input"
                        />
                      </div>
                    </Collapse>
                  </div>
                ))}

                <button onClick={() => store.addDetail()} className="btn-add-detail">
                  <i className="fa-solid fa-plus"></i> 意味を追加
                </button>
              </div>
            </Collapse>
          </div>

          <div>
            <label className="input-label">例文 (任意)</label>
            <textarea
              value={store.newCardExample}
              onChange={(e) => store.update(() => (store.newCardExample = e.target.value))}
              placeholder="例: Turn on the light."
              rows={2}
              className="textarea-field"
            ></textarea>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={() => store.update(() => (store.showCardModal = false))} className="btn-secondary">
            キャンセル
          </button>
          <button onClick={() => store.saveCard()} className="btn-primary btn-primary-purple">
            {store.editingCardIndex !== null ? "保存" : "追加"}
          </button>
        </div>
      </div>
    </Transition>
  );
}
