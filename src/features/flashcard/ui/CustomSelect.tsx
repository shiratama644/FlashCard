"use client";

// old-site の <div x-data="{open:false}" class="select-box"> ... </div> を再現する
// カスタムセレクト。@click.away で閉じる挙動も含む。
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Id } from "@/features/flashcard/data/types";
import { DefaultTransition } from "./DefaultTransition";

export interface SelectOption {
  id: Id;
  name: string;
  colorClass?: string;
}

interface CustomSelectProps {
  value: Id | "";
  placeholder: string;
  selectedName?: string; // 選択中の表示名（未指定なら options から解決）
  options: SelectOption[];
  onChange: (id: Id | "") => void;
  small?: boolean;
  withNone?: boolean; // 「タグなし」選択肢を先頭に追加
  noneLabel?: string;
  emptyText?: string; // options が空のときの表示
  boxStyle?: CSSProperties;
}

export function CustomSelect({ value, placeholder, selectedName, options, onChange, small, withNone, noneLabel = "タグなし", emptyText, boxStyle }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onAway = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onAway);
    return () => document.removeEventListener("mousedown", onAway);
  }, [open]);

  const display = value ? selectedName ?? options.find((o) => o.id === value)?.name ?? "" : placeholder;

  return (
    <div ref={boxRef} className="select-box" style={boxStyle}>
      <div onClick={() => setOpen((v) => !v)} className={small ? "select-trigger select-trigger-sm" : "select-trigger"}>
        <span className={!value ? "select-placeholder" : ""}>{display}</span>
        <i className={`fa-solid fa-chevron-down select-icon ${open ? "rotated" : ""}`}></i>
      </div>
      <DefaultTransition show={open} className="select-dropdown">
        {withNone && (
          <div
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={small ? "select-option select-option-sm" : "select-option"}
          >
            {noneLabel}
          </div>
        )}
        {options.map((opt) => (
          <div
            key={String(opt.id)}
            onClick={() => {
              onChange(opt.id);
              setOpen(false);
            }}
            className={small ? "select-option select-option-sm" : "select-option"}
          >
            {opt.colorClass && <span className={`color-dot ${opt.colorClass.split(" ")[0]}`}></span>}
            <span>{opt.name}</span>
          </div>
        ))}
        {emptyText && options.length === 0 && <div className="select-empty-text">{emptyText}</div>}
      </DefaultTransition>
    </div>
  );
}
