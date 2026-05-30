"use client";

import { useEffect, useRef, useState } from "react";
import type { Card, CardDetail, Tag } from "@/types/flashcard";
import { getColorCode } from "@/features/flashcard/constants/defaults";

type CardFormModalProps = {
  card?: Card;
  projectTags: Tag[];
  tagMap: Record<string | number, Tag>;
  onSave: (card: Card) => void;
  onClose: () => void;
};

export function CardFormModal({ card, projectTags, tagMap, onSave, onClose }: CardFormModalProps) {
  const [front, setFront] = useState(card?.front || "");
  const [details, setDetails] = useState<CardDetail[]>(() => {
    if (card?.backDetails && card.backDetails.length > 0) {
      return card.backDetails.map((d) => ({ tagId: d.tagId || "", value: d.value, expanded: true }));
    }
    return [{ tagId: "", value: "", expanded: true }];
  });
  const [example, setExample] = useState(card?.example || "");
  const [isBackDetailsExpanded, setIsBackDetailsExpanded] = useState(true);

  const frontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    frontInputRef.current?.focus();
  }, []);

  const addDetail = () => {
    setDetails((prev) => [...prev, { tagId: "", value: "", expanded: true }]);
  };

  const removeDetail = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof CardDetail, value: string | boolean) => {
    setDetails((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const handleSave = () => {
    if (!front.trim()) return;
    const cleanDetails = details
      .filter((d) => d.value.trim())
      .map((d) => ({ tagId: d.tagId || "", value: d.value.trim() }));

    if (cleanDetails.length === 0) {
      cleanDetails.push({ tagId: "", value: "" });
    }

    onSave({
      front: front.trim(),
      backDetails: cleanDetails,
      example: example.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content modal-content-md">
        <h2 className="modal-title">{card ? "カードを編集" : "カードを追加"}</h2>

        <div className="modal-body hide-scrollbar">
          <div className="mb-4">
            <label className="input-label">
              表面
            </label>
            <input
              ref={frontInputRef}
              type="text"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="例: light, 未"
              className="input-field"
            />
          </div>

          <div className="detail-group">
            <div
              className="detail-header"
              onClick={() => setIsBackDetailsExpanded(!isBackDetailsExpanded)}
            >
              <span className="detail-header-title">
                裏面 (意味・詳細)
              </span>
              <i
                className={`fa-solid fa-chevron-right select-icon ${isBackDetailsExpanded ? "rotated" : ""}`}
              />
            </div>

            {isBackDetailsExpanded && (
              <div className="detail-body">
                {details.map((detail, index) => (
                  <div key={`detail_${index}`} className="detail-item">
                    <div
                      className="detail-item-header"
                      onClick={() => updateDetail(index, "expanded", !detail.expanded)}
                    >
                      <div className="flex items-center gap-2">
                        <i
                          className={`fa-solid fa-chevron-right select-icon ${detail.expanded ? "rotated" : ""}`}
                        />
                        <span className="detail-header-title">
                          {detail.value || "新しい意味"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeDetail(index); }}
                        className="btn-text-icon btn-text-icon-sm danger"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>

                    {detail.expanded && (
                      <div className="detail-item-body">
                        <TagSelector
                          tags={projectTags}
                          tagMap={tagMap}
                          selectedTagId={detail.tagId}
                          onSelect={(tagId) => updateDetail(index, "tagId", tagId)}
                        />
                        <input
                          type="text"
                          value={detail.value}
                          onChange={(e) => updateDetail(index, "value", e.target.value)}
                          placeholder="意味・内容"
                          className="input-field input-field-sm input-field-dark detail-value-input"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <button onClick={addDetail} className="btn-add-detail">
                  <i className="fa-solid fa-plus" /> 意味を追加
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="input-label">
              例文 (任意)
            </label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="例: Turn on the light."
              rows={2}
              className="textarea-field"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button onClick={handleSave} className="btn-primary btn-primary-purple">
            {card ? "保存" : "追加"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TagSelector({
  tags,
  tagMap,
  selectedTagId,
  onSelect,
}: {
  tags: Tag[];
  tagMap: Record<string | number, Tag>;
  selectedTagId?: string | number | "" | null;
  onSelect: (tagId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedTag = selectedTagId ? tagMap[selectedTagId] : null;

  return (
    <div className="select-box">
      <div
        className="select-trigger select-trigger-sm input-field-dark"
        onClick={() => setOpen(!open)}
      >
        <span className={!selectedTagId ? "select-placeholder" : ""}>
          {selectedTag ? selectedTag.name : "タグなし (選択)"}
        </span>
        <i
          className={`fa-solid fa-chevron-down select-icon ${open ? "rotated" : ""}`}
        />
      </div>
      {open && (
        <div className="select-dropdown">
          <div
            className="select-option select-option-sm"
            onClick={() => { onSelect(""); setOpen(false); }}
          >
            タグなし
          </div>
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="select-option select-option-sm"
              onClick={() => { onSelect(String(tag.id)); setOpen(false); }}
            >
              <span className="color-dot" style={{ backgroundColor: getColorCode(tag.colorClass) }} />
              <span>{tag.name}</span>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="select-empty-text">
              このカテゴリにタグがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
