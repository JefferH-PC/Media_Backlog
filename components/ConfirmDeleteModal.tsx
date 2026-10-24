'use client';

import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Locale, MediaItem } from '@/types/backlog';
import { translations } from '@/utils/i18n';

interface ConfirmDeleteModalProps {
  item: MediaItem | null;
  locale: Locale;
  onCancel: () => void;
  onConfirm: (item: MediaItem) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  item,
  locale,
  onCancel,
  onConfirm,
}) => {
  const t = translations[locale];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onCancel]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <Trash2 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {t.confirmDelete.title}
          </h3>
        </div>

        <p className="mb-6 text-xs leading-relaxed text-zinc-400">
          {t.confirmDelete.message(item.title)}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            {t.confirmDelete.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(item)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-500"
          >
            {t.confirmDelete.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
