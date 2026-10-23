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
      {/* Category Selector Tabs */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#2A2F37] bg-[#16191D] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Media categories"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
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
                className={`inline-flex items-center justify-between gap-2.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:justify-start ${
                  isSelected
                    ? 'bg-[#10B981] text-[#0D0F11]'
                    : 'border border-[#2A2F37] bg-[#0D0F11] text-[#9CA3AF] hover:border-[#3B424D] hover:text-[#F3F4F6]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{dynamicLabel}</span>
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-[#0D0F11]/20 text-[#0D0F11]'
                      : 'bg-[#16191D] text-[#9CA3AF]'
                  }`}
                >
                  {countInStatus}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Toggle (Backlog <-> Consumed) */}
        <div className="flex items-center self-start rounded-lg border border-[#2A2F37] bg-[#0D0F11] p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleViewStatus('backlog')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeStatus === 'backlog'
                ? 'bg-[#064E3B] text-[#6EE7B7]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            {t.backlogTab}
          </button>
          <button
            type="button"
            onClick={() => onToggleViewStatus('consumed')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeStatus === 'consumed'
                ? 'bg-[#064E3B] text-[#6EE7B7]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            {t.consumedTab}
          </button>
        </div>
      </div>

      {/* Search Bar & Quick Status Switcher Row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder(currentCategoryLabel)}
            className="w-full rounded-xl border border-[#2A2F37] bg-[#16191D] py-2.5 pr-9 pl-10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] transition-colors focus:border-[#10B981] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F3F4F6]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            onToggleViewStatus(
              activeStatus === 'backlog' ? 'consumed' : 'backlog'
            )
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#2A2F37] bg-[#16191D] px-4 py-2.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:border-[#3B424D] hover:text-[#F3F4F6]"
        >
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          <span>
            {activeStatus === 'backlog'
              ? t.toggleStatusBtn.toConsumed
              : t.toggleStatusBtn.toBacklog}
          </span>
        </button>
      </div>

      {/* Horizontal Scroll Track with Navigation Arrows */}
      {filteredItems.length > 0 ? (
        <div className="group/track relative">
          {/* Desktop Left Scroll Arrow */}
          <button
            type="button"
            onClick={() => scrollHorizontal('left')}
            aria-label="Scroll left"
            className="absolute top-1/2 -left-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2A2F37] bg-[#1F2329]/95 text-[#F3F4F6] opacity-0 transition-opacity group-hover/track:opacity-100 hover:border-[#10B981] hover:text-[#10B981] sm:flex"
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

          {/* Desktop Right Scroll Arrow */}
          <button
            type="button"
            onClick={() => scrollHorizontal('right')}
            aria-label="Scroll right"
            className="absolute top-1/2 -right-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2A2F37] bg-[#1F2329]/95 text-[#F3F4F6] opacity-0 transition-opacity group-hover/track:opacity-100 hover:border-[#10B981] hover:text-[#10B981] sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2F37] bg-[#16191D]/40 px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[#F3F4F6]">
            {t.emptyCategoryTitle} ({currentCategoryLabel})
          </p>
          <p className="mt-1 max-w-md text-xs text-[#9CA3AF]">
            {t.emptyCategorySub}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs font-medium text-[#F3F4F6] hover:border-[#3B424D]"
              >
                <X className="h-3.5 w-3.5" />
                <span>{t.clearSearch}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onAddItemForCurrentCategory}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-4 py-2 text-xs font-semibold text-[#0D0F11] transition-colors hover:bg-[#059669]"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>{t.addItem}</span>
              </button>
            )}

            {isDatabaseCompletelyEmpty && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2F37] bg-[#16191D] px-4 py-2 text-xs font-medium text-[#9CA3AF] transition-colors hover:border-[#10B981] hover:text-[#F3F4F6]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                <span>{t.loadDemoData}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
