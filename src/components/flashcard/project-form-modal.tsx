"use client";

import { useState } from "react";
import type { Category } from "@/types/flashcard";
import { getColorCode } from "@/features/flashcard/constants/defaults";

type ProjectFormModalProps = {
  mode: "new" | "edit";
  categories: Category[];
  initialTitle?: string;
  initialDescription?: string;
  initialCategoryId?: string | number;
  onSave: (title: string, description: string, categoryId: string | number) => void;
  onDelete?: () => void;
  onClose: () => void;
};

export function ProjectFormModal({
  mode,
  categories,
  initialTitle = "",
  initialDescription = "",
  initialCategoryId = "",
  onSave,
  onDelete,
  onClose,
}: ProjectFormModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [categoryId, setCategoryId] = useState<string | number>(initialCategoryId);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedCat = categories.find((c) => c.id === categoryId);
  const canSubmit = title.trim() && categoryId;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        {mode === "edit" ? (
          <div className="flex justify-between items-center mb-4">
            <h2 className="modal-title mb-0">プロジェクトを編集</h2>
            {onDelete && (
              <button onClick={onDelete} className="btn-text-icon danger" title="プロジェクトを削除">
                <i className="fa-solid fa-trash" />
              </button>
            )}
          </div>
        ) : (
          <h2 className="modal-title">新規プロジェクト</h2>
        )}

        <div className="select-box">
          <div className="select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span className={!categoryId ? "select-placeholder" : ""}>
              {selectedCat ? selectedCat.name : "カテゴリを選択 (必須)"}
            </span>
            <i
              className={`fa-solid fa-chevron-down select-icon ${dropdownOpen ? "rotated" : ""}`}
            />
          </div>
          {dropdownOpen && (
            <div className="select-dropdown">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="select-option"
                  onClick={() => { setCategoryId(cat.id); setDropdownOpen(false); }}
                >
                  <span
                    className="color-dot"
                    style={{ backgroundColor: getColorCode(cat.colorClass) }}
                  />
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="プロジェクト名 (例: 漢文・再読文字)"
          className="input-field mb-3"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="説明 (任意)"
          className="input-field mb-6"
        />

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button
            onClick={() => canSubmit && onSave(title, description, categoryId)}
            className={`btn-primary ${!canSubmit ? "disabled" : ""}`}
          >
            {mode === "edit" ? "保存" : "作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
