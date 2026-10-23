'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  CheckCircle2,
  PlayCircle,
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
    item.type.toUpperCase()
  );

  const renderMetadata = () => {
    switch (item.type) {
      case 'games':
        return (
          <div className="space-y-0.5 text-[11px] leading-snug text-[#9CA3AF]">
            <p className="line-clamp-1 font-medium text-[#D1D5DB]">
              {item.developer} • {item.year}
            </p>
            <p className="line-clamp-1">
              🏆 {item.achievements} •{' '}
              <span className="font-semibold text-[#6EE7B7]">
                {formatBRL(item.priceBRL)}
              </span>
            </p>
          </div>
        );
      case 'movies':
        return (
          <div className="text-[11px] leading-snug text-[#9CA3AF]">
            <p className="line-clamp-1 font-medium text-[#D1D5DB]">
              ⏱ {item.duration} • {item.year}
            </p>
          </div>
        );
      case 'series':
        return (
          <div className="text-[11px] leading-snug text-[#9CA3AF]">
            <p className="line-clamp-1 font-medium text-[#D1D5DB]">
              📺 {t.seasonsUnit(item.seasons)} • {item.year}
            </p>
          </div>
        );
      case 'books':
        return (
          <div className="space-y-0.5 text-[11px] leading-snug text-[#9CA3AF]">
            <p className="line-clamp-1 font-medium text-[#D1D5DB]">
              {item.author} • {item.publisher}
            </p>
            <p className="line-clamp-1">
              {item.year ? `${item.year} • ` : ''}
              <span className="font-semibold text-[#6EE7B7]">
                {formatBRL(item.priceBRL)}
              </span>
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
    <article className="group relative h-[312px] w-[208px] shrink-0 select-none overflow-hidden rounded-xl border border-[#2A2F37] bg-[#16191D] transition-colors hover:border-[#3B424D]">
      {/* Full-bleed 2:3 Cover Image */}
      <img
        src={item.coverImage || fallbackCover}
        alt={item.title}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallbackCover) {
            target.src = fallbackCover;
          }
        }}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Top Gradient for top bar legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0D0F11]/80 to-transparent" />

      {/* Bottom Dark Gradient Overlay for Typography Legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0D0F11] via-[#0D0F11]/92 to-transparent" />

      {/* Top Bar (Overlaid) */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-[#064E3B]/95 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#6EE7B7] uppercase">
            {badgeLabel}
          </span>
          {item.isCurrentlyConsuming && (
            <span className="rounded-md border border-[#10B981]/40 bg-[#0D0F11]/90 px-1.5 py-0.5 text-[10px] font-medium text-[#10B981]">
              • {t.activeBadge}
            </span>
          )}
        </div>

        {/* Discreet 3-dot menu (⋮) */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Item options"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2A2F37]/80 bg-[#0D0F11]/85 text-[#F3F4F6] transition-colors hover:border-[#3B424D] hover:bg-[#1F2329]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-32 overflow-hidden rounded-lg border border-[#2A2F37] bg-[#1F2329] py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(item);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#F3F4F6] transition-colors hover:bg-[#2A2F37]"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <span>{t.edit}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(item);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#EF4444] transition-colors hover:bg-[#2A2F37]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.delete}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Metadata & Primary Action Buttons */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-3">
        <h3
          className="mb-1 line-clamp-2 text-sm leading-tight font-bold text-[#F3F4F6]"
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="mb-2.5">{renderMetadata()}</div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5">
          {/* Mark as Consumed / Move to Backlog */}
          <button
            type="button"
            onClick={() => onToggleStatus(item)}
            title={
              item.status === 'backlog'
                ? t.markConsumedAction[item.type]
                : t.moveToBacklogAction
            }
            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
              item.status === 'backlog'
                ? 'bg-[#10B981] text-[#0D0F11] hover:bg-[#059669]'
                : 'border border-[#2A2F37] bg-[#1F2329] text-[#F3F4F6] hover:border-[#3B424D]'
            }`}
          >
            {item.status === 'backlog' ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 stroke-[2.25]" />
                <span className="truncate">
                  {t.markConsumedAction[item.type]}
                </span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.moveToBacklogAction}</span>
              </>
            )}
          </button>

          {/* Consume Now Button (Games, Series, Books in Backlog) */}
          {canShowConsumeNow && (
            <button
              type="button"
              onClick={() => onConsumeNow(item)}
              title={
                item.isCurrentlyConsuming
                  ? t.removeFromActive
                  : t.consumeNow[item.type as 'games' | 'series' | 'books']
              }
              className={`inline-flex h-7 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                item.isCurrentlyConsuming
                  ? 'border-[#10B981] bg-[#064E3B] text-[#6EE7B7]'
                  : 'border-[#2A2F37] bg-[#1F2329] text-[#F3F4F6] hover:border-[#10B981] hover:text-[#10B981]'
              }`}
            >
              {item.type === 'books' ? (
                <BookOpen className="h-3.5 w-3.5" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
