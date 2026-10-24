'use client';

import React, { useRef } from 'react';
import {
  Gamepad2,
  Film,
  Tv,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AppDatabase,
  ItemStatus,
  Locale,
  MediaItem,
  MediaType,
} from '@/types/backlog';
import { translations, getCategoryDisplayName } from '@/utils/i18n';
import { MediaCard } from './MediaCard';

interface CategorySectionProps {
  db: AppDatabase;
  locale: Locale;
  activeCategory: MediaType;
  activeStatus: ItemStatus;
  searchQuery: string;
  onSelectCategory: (category: MediaType) => void;
  onToggleViewStatus: (status: ItemStatus) => void;
  onSearchChange: (q: string) => void;
  onToggleItemStatus: (item: MediaItem) => void;
  onConsumeNow: (item: MediaItem) => void;
  onEditItem: (item: MediaItem) => void;
  onDeleteItem: (item: MediaItem) => void;
  onAddItemForCurrentCategory: () => void;
  onLoadDemoData: () => void;
}

const CATEGORY_ICONS: Record<MediaType, React.ElementType> = {
  games: Gamepad2,
  movies: Film,
  series: Tv,
  books: BookOpen,
};

const CATEGORIES: MediaType[] = ['games', 'movies', 'series', 'books'];

export const CategorySection: React.FC<CategorySectionProps> = ({
  db,
  locale,
  activeCategory,
  activeStatus,
  searchQuery,
  onSelectCategory,
  onToggleViewStatus,
  onSearchChange,
  onToggleItemStatus,
  onConsumeNow,
  onEditItem,
  onDeleteItem,
  onAddItemForCurrentCategory,
  onLoadDemoData,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const t = translations[locale];

  const isDatabaseCompletelyEmpty =
    db.games.length === 0 &&
    db.movies.length === 0 &&
    db.series.length === 0 &&
    db.books.length === 0;

  const categoryItems: MediaItem[] = db[activeCategory] || [];
  const filteredItems = categoryItems.filter(
    (item) =>
      item.status === activeStatus &&
      item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const currentCategoryLabel = getCategoryDisplayName(
    locale,
    activeCategory,
    activeStatus
  );

  const scrollHorizontal = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const distance = 440;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Category Pills & Status Segmented Controller */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pill Tabs */}
        <div
          role="tablist"
          aria-label="Media categories"
          className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap"
        >
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = activeCategory === cat;
            const dynamicLabel = getCategoryDisplayName(
              locale,
              cat,
              activeStatus
            );
            const countInStatus = (db[cat] || []).filter(
              (i) => i.status === activeStatus
            ).length;

            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`inline-flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all sm:justify-start ${
                  isSelected
                    ? 'border border-white/20 bg-zinc-100 text-zinc-950 shadow-xs'
                    : 'border border-white/[0.08] bg-[#121215] text-zinc-400 hover:border-white/15 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{dynamicLabel}</span>
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    isSelected
                      ? 'bg-zinc-900/15 text-zinc-900'
                      : 'bg-zinc-800/80 text-zinc-400'
                  }`}
                >
                  {countInStatus}
                </span>
              </button>
            );
          })}
        </div>

        {/* Segmented Status Toggle (Backlog | Completed) */}
        <div className="inline-flex self-start rounded-xl border border-white/[0.08] bg-[#121215] p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleViewStatus('backlog')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeStatus === 'backlog'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.backlogTab}
          </button>
          <button
            type="button"
            onClick={() => onToggleViewStatus('consumed')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeStatus === 'consumed'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.consumedTab}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-5 flex items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder(currentCategoryLabel)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#121215] py-2.5 pr-9 pl-10 text-xs text-zinc-100 placeholder-zinc-400 transition-colors focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.clearSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Media Items Track */}
      {filteredItems.length > 0 ? (
        <div className="group/track relative">
          {/* Scroll Left Arrow */}
          <button
            type="button"
            onClick={() => scrollHorizontal('left')}
            aria-label="Scroll left"
            className="absolute top-1/2 -left-3.5 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 text-zinc-200 opacity-0 shadow-lg backdrop-blur-md transition-all group-hover/track:opacity-100 hover:border-white/25 hover:bg-zinc-800 hover:text-white sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={scrollContainerRef}
            className="minimal-scrollbar flex items-stretch gap-4 overflow-x-auto pt-1 pb-4"
          >
            {filteredItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                locale={locale}
                onToggleStatus={onToggleItemStatus}
                onConsumeNow={onConsumeNow}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>

          {/* Scroll Right Arrow */}
          <button
            type="button"
            onClick={() => scrollHorizontal('right')}
            aria-label="Scroll right"
            className="absolute top-1/2 -right-3.5 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-900/90 text-zinc-200 opacity-0 shadow-lg backdrop-blur-md transition-all group-hover/track:opacity-100 hover:border-white/25 hover:bg-zinc-800 hover:text-white sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#121215]/40 px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-200">
            {t.emptyCategoryTitle} ({currentCategoryLabel})
          </p>
          <p className="mt-1 max-w-sm text-xs text-zinc-400">
            {t.emptyCategorySub}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                <span>{t.clearSearch}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onAddItemForCurrentCategory}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
              >
                <Plus className="h-4 w-4 stroke-[2.2]" />
                <span>{t.addItem}</span>
              </button>
            )}

            {isDatabaseCompletelyEmpty && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121215] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.loadDemoData}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
