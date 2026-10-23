'use client';

import React from 'react';
import {
  Gamepad2,
  Tv,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  GameItem,
  SeriesItem,
  BookItem,
  Locale,
} from '@/types/backlog';
import { translations } from '@/utils/i18n';
import { formatBRL } from '@/utils/format';
import { createPosterSvgDataUrl } from '@/utils/demoData';

interface CurrentlyConsumingHeroProps {
  locale: Locale;
  activeGame: GameItem | null;
  activeSeries: SeriesItem | null;
  activeBook: BookItem | null;
  onMarkConsumed: (type: 'games' | 'series' | 'books', id: string) => void;
  onRemoveFromActive: (type: 'games' | 'series' | 'books', id: string) => void;
}

export const CurrentlyConsumingHero: React.FC<CurrentlyConsumingHeroProps> = ({
  locale,
  activeGame,
  activeSeries,
  activeBook,
  onMarkConsumed,
  onRemoveFromActive,
}) => {
  const t = translations[locale];

  const slots = [
    {
      type: 'games' as const,
      label: t.slotLabels.games,
      icon: Gamepad2,
      item: activeGame,
      markLabel: t.markConsumedAction.games,
      meta: activeGame
        ? `${activeGame.developer} • ${activeGame.year} • 🏆 ${activeGame.achievements} • ${formatBRL(activeGame.priceBRL)}`
        : '',
    },
    {
      type: 'series' as const,
      label: t.slotLabels.series,
      icon: Tv,
      item: activeSeries,
      markLabel: t.markConsumedAction.series,
      meta: activeSeries
        ? `📺 ${t.seasonsUnit(activeSeries.seasons)} • ${activeSeries.year}`
        : '',
    },
    {
      type: 'books' as const,
      label: t.slotLabels.books,
      icon: BookOpen,
      item: activeBook,
      markLabel: t.markConsumedAction.books,
      meta: activeBook
        ? `${activeBook.author} • ${activeBook.publisher} • ${formatBRL(activeBook.priceBRL)}`
        : '',
    },
  ];

  return (
    <section
      aria-label={t.currentlyConsuming}
      className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          <h2 className="text-xs font-bold tracking-wider text-[#F3F4F6] uppercase">
            {t.currentlyConsuming}
          </h2>
          <span className="hidden text-xs text-[#9CA3AF] sm:inline">
            — {t.currentlyConsumingSub}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const item = slot.item;

          if (!item) {
            return (
              <div
                key={slot.type}
                className="flex min-h-[148px] flex-col justify-between rounded-xl border border-dashed border-[#2A2F37] bg-[#16191D]/40 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#1F2329] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF]">
                    <Icon className="h-3.5 w-3.5 text-[#10B981]" />
                    {slot.label}
                  </span>
                </div>
                <p className="my-auto py-3 text-xs leading-relaxed text-[#9CA3AF]">
                  {t.emptySlot(slot.label)}
                </p>
              </div>
            );
          }

          const fallbackCover = createPosterSvgDataUrl(
            item.title,
            String(item.year),
            slot.label
          );

          return (
            <div
              key={slot.type}
              className="flex min-h-[148px] gap-4 rounded-xl border border-[#2A2F37] bg-[#16191D] p-3.5 transition-colors hover:border-[#3B424D]"
            >
              {/* 2:3 Miniature Poster */}
              <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-[#2A2F37] bg-[#0D0F11]">
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

              {/* Details & Actions */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#064E3B] px-2 py-0.5 text-[11px] font-semibold text-[#6EE7B7]">
                      <Icon className="h-3 w-3" />
                      {slot.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFromActive(slot.type, item.id)}
                      title={t.removeFromActive}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#9CA3AF] transition-colors hover:bg-[#1F2329] hover:text-[#F3F4F6]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">
                        {t.removeFromActive}
                      </span>
                    </button>
                  </div>

                  <h3
                    className="line-clamp-1 text-sm font-semibold text-[#F3F4F6]"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-0.5 line-clamp-2 text-xs text-[#9CA3AF]"
                    title={slot.meta}
                  >
                    {slot.meta}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkConsumed(slot.type, item.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#0D0F11] transition-colors hover:bg-[#059669]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.25]" />
                    <span>{slot.markLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
