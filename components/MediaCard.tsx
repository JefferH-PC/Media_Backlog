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
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  locale,
  onToggleStatus,
  onConsumeNow,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const renderMetadata = () => {
    switch (item.type) {
      case 'games':
        return (
          <div className="space-y-0.5 text-[11px] leading-tight text-zinc-400">
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
          <div className="text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {item.duration} · {item.year}
            </p>
          </div>
        );
      case 'series':
        return (
          <div className="text-[11px] leading-tight text-zinc-400">
            <p className="truncate">
              {t.seasonsUnit(item.seasons)} · {item.year}
            </p>
          </div>
        );
      case 'books':
        return (
          <div className="space-y-0.5 text-[11px] leading-tight text-zinc-400">
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
    <article className="group relative h-[312px] w-[208px] shrink-0 select-none overflow-hidden rounded-xl border border-white/[0.08] bg-[#121215] shadow-sm transition-all duration-200 hover:border-white/20 hover:shadow-md">
      {/* 2:3 Cover Poster */}
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

      {/* Top Subtle Vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/75 to-transparent" />

      {/* Bottom Subtle Vignette for Text Contrast */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#09090b] via-[#09090b]/85 to-transparent" />

      {/* Top Bar (Pills & 3-dot menu) */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300 uppercase backdrop-blur-md">
            {badgeLabel}
          </span>
          {item.isCurrentlyConsuming && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-md">
              {t.activeBadge}
            </span>
          )}
        </div>

        {/* 3-dot menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Item options"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-zinc-300 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/75 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#18181d] py-1 shadow-xl backdrop-blur-md">
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
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-3">
        <h3
          className="mb-1 truncate text-sm font-semibold tracking-tight text-white"
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="mb-2.5">{renderMetadata()}</div>

        {/* Action Row */}
        <div className="flex items-center gap-1.5">
          {/* Mark Consumed / Move to Backlog */}
          <button
            type="button"
            onClick={() => onToggleStatus(item)}
            title={
              item.status === 'backlog'
                ? t.markConsumedAction[item.type]
                : t.moveToBacklogAction
            }
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-sm transition-colors ${
              item.status === 'backlog'
                ? 'border border-white/10 bg-zinc-800/85 text-zinc-100 hover:border-white/20 hover:bg-zinc-700/85'
                : 'border border-white/10 bg-zinc-800/60 text-zinc-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {item.status === 'backlog' ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 stroke-[2.2]" />
                <span className="truncate">
                  {t.markConsumedAction[item.type]}
                </span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">{t.moveToBacklogAction}</span>
              </>
            )}
          </button>

          {/* Quick Play/Watch/Read Focus Button */}
          {canShowConsumeNow && (
            <button
              type="button"
              onClick={() => onConsumeNow(item)}
              title={
                item.isCurrentlyConsuming
                  ? t.removeFromActive
                  : t.consumeNow[item.type as 'games' | 'series' | 'books']
              }
              className={`inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors ${
                item.isCurrentlyConsuming
                  ? 'border-emerald-500/40 bg-emerald-950/70 text-emerald-400'
                  : 'border-white/10 bg-zinc-800/85 text-zinc-300 hover:border-white/20 hover:text-emerald-400'
              }`}
            >
              {item.type === 'books' ? (
                <BookOpen className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
