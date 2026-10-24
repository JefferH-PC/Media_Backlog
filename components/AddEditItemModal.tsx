'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Gamepad2,
  Film,
  Tv,
  BookOpen,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  Check,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ItemStatus,
  Locale,
  MediaItem,
  MediaType,
} from '@/types/backlog';
import { translations } from '@/utils/i18n';
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

  // Image suggestions pool and loading/error states
  const [rawSuggestions, setRawSuggestions] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // Active suggestions: up to 3 valid, non-failed images
  const displayedSuggestions = rawSuggestions
    .filter((url) => !failedImages.has(url))
    .slice(0, 3);

  // Track if user explicitly supplied custom image (upload or typed URL)
  const isManualCoverRef = useRef(false);
  // Request tracking to prevent out-of-order race conditions
  const activeReqIdRef = useRef(0);

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
      isManualCoverRef.current = Boolean(editingItem.coverImage);

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
      isManualCoverRef.current = false;
      setDeveloper('');
      setAchievements('0');
      setPriceBRL('0.00');
      setDuration('2h 00m');
      setSeasons('1');
      setAuthor('');
      setPublisher('');
      setRawSuggestions([]);
      setFailedImages(new Set());
      setLoadedImages(new Set());
    }
  }, [isOpen, editingItem, initialCategory]);

  const fetchPosterSuggestions = useCallback(
    async (searchTitle: string, mediaType: MediaType, forceAutoSelect = false) => {
      const trimmed = searchTitle.trim();
      if (trimmed.length < 2) {
        setRawSuggestions([]);
        setFailedImages(new Set());
        setLoadedImages(new Set());
        return;
      }

      const reqId = ++activeReqIdRef.current;
      setLoadingSuggestions(true);

      try {
        const res = await fetch(
          `/api/suggest-images?q=${encodeURIComponent(trimmed)}&type=${encodeURIComponent(mediaType)}`
        );

        if (reqId !== activeReqIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          const imgs: string[] = Array.isArray(data.images) ? data.images : [];
          setRawSuggestions(imgs);
          setFailedImages(new Set());
          setLoadedImages(new Set());

          // Auto-select the top suggested image if user hasn't manually customized it
          if (imgs.length > 0 && (!isManualCoverRef.current || forceAutoSelect)) {
            setCoverImage(imgs[0]);
          }
        } else {
          setRawSuggestions([]);
          setFailedImages(new Set());
          setLoadedImages(new Set());
        }
      } catch {
        if (reqId === activeReqIdRef.current) {
          setRawSuggestions([]);
          setFailedImages(new Set());
          setLoadedImages(new Set());
        }
      } finally {
        if (reqId === activeReqIdRef.current) {
          setLoadingSuggestions(false);
        }
      }
    },
    []
  );

  // Debounced auto-suggest as title changes
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setRawSuggestions([]);
      setFailedImages(new Set());
      setLoadedImages(new Set());
      return;
    }

    const timer = setTimeout(() => {
      fetchPosterSuggestions(trimmed, type);
    }, 350);

    return () => clearTimeout(timer);
  }, [title, type, isOpen, fetchPosterSuggestions]);

  // Handle broken/failing image URL: remove it immediately so no empty card is exhibited
  const handleImageError = useCallback(
    (failedUrl: string) => {
      setFailedImages((prev) => {
        const next = new Set(prev);
        next.add(failedUrl);
        return next;
      });

      // If the currently selected cover was this failed image, auto-switch to next valid candidate
      setCoverImage((current) => {
        if (current === failedUrl) {
          const remaining = rawSuggestions.filter(
            (url) => url !== failedUrl && !failedImages.has(url)
          );
          return remaining.length > 0 ? remaining[0] : '';
        }
        return current;
      });
    },
    [rawSuggestions, failedImages]
  );

  const handleImageLoad = useCallback((loadedUrl: string) => {
    setLoadedImages((prev) => {
      const next = new Set(prev);
      next.add(loadedUrl);
      return next;
    });
  }, []);

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
      isManualCoverRef.current = true;
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

    const now = new Date().toISOString();
    const finalCover =
      coverImage.trim() ||
      createPosterSvgDataUrl(
        cleanTitle,
        year.trim() || String(new Date().getFullYear()),
        type.toUpperCase()
      );

    const baseFields = {
      id: editingItem ? editingItem.id : generateId(),
      title: cleanTitle,
      coverImage: finalCover,
      year:
        type === 'series'
          ? year.trim() || String(new Date().getFullYear())
          : Number(year) || new Date().getFullYear(),
      status,
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
      type.toUpperCase()
    );

  const categoryButtons: { id: MediaType; label: string; icon: React.ElementType }[] = [
    { id: 'games', label: t.slotLabels.games, icon: Gamepad2 },
    { id: 'movies', label: t.slotLabels.movies, icon: Film },
    { id: 'series', label: t.slotLabels.series, icon: Tv },
    { id: 'books', label: t.slotLabels.books, icon: BookOpen },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F11]/80 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#2A2F37] bg-[#1F2329] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[#2A2F37] pb-4">
          <h2 id="modal-title" className="text-base font-bold text-[#F3F4F6]">
            {editingItem ? t.modal.editTitle : t.modal.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#16191D] hover:text-[#F3F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Media Category Selector */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#9CA3AF]">
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
                      if (!isManualCoverRef.current) {
                        setCoverImage('');
                      }
                      if (title.trim().length >= 2) {
                        fetchPosterSuggestions(title, newType, true);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      active
                        ? 'border-[#10B981] bg-[#064E3B] text-[#6EE7B7] shadow-sm'
                        : 'border-[#2A2F37] bg-[#16191D] text-[#9CA3AF] hover:border-[#3B424D] hover:text-[#F3F4F6]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Release Year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                {t.modal.title} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.modal.titlePlaceholder}
                className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
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
                className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Category-Specific Fields */}
          {type === 'games' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  {t.modal.developer}
                </label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder={t.modal.developerPlaceholder}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  {t.modal.achievements} 🏆
                </label>
                <input
                  type="number"
                  min={0}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#9CA3AF]">
                  <span>{t.modal.priceBRL}</span>
                  <span className="text-[11px] font-normal text-[#6EE7B7]">
                    {formatBRL(parseNumericPrice(priceBRL))}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={priceBRL}
                  onChange={(e) => setPriceBRL(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] focus:border-[#10B981] focus:outline-none"
                />
              </div>
            </div>
          )}

          {type === 'movies' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                {t.modal.duration} ⏱
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t.modal.durationPlaceholder}
                className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
              />
            </div>
          )}

          {type === 'series' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                {t.modal.seasons} 📺
              </label>
              <input
                type="number"
                min={1}
                value={seasons}
                onChange={(e) => setSeasons(e.target.value)}
                className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] focus:border-[#10B981] focus:outline-none"
              />
            </div>
          )}

          {type === 'books' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  {t.modal.author}
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t.modal.authorPlaceholder}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                  {t.modal.publisher}
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder={t.modal.publisherPlaceholder}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/60 focus:border-[#10B981] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#9CA3AF]">
                  <span>{t.modal.priceBRL}</span>
                  <span className="text-[11px] font-normal text-[#6EE7B7]">
                    {formatBRL(parseNumericPrice(priceBRL))}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={priceBRL}
                  onChange={(e) => setPriceBRL(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2F37] bg-[#16191D] px-3.5 py-2 text-xs text-[#F3F4F6] focus:border-[#10B981] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Status & Currently Consuming Row */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#2A2F37] bg-[#16191D] p-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#9CA3AF]">
                {t.modal.status}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('backlog')}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    status === 'backlog'
                      ? 'border-[#10B981] bg-[#064E3B] text-[#6EE7B7]'
                      : 'border-[#2A2F37] bg-[#0D0F11] text-[#9CA3AF]'
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
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    status === 'consumed'
                      ? 'border-[#10B981] bg-[#064E3B] text-[#6EE7B7]'
                      : 'border-[#2A2F37] bg-[#0D0F11] text-[#9CA3AF]'
                  }`}
                >
                  {t.consumedTab}
                </button>
              </div>
            </div>

            {type !== 'movies' && status === 'backlog' && (
              <div className="flex items-center pt-2 sm:pt-5">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#F3F4F6]">
                  <input
                    type="checkbox"
                    checked={isCurrentlyConsuming}
                    onChange={(e) => setIsCurrentlyConsuming(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2A2F37] bg-[#0D0F11] accent-[#10B981]"
                  />
                  <span>{t.modal.setCurrentlyConsuming}</span>
                </label>
              </div>
            )}
          </div>

          {/* Poster Cover Section: 3 Auto-Suggestions + Live Preview + Upload + URL */}
          <div className="rounded-xl border border-[#2A2F37] bg-[#16191D] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#10B981]" />
                <span className="text-xs font-semibold text-[#F3F4F6]">
                  {t.modal.coverSection}
                </span>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage('');
                      isManualCoverRef.current = false;
                    }}
                    title="Reset to default SVG"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-[#9CA3AF] transition-colors hover:bg-[#2A2F37] hover:text-[#EF4444]"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{locale === 'pt-BR' ? 'Remover capa' : 'Clear cover'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={title.trim().length < 2 || loadingSuggestions}
                onClick={() => fetchPosterSuggestions(title, type, true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2A2F37] bg-[#1F2329] px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] transition-colors hover:border-[#3B424D] hover:text-[#F3F4F6] disabled:opacity-40"
              >
                <RefreshCw
                  className={`h-3 w-3 ${loadingSuggestions ? 'animate-spin text-[#10B981]' : ''}`}
                />
                <span>{t.modal.refreshSuggestions}</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Live 2:3 Poster Preview */}
              <div className="mx-auto flex flex-col items-center sm:mx-0">
                <div className="relative h-[160px] w-[107px] shrink-0 overflow-hidden rounded-xl border border-[#2A2F37] bg-[#0D0F11] shadow-lg">
                  {loadingSuggestions && !coverImage ? (
                    <div className="relative flex h-full w-full animate-pulse flex-col items-center justify-center bg-[#1F2329]">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F11] via-transparent to-transparent" />
                      <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
                      <span className="mt-2 text-[10px] font-medium text-[#9CA3AF]">
                        {locale === 'pt-BR' ? 'Buscando...' : 'Searching...'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={previewCover}
                      alt="Cover preview"
                      onError={(e) => {
                        if (coverImage) {
                          handleImageError(coverImage);
                        } else {
                          const fallback = createPosterSvgDataUrl(
                            title || 'Poster',
                            year,
                            type
                          );
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }
                      }}
                      className="h-full w-full object-cover transition-opacity duration-300"
                    />
                  )}
                </div>
                <span className="mt-1.5 text-[10px] font-medium text-[#9CA3AF]">
                  {locale === 'pt-BR' ? 'Pré-visualização' : 'Live Preview'}
                </span>
              </div>

              {/* Right Column: 3 Auto-Suggestions + Upload + Direct URL */}
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-medium text-[#9CA3AF]">
                      {t.modal.suggestCovers}
                    </p>
                    {loadingSuggestions && (
                      <span className="flex items-center gap-1.5 text-[10px] text-[#10B981]">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>{t.modal.fetchingSuggestions}</span>
                      </span>
                    )}
                  </div>

                  {/* Exactly 3 Suggestions Grid or 3 Skeletons */}
                  {loadingSuggestions ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={`sugg-skeleton-${i}`}
                          className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[#2A2F37] bg-[#16191D] animate-pulse shadow-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-[#2A2F37]/30 via-transparent to-[#0D0F11]/80" />
                          <div className="absolute top-2 left-2 h-4 w-4 rounded bg-[#2A2F37]/60" />
                          <div className="absolute bottom-2.5 left-2 right-2 h-2 rounded bg-[#2A2F37]/70" />
                        </div>
                      ))}
                    </div>
                  ) : displayedSuggestions.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {displayedSuggestions.map((imgUrl, idx) => {
                        const isSelected = coverImage === imgUrl;
                        const isLoaded = loadedImages.has(imgUrl);

                        return (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() => {
                              setCoverImage(imgUrl);
                              isManualCoverRef.current = false;
                            }}
                            title={`Option ${idx + 1}`}
                            className={`group relative aspect-[2/3] overflow-hidden rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? 'border-2 border-[#10B981] ring-2 ring-[#10B981]/25 shadow-xl shadow-[#10B981]/20 scale-[1.02]'
                                : 'border-[#2A2F37] bg-[#0D0F11] hover:border-[#6EE7B7]/70 hover:scale-[1.03]'
                            }`}
                          >
                            {/* Subtle shimmer until image bit renders */}
                            {!isLoaded && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#16191D] animate-pulse">
                                <div className="h-4 w-4 rounded-full border-2 border-[#2A2F37] border-t-[#10B981] animate-spin" />
                              </div>
                            )}

                            <img
                              src={imgUrl}
                              alt={`Suggestion ${idx + 1}`}
                              onLoad={() => handleImageLoad(imgUrl)}
                              onError={() => handleImageError(imgUrl)}
                              className={`h-full w-full object-cover transition-opacity duration-300 ${
                                isLoaded ? 'opacity-100' : 'opacity-0'
                              }`}
                            />

                            {/* Option Index Badge */}
                            <div className="absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-sm bg-[#0D0F11]/80 text-[10px] font-bold text-[#F3F4F6] backdrop-blur-xs">
                              {idx + 1}
                            </div>

                            {/* Selected Checkmark Overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#0D0F11]/40 backdrop-blur-[0.5px]">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-[#0D0F11] shadow-md">
                                  <Check className="h-4 w-4 stroke-[3]" />
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-[#2A2F37] bg-[#0D0F11]/40 px-3 text-center text-xs text-[#9CA3AF]">
                      <p>
                        {title.trim().length < 2
                          ? t.modal.typeToSuggest
                          : t.modal.noSuggestions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Local File & Direct URL */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
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
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#2A2F37] bg-[#1F2329] px-3 py-1.5 text-xs font-medium text-[#F3F4F6] transition-colors hover:border-[#3B424D]"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#10B981]" />
                      <span>
                        {compressing ? '...' : t.modal.chooseFile}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#9CA3AF]">
                      {t.modal.pasteUrl}
                    </label>
                    <div className="relative">
                      <LinkIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={
                          coverImage.startsWith('data:') ? '' : coverImage
                        }
                        onChange={(e) => {
                          setCoverImage(e.target.value);
                          isManualCoverRef.current = Boolean(e.target.value.trim());
                        }}
                        placeholder={t.modal.urlPlaceholder}
                        className="w-full rounded-lg border border-[#2A2F37] bg-[#0D0F11] py-1.5 pr-2.5 pl-8 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:border-[#10B981] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-[#2A2F37] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#2A2F37] bg-[#16191D] px-4 py-2 text-xs font-semibold text-[#9CA3AF] transition-colors hover:text-[#F3F4F6]"
            >
              {t.modal.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#10B981] px-5 py-2 text-xs font-semibold text-[#0D0F11] transition-colors hover:bg-[#059669]"
            >
              {editingItem ? t.modal.saveChanges : t.modal.createItem}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
