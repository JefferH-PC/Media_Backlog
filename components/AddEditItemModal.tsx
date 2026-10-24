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

          {/* Poster Cover Section: Live Preview + Upload File + Direct URL */}
          <div className="rounded-xl border border-[#2A2F37] bg-[#16191D] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#10B981]" />
                <span className="text-xs font-semibold text-[#F3F4F6]">
                  {t.modal.coverSection}
                </span>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    title="Reset to default SVG"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-[#9CA3AF] transition-colors hover:bg-[#2A2F37] hover:text-[#EF4444]"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{locale === 'pt-BR' ? 'Remover capa' : 'Clear cover'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Live 2:3 Poster Preview */}
              <div className="mx-auto flex flex-col items-center sm:mx-0">
                <div className="relative h-[160px] w-[107px] shrink-0 overflow-hidden rounded-xl border border-[#2A2F37] bg-[#0D0F11] shadow-lg">
                  <img
                    src={previewCover}
                    alt="Cover preview"
                    onError={(e) => {
                      const fallback = createPosterSvgDataUrl(
                        title || 'Poster',
                        year,
                        type
                      );
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="h-full w-full object-cover transition-opacity duration-300"
                  />
                </div>
                <span className="mt-1.5 text-[10px] font-medium text-[#9CA3AF]">
                  {locale === 'pt-BR' ? 'Pré-visualização' : 'Live Preview'}
                </span>
              </div>

              {/* Right Column: Upload Local File & Direct URL */}
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A2F37] bg-[#1F2329] px-4 py-2.5 text-xs font-medium text-[#F3F4F6] transition-colors hover:border-[#3B424D] hover:bg-[#252A32]"
                  >
                    <Upload className="h-4 w-4 text-[#10B981]" />
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
                  <label className="mb-1.5 block text-xs font-medium text-[#9CA3AF]">
                    {t.modal.pasteUrl}
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      value={coverImage.startsWith('data:') ? '' : coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder={t.modal.urlPlaceholder}
                      className="w-full rounded-lg border border-[#2A2F37] bg-[#0D0F11] py-2 pr-3 pl-9 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:border-[#10B981] focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-[#9CA3AF]/80">
                  {locale === 'pt-BR'
                    ? 'Envie uma imagem do seu dispositivo ou cole um link direto. Se não definir uma capa, um pôster geométrico personalizado será gerado automaticamente.'
                    : 'Upload an image from your device or paste a direct image URL. If omitted, a custom geometric title poster will be generated automatically.'}
                </p>
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
