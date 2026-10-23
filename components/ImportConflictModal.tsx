'use client';

import React, { useEffect } from 'react';
import { Upload, GitMerge, RefreshCw } from 'lucide-react';
import { AppDatabase, Locale } from '@/types/backlog';
import { translations } from '@/utils/i18n';

interface ImportConflictModalProps {
  incomingDb: AppDatabase | null;
  locale: Locale;
  onCancel: () => void;
  onOverwrite: (db: AppDatabase) => void;
  onMerge: (db: AppDatabase) => void;
}

export const ImportConflictModal: React.FC<ImportConflictModalProps> = ({
  incomingDb,
  locale,
  onCancel,
  onOverwrite,
  onMerge,
}) => {
  const t = translations[locale];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && incomingDb) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [incomingDb, onCancel]);

  if (!incomingDb) return null;

  const totalItems =
    incomingDb.games.length +
    incomingDb.movies.length +
    incomingDb.series.length +
    incomingDb.books.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F11]/80 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#2A2F37] bg-[#1F2329] p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#064E3B] text-[#6EE7B7]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F3F4F6]">
                {t.importModal.title}
              </h3>
              <p className="text-[11px] text-[#6EE7B7]">
                {totalItems} items detected ({incomingDb.games.length} Games,{' '}
                {incomingDb.movies.length} Movies, {incomingDb.series.length}{' '}
                Series, {incomingDb.books.length} Books)
              </p>
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[#9CA3AF]">
          {t.importModal.description}
        </p>

        <div className="mb-6 space-y-3">
          {/* Option B: Merge */}
          <button
            type="button"
            onClick={() => onMerge(incomingDb)}
            className="flex w-full items-start gap-3.5 rounded-xl border border-[#2A2F37] bg-[#16191D] p-4 text-left transition-colors hover:border-[#10B981]"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#064E3B] text-[#6EE7B7]">
              <GitMerge className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F3F4F6]">
                {t.importModal.mergeTitle}
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {t.importModal.mergeDesc}
              </p>
            </div>
          </button>

          {/* Option A: Overwrite */}
          <button
            type="button"
            onClick={() => onOverwrite(incomingDb)}
            className="flex w-full items-start gap-3.5 rounded-xl border border-[#2A2F37] bg-[#16191D] p-4 text-left transition-colors hover:border-[#EF4444]"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EF4444]/15 text-[#EF4444]">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F3F4F6]">
                {t.importModal.overwriteTitle}
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {t.importModal.overwriteDesc}
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2A2F37] bg-[#16191D] px-4 py-2 text-xs font-semibold text-[#9CA3AF] transition-colors hover:text-[#F3F4F6]"
          >
            {t.importModal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
