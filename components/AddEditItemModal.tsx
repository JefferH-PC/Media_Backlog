'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gamepad2,
  Film,
  Tv,
  BookOpen,
  Upload,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon,
  Star,
  Calendar,
  Tag,
  MessageSquare,
} from 'lucide-react';
import {
  ItemStatus,
  Locale,
  MediaItem,
  MediaType,
} from '@/types/backlog';
import { translations, PLATFORM_PRESETS } from '@/utils/i18n';
import { formatBRL, generateId } from '@/utils/format';
import { compressImage } from '@/utils/imageCompressor';
import { createPosterSvgDataUrl } from '@/utils/demoData';

interface AddEditItemModalProps {
  isOpen: boolean;
  locale: Locale;
  initialCategory: MediaType;
  editingItem: MediaItem | null;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
}

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  isOpen,
  locale,
  initialCategory,
  editingItem,
  onClose,
  onSave,
}) => {
  const t = translations[locale];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [type, setType] = useState<MediaType>(initialCategory);
  const [status, setStatus] = useState<ItemStatus>('backlog');
  const [isCurrentlyConsuming, setIsCurrentlyConsuming] = useState(false);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [coverImage, setCoverImage] = useState('');

  // Platform & completion
  const [platform, setPlatform] = useState('');
  const [completedDate, setCompletedDate] = useState('');

  // Ratings & Notes
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Game specific
  const [developer, setDeveloper] = useState('');
  const [achievements, setAchievements] = useState<string>('0');
  const [priceBRL, setPriceBRL] = useState<string>('0.00');

  // Movie specific
  const [duration, setDuration] = useState('');

  // Series specific
  const [seasons, setSeasons] = useState<string>('1');

  // Book specific
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');

  const [compressing, setCompressing] = useState(false);

  // Initialize form when modal opens or editingItem changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setType(editingItem.type);
      setStatus(editingItem.status);
      setIsCurrentlyConsuming(Boolean(editingItem.isCurrentlyConsuming));
      setTitle(editingItem.title);
      setYear(String(editingItem.year));
      setCoverImage(editingItem.coverImage || '');
      setPlatform(editingItem.platform || '');
      setRating(editingItem.rating);
      setNotes(editingItem.notes || '');
      setCompletedDate(
        editingItem.completedAt
          ? editingItem.completedAt.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );

      if (editingItem.type === 'games') {
        setDeveloper(editingItem.developer);
        setAchievements(String(editingItem.achievements));
        setPriceBRL(editingItem.priceBRL.toFixed(2));
      } else if (editingItem.type === 'movies') {
        setDuration(editingItem.duration);
      } else if (editingItem.type === 'series') {
        setSeasons(String(editingItem.seasons));
      } else if (editingItem.type === 'books') {
        setAuthor(editingItem.author);
        setPublisher(editingItem.publisher);
        setPriceBRL(editingItem.priceBRL.toFixed(2));
      }
    } else {
      setType(initialCategory);
      setStatus('backlog');
      setIsCurrentlyConsuming(false);
      setTitle('');
      setYear(String(new Date().getFullYear()));
      setCoverImage('');
      setPlatform('');
      setRating(undefined);
      setNotes('');
      setCompletedDate(new Date().toISOString().split('T')[0]);
      setDeveloper('');
      setAchievements('0');
      setPriceBRL('0.00');
      setDuration('2h 00m');
      setSeasons('1');
      setAuthor('');
      setPublisher('');
    }
  }, [isOpen, editingItem, initialCategory]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const webpBase64 = await compressImage(file, 300, 450, 0.75);
      setCoverImage(webpBase64);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const parseNumericPrice = (raw: string): number => {
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(raw.includes(',') ? normalized : raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const parsedYear =
      type === 'series'
        ? year.trim() || '2024'
        : parseInt(year, 10) || new Date().getFullYear();

    const now = new Date().toISOString();

    const finalCover =
      coverImage.trim() ||
      createPosterSvgDataUrl(
        cleanTitle,
        String(parsedYear),
        type
      );

    const resolvedCompletedAt =
      status === 'consumed'
        ? completedDate
          ? new Date(completedDate + 'T12:00:00.000Z').toISOString()
          : now
        : undefined;

    const baseFields = {
      id: editingItem ? editingItem.id : generateId(),
      title: cleanTitle,
      year: parsedYear,
      status,
      coverImage: finalCover,
      platform: platform.trim() || undefined,
      rating: rating && rating > 0 ? rating : undefined,
      notes: notes.trim() || undefined,
      completedAt: resolvedCompletedAt,
      isCurrentlyConsuming:
        type !== 'movies' && status === 'backlog'
          ? isCurrentlyConsuming
          : false,
      createdAt: editingItem ? editingItem.createdAt : now,
      updatedAt: now,
    };

    let itemToSave: MediaItem;

    if (type === 'games') {
      itemToSave = {
        ...baseFields,
        type: 'games',
        developer: developer.trim() || 'Unknown Studio',
        achievements: Math.max(0, parseInt(achievements, 10) || 0),
        priceBRL: parseNumericPrice(priceBRL),
      };
    } else if (type === 'movies') {
      itemToSave = {
        ...baseFields,
        type: 'movies',
        isCurrentlyConsuming: false,
        duration: duration.trim() || '2h 00m',
      };
    } else if (type === 'series') {
      itemToSave = {
        ...baseFields,
        type: 'series',
        seasons: Math.max(1, parseInt(seasons, 10) || 1),
      };
    } else {
      itemToSave = {
        ...baseFields,
        type: 'books',
        author: author.trim() || 'Unknown Author',
        publisher: publisher.trim() || 'Unknown Publisher',
        priceBRL: parseNumericPrice(priceBRL),
      };
    }

    onSave(itemToSave);
    onClose();
  };

  const previewCover =
    coverImage.trim() ||
    createPosterSvgDataUrl(
      title.trim() || 'Preview',
      year.trim() || String(new Date().getFullYear()),
      type
    );

  const categoryButtons: { id: MediaType; label: string; icon: React.ElementType }[] = [
    { id: 'games', label: t.slotLabels.games, icon: Gamepad2 },
    { id: 'movies', label: t.slotLabels.movies, icon: Film },
    { id: 'series', label: t.slotLabels.series, icon: Tv },
    { id: 'books', label: t.slotLabels.books, icon: BookOpen },
  ];

  const presets = PLATFORM_PRESETS[type] || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 id="modal-title" className="text-base font-semibold text-white">
            {editingItem ? t.modal.editTitle : t.modal.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              {t.modal.mediaType}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categoryButtons.map((cat) => {
                const Icon = cat.icon;
                const active = type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const newType = cat.id;
                      setType(newType);
                      if (newType === 'movies') {
                        setIsCurrentlyConsuming(false);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      active
                        ? 'border-white/20 bg-zinc-100 text-zinc-950 shadow-xs'
                        : 'border-white/[0.08] bg-zinc-900/40 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title and Year Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t.modal.title} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.modal.titlePlaceholder}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {type === 'series' ? t.modal.yearSeries : t.modal.year}
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={
                  type === 'series'
                    ? t.modal.yearSeriesPlaceholder
                    : t.modal.yearPlaceholder
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Category-Specific Fields */}
          {type === 'games' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {t.modal.developer}
                </label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder={t.modal.developerPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {t.modal.achievements}
                </label>
                <input
                  type="number"
                  min={0}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
                  <span>{t.modal.priceBRL}</span>
                  <span className="text-[11px] font-normal text-zinc-300">
                    {formatBRL(parseNumericPrice(priceBRL))}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={priceBRL}
                  onChange={(e) => setPriceBRL(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          {type === 'movies' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t.modal.duration}
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t.modal.durationPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
              />
            </div>
          )}

          {type === 'series' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t.modal.seasons}
              </label>
              <input
                type="number"
                min={1}
                value={seasons}
                onChange={(e) => setSeasons(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
              />
            </div>
          )}

          {type === 'books' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {t.modal.author}
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t.modal.authorPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {t.modal.publisher}
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder={t.modal.publisherPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
                  <span>{t.modal.priceBRL}</span>
                  <span className="text-[11px] font-normal text-zinc-300">
                    {formatBRL(parseNumericPrice(priceBRL))}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={priceBRL}
                  onChange={(e) => setPriceBRL(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Platform / Format Tag Options */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Tag className="h-3.5 w-3.5 text-zinc-400" />
                <span>{t.modal.platform}</span>
              </label>
            </div>

            {/* Platform Presets Chips */}
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const isSelected = platform === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPlatform(isSelected ? '' : preset)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'border border-white/20 bg-zinc-200 text-zinc-950 font-semibold'
                        : 'border border-white/[0.08] bg-zinc-800/60 text-zinc-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder={t.modal.platformPlaceholder}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
            />
          </div>

          {/* Section: 2. Ratings & Personal Notes */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400/30" />
                <span className="text-xs font-semibold text-white">
                  {t.ratingsAndNotesSection}
                </span>
              </div>
              {rating !== undefined && (
                <button
                  type="button"
                  onClick={() => setRating(undefined)}
                  className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  {locale === 'pt-BR' ? 'Limpar nota' : 'Clear rating'}
                </button>
              )}
            </div>

            {/* Interactive 5-Star Rating Picker */}
            <div className="mb-3.5 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const activeVal = hoverRating ?? rating ?? 0;
                const isFilled = starValue <= activeVal;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(rating === starValue ? undefined : starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(undefined)}
                    aria-label={`Rate ${starValue} star`}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs text-zinc-400">
                {rating ? `${rating} / 5` : t.unrated}
              </span>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <MessageSquare className="h-3 w-3 text-zinc-400" />
                <span>{t.modal.notes}</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.modal.notesPlaceholder}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Status & Currently Consuming & Completion Date */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {t.modal.status}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('backlog')}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    status === 'backlog'
                      ? 'border-white/20 bg-zinc-800 text-white'
                      : 'border-white/[0.08] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.backlogTab}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('consumed');
                    setIsCurrentlyConsuming(false);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    status === 'consumed'
                      ? 'border-white/20 bg-zinc-800 text-white'
                      : 'border-white/[0.08] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.consumedTab}
                </button>
              </div>
            </div>

            {/* Conditional Right Field: In Progress check for Backlog, or Date Completed for Consumed */}
            {status === 'consumed' ? (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Calendar className="h-3 w-3 text-zinc-400" />
                  <span>{t.modal.completedDate}</span>
                </label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-1.5 text-xs text-white focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />
              </div>
            ) : (
              type !== 'movies' && (
                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-medium text-zinc-200">
                    <input
                      type="checkbox"
                      checked={isCurrentlyConsuming}
                      onChange={(e) => setIsCurrentlyConsuming(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-emerald-500"
                    />
                    <span>{t.modal.setCurrentlyConsuming}</span>
                  </label>
                </div>
              )
            )}
          </div>

          {/* Cover Section: Preview + Upload + URL */}
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-200">
                  {t.modal.coverSection}
                </span>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    title="Reset to default cover"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{locale === 'pt-BR' ? 'Remover capa' : 'Clear cover'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* 2:3 Poster Preview */}
              <div className="mx-auto flex flex-col items-center sm:mx-0">
                <div className="relative h-[160px] w-[107px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-md">
                  <img
                    src={previewCover}
                    alt="Cover preview"
                    onError={(e) => {
                      const fallback = createPosterSvgDataUrl(
                        title || 'Preview',
                        year,
                        type
                      );
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="mt-1.5 text-[10px] text-zinc-400">
                  {locale === 'pt-BR' ? 'Pré-visualização' : 'Live Preview'}
                </span>
              </div>

              {/* Upload Local File & Direct URL */}
              <div className="min-w-0 flex-1 space-y-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {t.modal.uploadFile}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-zinc-700/80 hover:text-white"
                  >
                    <Upload className="h-4 w-4 text-zinc-400" />
                    <span>
                      {compressing
                        ? locale === 'pt-BR'
                          ? 'Comprimindo...'
                          : 'Compressing...'
                        : t.modal.chooseFile}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {t.modal.pasteUrl}
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={coverImage.startsWith('data:') ? '' : coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder={t.modal.urlPlaceholder}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-2 pr-3 pl-9 text-xs text-white placeholder-zinc-400 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-zinc-800/60 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              className="rounded-xl border border-white/20 bg-zinc-100 px-5 py-2 text-xs font-medium text-zinc-950 transition-colors hover:bg-white"
            >
              {editingItem ? t.modal.saveChanges : t.modal.createItem}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
