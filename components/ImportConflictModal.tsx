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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {t.importModal.title}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {totalItems} items detected ({incomingDb.games.length} Games,{' '}
                {incomingDb.movies.length} Movies, {incomingDb.series.length}{' '}
                Series, {incomingDb.books.length} Books)
              </p>
            </div>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-zinc-400">
          {t.importModal.description}
        </p>

        <div className="mb-6 space-y-2.5">
          {/* Option B: Merge */}
          <button
            type="button"
            onClick={() => onMerge(incomingDb)}
            className="flex w-full items-start gap-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4 text-left transition-all hover:border-white/25 hover:bg-zinc-800/60"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-emerald-400">
              <GitMerge className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {t.importModal.mergeTitle}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {t.importModal.mergeDesc}
              </p>
            </div>
          </button>

          {/* Option A: Overwrite */}
          <button
            type="button"
            onClick={() => onOverwrite(incomingDb)}
            className="flex w-full items-start gap-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4 text-left transition-all hover:border-rose-500/40 hover:bg-rose-950/20"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {t.importModal.overwriteTitle}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {t.importModal.overwriteDesc}
              </p>
            </div>
          </button>
        </div>

        <div className="flex justify-end border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            {t.importModal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
