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
  MessageSquare,
  Sparkles,
  Loader2,
  Check,
  Images,
  Search as SearchIcon,
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

interface LookupSuggestion {
  title: string;
  year?: string | number;
  coverImage: string;
  type: MediaType;
  developer?: string;
  author?: string;
  publisher?: string;
  duration?: string;
  seasons?: number;
  platform?: string;
  description?: string;
  images?: string[];
}

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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [type, setType] = useState<MediaType>(initialCategory);
  const [status, setStatus] = useState<ItemStatus>('backlog');
  const [isCurrentlyConsuming, setIsCurrentlyConsuming] = useState(false);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [coverImage, setCoverImage] = useState('');

  // Auto Lookup state
  const [suggestions, setSuggestions] = useState<LookupSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasManualCover, setHasManualCover] = useState(false);
  const [autoAppliedTitle, setAutoAppliedTitle] = useState<string | null>(null);

  // Cover Image Chooser state
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerSearch, setImagePickerSearch] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [customDiscoveredImages, setCustomDiscoveredImages] = useState<string[]>([]);

  // Completed date
  const [completedDate, setCompletedDate] = useState('');

  // Ratings & Notes (only active when editing an already consumed item)
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

    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
    setAutoAppliedTitle(null);
    setIsImagePickerOpen(false);
    setImagePickerSearch('');
    setIsSearchingImages(false);
    setCustomDiscoveredImages([]);

    if (editingItem) {
      setType(editingItem.type);
      setStatus(editingItem.status);
      setIsCurrentlyConsuming(Boolean(editingItem.isCurrentlyConsuming));
      setTitle(editingItem.title);
      setYear(String(editingItem.year));
      setCoverImage(editingItem.coverImage || '');
      setHasManualCover(Boolean(editingItem.coverImage));
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
      setHasManualCover(false);
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Automatic media lookup: debounced search on title input
  useEffect(() => {
    const trimmed = title.trim();
    if (!isOpen || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Skip if editing existing item and title hasn't changed
    if (editingItem && editingItem.title.trim().toLowerCase() === trimmed.toLowerCase()) {
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/media-lookup?type=${type}&q=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        const results: LookupSuggestion[] = data.results || [];

        if (!isCancelled) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);

          // Collect all discovered candidate images
          const foundImages: string[] = [];
          for (const r of results) {
            if (r.coverImage) foundImages.push(r.coverImage);
            if (Array.isArray(r.images)) {
              for (const img of r.images) {
                if (img) foundImages.push(img);
              }
            }
          }
          if (foundImages.length > 0) {
            setCustomDiscoveredImages((prev) => Array.from(new Set([...prev, ...foundImages])));
          }

          // Hybrid Auto-apply: if coverImage is empty or was auto-applied, automatically set the #1 match
          if (results.length > 0 && (!coverImage || !hasManualCover)) {
            const top = results[0];
            if (top.coverImage) {
              setCoverImage(top.coverImage);
              setAutoAppliedTitle(top.title);
            }
            if (top.year) setYear(String(top.year));
            if (type === 'games' && top.developer) setDeveloper(top.developer);
            if (type === 'movies' && top.duration) setDuration(top.duration);
            if (type === 'series' && top.seasons) setSeasons(String(top.seasons));
            if (type === 'books' && top.author) setAuthor(top.author);
            if (type === 'books' && top.publisher) setPublisher(top.publisher);
          }
        }
      } catch (err) {
        console.error('Auto lookup error:', err);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [title, type, isOpen, editingItem, hasManualCover, coverImage]);

  const fetchCandidateImages = async (searchQuery: string, searchType: MediaType) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;
    setIsSearchingImages(true);
    try {
      const res = await fetch(
        `/api/media-lookup?type=${searchType}&q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const results: LookupSuggestion[] = data.results || [];
      const found: string[] = [];
      for (const r of results) {
        if (r.coverImage) found.push(r.coverImage);
        if (Array.isArray(r.images)) {
          for (const img of r.images) {
            if (img) found.push(img);
          }
        }
      }
      if (suggestions.length === 0 && results.length > 0) {
        setSuggestions(results);
      }
      setCustomDiscoveredImages((prev) => Array.from(new Set([...prev, ...found])));
    } catch (err) {
      console.error('Error fetching candidate images:', err);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleOpenImagePicker = () => {
    const activeTitle = title.trim();
    setImagePickerSearch(activeTitle);
    setIsImagePickerOpen(true);

    const hasImagesAlready =
      customDiscoveredImages.length > 0 ||
      suggestions.some((s) => s.coverImage || (s.images && s.images.length > 0));

    if (!hasImagesAlready && activeTitle.length >= 2) {
      fetchCandidateImages(activeTitle, type);
    }
  };

  const handleSelectCoverImage = (imgUrl: string) => {
    setCoverImage(imgUrl);
    setHasManualCover(true);
    setAutoAppliedTitle(null);
    setIsImagePickerOpen(false);
  };

  const allCandidateImages = Array.from(
    new Set([
      ...(coverImage && coverImage.startsWith('http') ? [coverImage] : []),
      ...customDiscoveredImages,
      ...suggestions.flatMap((s) => [s.coverImage, ...(s.images || [])]).filter(Boolean),
    ])
  ).filter((img) => img && typeof img === 'string' && img.startsWith('http'));

  if (!isOpen) return null;

  const handleSelectSuggestion = (suggestion: LookupSuggestion) => {
    setTitle(suggestion.title);
    if (suggestion.coverImage) {
      setCoverImage(suggestion.coverImage);
    }
    setAutoAppliedTitle(suggestion.title);
    setHasManualCover(false);
    if (suggestion.year) setYear(String(suggestion.year));
    if (type === 'games' && suggestion.developer) setDeveloper(suggestion.developer);
    if (type === 'movies' && suggestion.duration) setDuration(suggestion.duration);
    if (type === 'series' && suggestion.seasons) setSeasons(String(suggestion.seasons));
    if (type === 'books' && suggestion.author) setAuthor(suggestion.author);
    if (type === 'books' && suggestion.publisher) setPublisher(suggestion.publisher);

    const suggestionImages = [suggestion.coverImage, ...(suggestion.images || [])].filter(Boolean) as string[];
    if (suggestionImages.length > 0) {
      setCustomDiscoveredImages((prev) => Array.from(new Set([...prev, ...suggestionImages])));
    }

    setShowSuggestions(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const webpBase64 = await compressImage(file, 300, 450, 0.75);
      setCoverImage(webpBase64);
      setHasManualCover(true);
      setAutoAppliedTitle(null);
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
      (coverImage || '').trim() ||
      createPosterSvgDataUrl(
        cleanTitle,
        String(parsedYear),
        type
      );

    // If adding a new item, status is strictly 'backlog' (evaluations occur when marking as consumed)
    const effectiveStatus: ItemStatus = editingItem ? status : 'backlog';

    const resolvedCompletedAt =
      effectiveStatus === 'consumed'
        ? completedDate
          ? new Date(completedDate + 'T12:00:00.000Z').toISOString()
          : now
        : undefined;

    const baseFields = {
      id: editingItem ? editingItem.id : generateId(),
      title: cleanTitle,
      year: parsedYear,
      status: effectiveStatus,
      coverImage: finalCover,
      platform: editingItem?.platform,
      // Ratings and notes are preserved only for already consumed items
      rating:
        effectiveStatus === 'consumed' && rating && rating > 0
          ? rating
          : undefined,
      notes: effectiveStatus === 'consumed' ? notes.trim() || undefined : undefined,
      completedAt: resolvedCompletedAt,
      isCurrentlyConsuming:
        type !== 'movies' && effectiveStatus === 'backlog'
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
    (coverImage || '').trim() ||
    createPosterSvgDataUrl(
      title.trim() || 'Preview',
      String(year).trim() || String(new Date().getFullYear()),
      type
    );

  const categoryButtons: { id: MediaType; label: string; icon: React.ElementType }[] = [
    { id: 'games', label: t.slotLabels.games, icon: Gamepad2 },
    { id: 'movies', label: t.slotLabels.movies, icon: Film },
    { id: 'series', label: t.slotLabels.series, icon: Tv },
    { id: 'books', label: t.slotLabels.books, icon: BookOpen },
  ];

  // Determine if this item is in edit mode and is already marked consumed
  const isEditingConsumed = Boolean(editingItem && editingItem.status === 'consumed');

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
                      // Clear suggestions for new category
                      setSuggestions([]);
                      setShowSuggestions(false);
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

          {/* Title and Year Fields with Autocomplete Dropdown */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
                <span>{t.modal.title} *</span>
                {autoAppliedTitle && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    <span>{t.autoLookup.applied}</span>
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (hasManualCover) setHasManualCover(false);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder={t.modal.titlePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2 pr-9 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                />

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : autoAppliedTitle ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : null}
                </div>
              </div>

              {/* Floating Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#16161b] p-1.5 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      <span>{t.autoLookup.suggestions}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {suggestions.map((item, idx) => (
                      <button
                        key={`${item.title}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.08]"
                      >
                        <div className="relative h-11 w-7.5 shrink-0 overflow-hidden rounded border border-white/10 bg-black/40">
                          <img
                            src={item.coverImage || createPosterSvgDataUrl(item.title, String(item.year || ''), type)}
                            alt={item.title}
                            onError={(e) => {
                              const fallback = createPosterSvgDataUrl(item.title, String(item.year || ''), type);
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white">
                            {item.title}
                          </p>
                          <p className="truncate text-[10px] text-zinc-400">
                            {type === 'games' && (
                              <span>
                                {item.year ? `${item.year} ` : ''}
                                {item.developer ? `· ${item.developer}` : ''}
                              </span>
                            )}
                            {type === 'movies' && (
                              <span>
                                {item.year ? `${item.year} ` : ''}
                                {item.duration ? `· ${item.duration}` : ''}
                              </span>
                            )}
                            {type === 'series' && (
                              <span>
                                {item.year ? `${item.year} ` : ''}
                                {item.seasons ? `· ${item.seasons === 1 ? '1 Season' : `${item.seasons} Seasons`}` : ''}
                              </span>
                            )}
                            {type === 'books' && (
                              <span>
                                {item.author ? `${item.author} ` : ''}
                                {item.year ? `· ${item.year}` : ''}
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Section: Ratings & Personal Notes - ONLY shown when editing an ALREADY CONSUMED item */}
          {isEditingConsumed && (
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
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
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
          )}

          {/* Currently Consuming or Completed Date */}
          {editingItem ? (
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
          ) : (
            /* When adding a new item: optional In-Progress focus switch */
            type !== 'movies' && (
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-3.5">
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

          {/* Cover Section: Preview + Upload + URL (Automatic Cover is prioritized) */}
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
                    onClick={() => {
                      setCoverImage('');
                      setHasManualCover(true);
                      setAutoAppliedTitle(null);
                    }}
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
              {/* 2:3 Poster Preview - Clickable to choose other images */}
              <div className="mx-auto flex flex-col items-center sm:mx-0">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleOpenImagePicker}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenImagePicker();
                    }
                  }}
                  title={t.imagePicker.clickToChange}
                  aria-label={t.imagePicker.clickToChange}
                  className="group relative h-[160px] w-[107px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-md transition-all duration-200 hover:border-white/30 hover:shadow-xl hover:shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <img
                    src={previewCover}
                    alt="Cover preview"
                    onError={(e) => {
                      const fallback = createPosterSvgDataUrl(
                        title || 'Preview',
                        String(year),
                        type
                      );
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 p-2 text-center opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                    <Images className="h-5 w-5 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-semibold text-white leading-tight">
                      {t.imagePicker.changeCover}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenImagePicker}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-zinc-700 hover:text-white"
                >
                  <Images className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.imagePicker.changeCover}</span>
                </button>
                <span className="mt-1 text-[10px] text-zinc-400">
                  {locale === 'pt-BR' ? 'Pré-visualização' : 'Live Preview'}
                </span>
              </div>

              {/* Upload Local File & Direct URL (Optional Overrides) */}
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
                      onChange={(e) => {
                        setCoverImage(e.target.value);
                        setHasManualCover(true);
                        setAutoAppliedTitle(null);
                      }}
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

        {/* Modal: Interactive Recommendation Cover Image Chooser */}
        {isImagePickerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-picker-title"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#141418] p-5 shadow-2xl">
              {/* Image Picker Header */}
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-800/60">
                    <Images className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 id="image-picker-title" className="text-sm font-semibold text-white">
                      {t.imagePicker.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {t.imagePicker.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImagePickerOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar inside Image Chooser */}
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={imagePickerSearch}
                    onChange={(e) => setImagePickerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchCandidateImages(imagePickerSearch, type);
                      }
                    }}
                    placeholder={t.imagePicker.searchPlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-2 pr-3 pl-8 text-xs text-white placeholder-zinc-500 focus:border-white/20 focus:ring-1 focus:ring-white/20 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchCandidateImages(imagePickerSearch, type)}
                  disabled={isSearchingImages || !imagePickerSearch.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
                >
                  {isSearchingImages ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                  ) : (
                    <SearchIcon className="h-3.5 w-3.5" />
                  )}
                  <span>{locale === 'pt-BR' ? 'Buscar' : 'Search'}</span>
                </button>
              </div>

              {/* Status & Count info */}
              <div className="mb-3 flex items-center justify-between px-0.5 text-[11px] text-zinc-400">
                <span>{t.imagePicker.foundCount(allCandidateImages.length)}</span>
                {isSearchingImages && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t.imagePicker.loading}</span>
                  </span>
                )}
              </div>

              {/* Candidate Images Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                {isSearchingImages && allCandidateImages.length === 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 py-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div
                        key={n}
                        className="aspect-[2/3] animate-pulse rounded-xl border border-white/5 bg-zinc-900/50"
                      />
                    ))}
                  </div>
                ) : allCandidateImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 py-1">
                    {allCandidateImages.map((imgUrl, idx) => {
                      const isSelected = coverImage === imgUrl;
                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectCoverImage(imgUrl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectCoverImage(imgUrl);
                            }
                          }}
                          className={`group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/15'
                              : 'border-white/10 bg-black/40 hover:border-white/30 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Candidate cover ${idx + 1}`}
                            onError={(e) => {
                              // If image fails, hide its container cleanly
                              const parent = e.currentTarget.parentElement;
                              if (parent) parent.style.display = 'none';
                            }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Selected Pill Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-950/90 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 shadow-md backdrop-blur-md">
                              <Check className="h-3 w-3" />
                              <span>{t.imagePicker.selected}</span>
                            </div>
                          )}

                          {/* Hover Vignette Overlay */}
                          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <span className="rounded-lg border border-white/20 bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-md">
                              {isSelected ? t.imagePicker.selected : t.imagePicker.selectImage}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="mb-2 h-8 w-8 text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-300">
                      {t.imagePicker.noImages}
                    </p>
                    <p className="mt-1 max-w-xs text-[11px] text-zinc-500">
                      {t.imagePicker.noImagesSub}
                    </p>
                  </div>
                )}
              </div>

              {/* Image Picker Footer */}
              <div className="mt-4 flex items-center justify-end border-t border-white/[0.08] pt-3">
                <button
                  type="button"
                  onClick={() => setIsImagePickerOpen(false)}
                  className="rounded-xl border border-white/10 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  {t.imagePicker.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
