'use client';

import React, { useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import { Locale, MediaItem } from '@/types/backlog';
import { translations } from '@/utils/i18n';

interface ConfirmReplaceActiveModalProps {
  currentItem: MediaItem | null;
  newItem: MediaItem | null;
  locale: Locale;
  onCancel: () => void;
  onConfirm: (newItem: MediaItem) => void;
}

export const ConfirmReplaceActiveModal: React.FC<
  ConfirmReplaceActiveModalProps
> = ({ currentItem, newItem, locale, onCancel, onConfirm }) => {
  const t = translations[locale];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && newItem) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [newItem, onCancel]);

  if (!currentItem || !newItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F11]/80 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2A2F37] bg-[#1F2329] p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#064E3B] text-[#6EE7B7]">
            <PlayCircle className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#F3F4F6]">
            {t.confirmReplace.title}
          </h3>
        </div>

        <p className="mb-6 text-xs leading-relaxed text-[#9CA3AF]">
          {t.confirmReplace.message(currentItem.title, newItem.title)}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2A2F37] bg-[#16191D] px-4 py-2 text-xs font-semibold text-[#9CA3AF] transition-colors hover:text-[#F3F4F6]"
          >
            {t.confirmReplace.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(newItem)}
            className="rounded-lg bg-[#10B981] px-4 py-2 text-xs font-semibold text-[#0D0F11] transition-colors hover:bg-[#059669]"
          >
            {t.confirmReplace.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
