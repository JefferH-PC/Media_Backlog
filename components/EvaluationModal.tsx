'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, MessageSquare, Check, RotateCcw } from 'lucide-react';
import { Locale, MediaItem } from '@/types/backlog';
import { translations } from '@/utils/i18n';
import { createPosterSvgDataUrl } from '@/utils/demoData';

interface EvaluationModalProps {
  isOpen: boolean;
  locale: Locale;
  item: MediaItem | null;
  onClose: () => void;
  onConfirm: (data: { rating?: number; notes?: string; completedAt: string }) => void;
  onSkip: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  locale,
  item,
  onClose,
  onConfirm,
  onSkip,
}) => {
  const t = translations[locale];
  const evalT = t.evaluationModal;

  const [rating, setRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [completedDate, setCompletedDate] = useState('');

  // Reset or initialize state whenever item changes or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setRating(item.rating);
      setHoverRating(undefined);
      setNotes(item.notes || '');
      setCompletedDate(
        item.completedAt
          ? item.completedAt.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    }
  }, [isOpen, item]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const fallbackCover = createPosterSvgDataUrl(
    item.title,
    String(item.year),
    item.type
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDate = completedDate
      ? new Date(completedDate + 'T12:00:00.000Z').toISOString()
      : new Date().toISOString();

    onConfirm({
      rating: rating && rating > 0 ? rating : undefined,
      notes: notes.trim() || undefined,
      completedAt: finalDate,
    });
  };

  const badgeLabel = t.slotLabels[item.type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evaluation-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#121215] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="evaluation-title" className="text-sm font-semibold text-white">
                {evalT.title}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {evalT.subtitle(item.title)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Item Quick Overview Banner */}
          <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3">
            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
              <img
                src={item.coverImage || fallbackCover}
                alt={item.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== fallbackCover) {
                    target.src = fallbackCover;
                  }
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-zinc-300">
                  {badgeLabel}
                </span>
                {item.year && (
                  <span className="text-[10px] text-zinc-500">
                    {item.year}
                  </span>
                )}
              </div>
              <h3 className="truncate text-xs font-semibold text-white">
                {item.title}
              </h3>
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/40" />
                <span>{evalT.ratingLabel}</span>
              </label>
              {rating !== undefined && (
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className="text-[11px] text-zinc-400 transition-colors hover:text-rose-400"
                >
                  {evalT.clearRating}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const activeVal = hoverRating ?? rating ?? 0;
                const isFilled = starValue <= activeVal;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() =>
                      setRating(rating === starValue ? undefined : starValue)
                    }
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(undefined)}
                    aria-label={`Rate ${starValue} stars`}
                    className="p-1 transition-transform hover:scale-115 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'fill-transparent text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-semibold text-zinc-300">
                {rating ? `${rating} / 5` : t.unrated}
              </span>
            </div>
          </div>

          {/* Date Completed */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>{evalT.completedDateLabel}</span>
            </label>
            <input
              type="date"
              required
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
            />
          </div>

          {/* Notes / Thoughts Review */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
              <span>{evalT.notesLabel}</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={evalT.notesPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              {evalT.skipAction}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {evalT.cancel}
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-zinc-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-emerald-500/20 active:scale-98"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{evalT.saveAction}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
