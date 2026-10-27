'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Check,
  Play,
  BookOpen,
  Edit3,
  Trash2,
  RotateCcw,
  Star,
  MessageSquare,
  X,
} from 'lucide-react';
import { MediaItem, Locale } from '@/types/backlog';
import { formatBRL } from '@/utils/format';
import { translations } from '@/utils/i18n';
import { createPosterSvgDataUrl } from '@/utils/demoData';

interface MediaCardProps {
  item: MediaItem;
  locale: Locale;
  onToggleStatus: (item: MediaItem) => void;
  onConsumeNow: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onEvaluate?: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  locale,
  onToggleStatus,
  onConsumeNow,
  onEdit,
  onDelete,
  onEvaluate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const t = translations[locale];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const fallbackCover = createPosterSvgDataUrl(
    item.title,
    String(item.year),
    item.type
  );

  const formattedCompletionDate = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString(
        locale === 'pt-BR' ? 'pt-BR' : 'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }
      )
    : null;

  const renderMetadata = () => {
    switch (item.type) {
      case 'games':
        return (
          <div className="space-y-0.5 text-[10px] sm:text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {item.developer} · {item.year}
            </p>
            <p className="truncate text-zinc-500">
              {t.achievementsUnit(item.achievements)} ·{' '}
              <span className="text-zinc-300">{formatBRL(item.priceBRL)}</span>
            </p>
          </div>
        );
      case 'movies':
        return (
          <div className="text-[10px] sm:text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {item.duration} · {item.year}
            </p>
          </div>
        );
      case 'series':
        return (
          <div className="text-[10px] sm:text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {t.seasonsUnit(item.seasons)} · {item.year}
            </p>
          </div>
        );
      case 'books':
        return (
          <div className="space-y-0.5 text-[10px] sm:text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {item.author} · {item.publisher}
            </p>
            <p className="truncate text-zinc-500">
              {item.year ? `${item.year} · ` : ''}
              <span className="text-zinc-300">{formatBRL(item.priceBRL)}</span>
            </p>
          </div>
        );
    }
  };

  const canShowConsumeNow =
    item.type !== 'movies' && item.status === 'backlog';

  const badgeLabel =
    item.status === 'consumed'
      ? t.categoryLabels.consumed[item.type]
      : t.slotLabels[item.type];

  return (
    <>
      <article className="group relative aspect-[2/3] w-full select-none overflow-hidden rounded-xl border border-white/[0.08] bg-[#121215] shadow-xs transition-all duration-200 hover:border-white/20 hover:shadow-lg">
        {/* Full-bleed 2:3 Cover Poster */}
        <img
          src={item.coverImage || fallbackCover}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackCover) {
              target.src = fallbackCover;
            }
          }}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Top Vignette for Badges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />

        {/* Bottom Vignette for Typography & Controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent" />

        {/* Top Bar: Pills & 3-dot menu */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2">
          <div className="flex flex-wrap items-center gap-1 max-w-[80%]">
            {/* Category / Status Badge */}
            <span className="rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-zinc-300 uppercase backdrop-blur-md">
              {badgeLabel}
            </span>

            {/* In Progress Badge */}
            {item.isCurrentlyConsuming && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 backdrop-blur-md">
                {t.activeBadge}
              </span>
            )}

            {/* Star Rating Badge */}
            {item.rating && (
              <button
                type="button"
                onClick={() => onEvaluate?.(item)}
                title={item.status === 'consumed' ? t.evaluationModal.title : undefined}
                className={`inline-flex items-center gap-0.5 rounded-md border border-amber-500/30 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-md ${
                  onEvaluate ? 'hover:bg-amber-500/20 cursor-pointer transition-colors' : ''
                }`}
              >
                <Star className="h-2.5 w-2.5 fill-amber-400" />
                <span>{item.rating}</span>
              </button>
            )}
          </div>

          {/* 3-dot dropdown menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Item options"
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-zinc-300 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/80 hover:text-white"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#18181d] py-1 shadow-xl backdrop-blur-md z-30">
                {item.status === 'consumed' && onEvaluate && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEvaluate(item);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-amber-400 transition-colors hover:bg-amber-500/10"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400/30" />
                    <span>{t.evaluationModal.title}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{t.edit}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.delete}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Content & Controls */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-2 sm:p-2.5">
          <div className="mb-1 flex items-baseline justify-between gap-1">
            <h3
              className="truncate text-xs sm:text-sm font-semibold tracking-tight text-white"
              title={item.title}
            >
              {item.title}
            </h3>

            {/* Note indicator icon */}
            {item.notes && (
              <button
                type="button"
                onClick={() => setShowNotesModal(true)}
                title={item.notes}
                className="shrink-0 p-0.5 text-zinc-400 hover:text-white transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="mb-1.5 sm:mb-2">{renderMetadata()}</div>

          {/* Completion Date (if finished) */}
          {item.status === 'consumed' && formattedCompletionDate && (
            <p className="mb-1.5 truncate text-[10px] text-emerald-400/90 font-medium">
              {t.finishedOn(formattedCompletionDate)}
            </p>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Mark Consumed / Move to Backlog */}
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              title={
                item.status === 'backlog'
                  ? t.markConsumedAction[item.type]
                  : t.moveToBacklogAction
              }
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-medium backdrop-blur-sm transition-colors ${
                item.status === 'backlog'
                  ? 'border border-white/10 bg-zinc-800/85 text-zinc-100 hover:border-white/20 hover:bg-zinc-700/85'
                  : 'border border-white/10 bg-zinc-800/60 text-zinc-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {item.status === 'backlog' ? (
                <>
                  <Check className="h-3 w-3 shrink-0 text-emerald-400 stroke-[2.2]" />
                  <span className="truncate">
                    {t.markConsumedAction[item.type]}
                  </span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3 w-3 shrink-0 text-zinc-400" />
                  <span className="truncate">{t.moveToBacklogAction}</span>
                </>
              )}
            </button>

            {/* In-Progress Focus Play / Read button */}
            {canShowConsumeNow && (
              <button
                type="button"
                onClick={() => onConsumeNow(item)}
                title={
                  item.isCurrentlyConsuming
                    ? t.removeFromActive
                    : t.consumeNow[item.type as 'games' | 'series' | 'books']
                }
                className={`inline-flex h-6 sm:h-7 w-6 sm:w-7 shrink-0 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors ${
                  item.isCurrentlyConsuming
                    ? 'border-emerald-500/40 bg-emerald-950/70 text-emerald-400'
                    : 'border-white/10 bg-zinc-800/85 text-zinc-300 hover:border-white/20 hover:text-emerald-400'
                }`}
              >
                {item.type === 'books' ? (
                  <BookOpen className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3 fill-current" />
                )}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Quick Notes Modal */}
      {showNotesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121215] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-semibold text-white truncate max-w-[200px]">
                  {item.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {item.notes}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="rounded-xl border border-white/10 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white"
              >
                {t.modal.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
