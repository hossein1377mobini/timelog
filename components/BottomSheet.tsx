"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet — solid background */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[hsl(var(--surface-card))] shadow-2xl border-t border-[hsl(var(--hairline))]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[hsl(var(--hairline))]">
          <h2 className="text-[15px] font-semibold text-[hsl(var(--body-strong))]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[hsl(var(--surface-strong))] transition-colors"
          >
            <X size={18} className="text-[hsl(var(--muted))]" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
