"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  actions?: React.ReactNode;
};

export function Dialog({ open, title, description, onClose, actions }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        className={cn("w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-6")}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="mt-2 text-sm text-white/70">{description}</p> : null}
        {actions ? <div className="mt-4 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
