"use client";

import { useState } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { CardFormModal } from "@/components/flashcard/card-form-modal";
import type { Card } from "@/types/flashcard";

export function CardListView() {
  const {
    activeProject,
    activeProjectId,
    tagMap,
    saveCard,
    deleteCard,
    getTagsByCategory,
    showConfirm,
    addToast,
  } = useFlashcard();

  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  if (!activeProject || !activeProjectId) {
    return (
      <div className="w-full">
        <div className="empty-text">
          プロジェクトが選択されていません
        </div>
      </div>
    );
  }

  const cards = activeProject.cards;
  const projectTags = getTagsByCategory(activeProject.categoryId);

  const openCardModal = (index?: number) => {
    setEditingCardIndex(index ?? null);
    setShowCardModal(true);
  };

  const handleSave = (card: Card) => {
    saveCard(activeProjectId, card, editingCardIndex);
    setShowCardModal(false);
    addToast(editingCardIndex !== null ? "カードを更新しました" : "カードを追加しました", "success");
  };

  const handleDelete = (index: number) => {
    showConfirm("カードの削除", "このカードを削除しますか？", () => {
      deleteCard(activeProjectId, index);
      addToast("カードを削除しました", "success");
    });
  };

  return (
    <>
      <div className="w-full">
        {cards.length === 0 && (
          <div className="empty-text">
            カードがありません
          </div>
        )}

        <div className="list-grid">
          {cards.map((card, index) => (
            <div key={`${card.front}_${index}`} className="card-list-item">
              <div className="list-item-info">
                <div className="list-item-title">{card.front}</div>
                <div className="list-item-desc">
                  {card.backDetails.map((d) => d.value).join(", ")}
                </div>
              </div>
              <div className="list-item-actions">
                <button onClick={() => openCardModal(index)} className="btn-small-icon btn-edit">
                  <i className="fa-solid fa-pen" />
                </button>
                <button onClick={() => handleDelete(index)} className="btn-small-icon btn-delete">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => openCardModal()} className="fab-btn fab-purple" title="カードを追加">
        <i className="fa-solid fa-plus" />
      </button>

      {showCardModal && (
        <CardFormModal
          card={editingCardIndex !== null ? cards[editingCardIndex] : undefined}
          projectTags={projectTags}
          tagMap={tagMap}
          onSave={handleSave}
          onClose={() => setShowCardModal(false)}
        />
      )}
    </>
  );
}
