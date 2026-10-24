'use client';

import React from 'react';
import {
  Gamepad2,
  Tv,
  BookOpen,
  Check,
  Pause,
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
      primaryMeta: activeGame
        ? `${activeGame.developer} · ${activeGame.year}`
        : '',
      secondaryMeta: activeGame
        ? `${t.achievementsUnit(activeGame.achievements)} · ${formatBRL(activeGame.priceBRL)}`
        : '',
    },
    {
      type: 'series' as const,
      label: t.slotLabels.series,
      icon: Tv,
      item: activeSeries,
      markLabel: t.markConsumedAction.series,
      primaryMeta: activeSeries
        ? `${t.seasonsUnit(activeSeries.seasons)} · ${activeSeries.year}`
        : '',
      secondaryMeta: '',
    },
    {
      type: 'books' as const,
      label: t.slotLabels.books,
      icon: BookOpen,
      item: activeBook,
      markLabel: t.markConsumedAction.books,
      primaryMeta: activeBook
        ? `${activeBook.author} · ${activeBook.publisher}`
        : '',
      secondaryMeta: activeBook
        ? `${activeBook.year ? `${activeBook.year} · ` : ''}${formatBRL(activeBook.priceBRL)}`
        : '',
    },
  ];

  return (
    <section
      aria-label={t.currentlyConsuming}
      className="mx-auto max-w-7xl px-4 pt-8 pb-3 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
            {t.currentlyConsuming}
          </h2>
          <span className="text-xs text-zinc-400">
            {t.currentlyConsumingSub}
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
                className="flex min-h-[148px] flex-col justify-between rounded-2xl border border-dashed border-white/10 bg-[#121215]/50 p-4 transition-colors hover:border-white/15"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800/50 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    <Icon className="h-3.5 w-3.5 text-zinc-300" />
                    {slot.label}
                  </span>
                </div>
                <p className="my-auto py-2 text-xs leading-relaxed text-zinc-500">
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
              className="flex min-h-[148px] gap-4 rounded-2xl border border-white/[0.08] bg-[#121215] p-3.5 transition-all duration-200 hover:border-white/20 hover:shadow-md"
            >
              {/* 2:3 Miniature Poster */}
              <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
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
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Details & Actions */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
                      <Icon className="h-3 w-3 text-emerald-400" />
                      {slot.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFromActive(slot.type, item.id)}
                      title={t.removeFromActive}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <Pause className="h-3 w-3" />
                      <span className="hidden xl:inline">
                        {t.removeFromActive}
                      </span>
                    </button>
                  </div>

                  <h3
                    className="truncate text-sm font-semibold tracking-tight text-white"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-0.5 truncate text-xs text-zinc-400"
                    title={slot.primaryMeta}
                  >
                    {slot.primaryMeta}
                  </p>
                  {slot.secondaryMeta && (
                    <p
                      className="truncate text-[11px] text-zinc-500"
                      title={slot.secondaryMeta}
                    >
                      {slot.secondaryMeta}
                    </p>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkConsumed(slot.type, item.id)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/90 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:border-white/20 hover:bg-zinc-700/90 hover:text-white"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.2]" />
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
