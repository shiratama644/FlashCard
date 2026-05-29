"use client";

import { useState } from "react";
import { useFlashcard } from "@/features/flashcard/context/flashcard-context";
import { ColorPickerModal } from "@/components/flashcard/color-picker-modal";
import { getColorCode } from "@/features/flashcard/constants/defaults";

export function CategoriesView() {
  const {
    categories,
    setCategories,
    getTagsByCategory,
    addCategory,
    deleteCategory,
    saveCategoryEdit,
    addTagToCategory,
    deleteTag,
    saveTagEdit,
    showConfirm,
    addToast,
  } = useFlashcard();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string | number; name: string; colorClass: string } | null>(null);
  const [editingTag, setEditingTag] = useState<{ id: string | number; name: string; colorClass: string } | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName);
    setNewCategoryName("");
    addToast("カテゴリを追加しました", "success");
  };

  const handleDeleteCategory = (id: string | number) => {
    showConfirm("カテゴリの削除", "このカテゴリと、関連するタグをすべて削除しますか？", () => {
      deleteCategory(id);
      addToast("カテゴリを削除しました", "success");
    });
  };

  const handleDeleteTag = (id: string | number) => {
    showConfirm("タグの削除", "このタグを削除しますか？", () => {
      deleteTag(id);
      addToast("タグを削除しました", "success");
    });
  };

  const toggleCategoryExpanded = (id: string | number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)),
    );
  };

  const updateCategoryNewTagName = (id: string | number, value: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, newTagName: value } : c)),
    );
  };

  const handleAddTag = (cat: typeof categories[0]) => {
    if (!cat.newTagName?.trim()) return;
    addTagToCategory(cat.id, cat.newTagName);
    updateCategoryNewTagName(cat.id, "");
    addToast("タグを追加しました", "success");
  };

  return (
    <>
      <div className="w-full">
        <div className="input-group" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="新しいカテゴリ名"
            className="input-field"
          />
          <button onClick={handleAddCategory} className="btn-primary shrink-0">追加</button>
        </div>

        <div className="category-grid">
          {categories.map((cat) => {
            const catTags = getTagsByCategory(cat.id);
            return (
              <div key={cat.id} className="category-card">
                <div
                  className="category-header"
                  onClick={() => toggleCategoryExpanded(cat.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="category-title-wrap">
                    <i
                      className={`fa-solid fa-chevron-right chevron-icon ${cat.expanded ? "rotated" : ""}`}
                    />
                    <span
                      className="color-dot"
                      style={{ backgroundColor: getColorCode(cat.colorClass) }}
                    />
                    <span className="font-bold">{cat.name}</span>
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCategory({ id: cat.id, name: cat.name, colorClass: cat.colorClass }); }}
                      className="btn-text-icon"
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="btn-text-icon danger"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>

                {cat.expanded && (
                  <div className="category-body">
                    <div className="tag-input-group" style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <input
                        type="text"
                        value={cat.newTagName || ""}
                        onChange={(e) => updateCategoryNewTagName(cat.id, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTag(cat)}
                        placeholder="新しいタグ名"
                        className="input-field input-field-sm"
                      />
                      <button
                        onClick={() => handleAddTag(cat)}
                        className="btn-secondary shrink-0"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                      >
                        追加
                      </button>
                    </div>
                    <div className="tag-list">
                      {catTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="tag-item"
                          onClick={() => setEditingTag({ id: tag.id, name: tag.name, colorClass: tag.colorClass })}
                        >
                          <span className={`tag-badge ${tag.colorClass}`}>{tag.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                            className="tag-delete-btn"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ))}
                      {catTags.length === 0 && (
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                          タグがありません
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingCategory && (
        <ColorPickerModal
          title="カテゴリを編集"
          name={editingCategory.name}
          colorClass={editingCategory.colorClass}
          onSave={(name, colorClass) => {
            saveCategoryEdit({ id: editingCategory.id, name, colorClass });
            setEditingCategory(null);
            addToast("カテゴリを更新しました", "success");
          }}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingTag && (
        <ColorPickerModal
          title="タグを編集"
          name={editingTag.name}
          colorClass={editingTag.colorClass}
          onSave={(name, colorClass) => {
            saveTagEdit({ id: editingTag.id, name, colorClass });
            setEditingTag(null);
            addToast("タグを更新しました", "success");
          }}
          onClose={() => setEditingTag(null)}
        />
      )}
    </>
  );
}
