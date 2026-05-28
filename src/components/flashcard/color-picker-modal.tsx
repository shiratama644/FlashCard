"use client";

import { useState } from "react";
import { TAG_COLORS, getColorCode } from "@/features/flashcard/constants/defaults";

type ColorPickerModalProps = {
  title: string;
  name: string;
  colorClass: string;
  onSave: (name: string, colorClass: string) => void;
  onClose: () => void;
};

export function ColorPickerModal({ title, name: initialName, colorClass: initialColor, onSave, onClose }: ColorPickerModalProps) {
  const [name, setName] = useState(initialName);
  const [colorClass, setColorClass] = useState(initialColor);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="名前"
          className="input-field mb-4"
        />

        <label className="text-xs font-bold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>
          カラー
        </label>
        <div className="color-picker">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setColorClass(color)}
              className={`color-btn ${colorClass === color ? "selected" : ""}`}
              style={{ backgroundColor: getColorCode(color) }}
            />
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button
            onClick={() => name.trim() && onSave(name, colorClass)}
            className={`btn-primary ${!name.trim() ? "disabled" : ""}`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
