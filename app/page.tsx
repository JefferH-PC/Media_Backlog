'use client';

import React, { useState, useEffect } from 'react';
import {
  AppDatabase,
  BookItem,
  GameItem,
  ItemStatus,
  Locale,
  MediaItem,
  MediaType,
  SeriesItem,
} from '@/types/backlog';
import { useBacklogStorage } from '@/hooks/useBacklogStorage';
import { validateBackupJSON } from '@/utils/backup';
import { translations } from '@/utils/i18n';
import { Header } from '@/components/Header';
import { CurrentlyConsumingHero } from '@/components/CurrentlyConsumingHero';
import { CategorySection } from '@/components/CategorySection';
import { AddEditItemModal } from '@/components/AddEditItemModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ConfirmReplaceActiveModal } from '@/components/ConfirmReplaceActiveModal';
import { ImportConflictModal } from '@/components/ImportConflictModal';

const LOCALE_STORAGE_KEY = 'app_media_backlog_locale';

export default function HomePage() {
  const {
    db,
    isHydrated,
    addItem,
    updateItem,
    deleteItem,
    toggleItemStatus,
    markAsConsumed,
    setCurrentlyConsuming,
    getActiveItem,
    exportBackup,
    overwriteDatabase,
    mergeDatabase,
    loadDemoData,
  } = useBacklogStorage();

  const [locale, setLocale] = useState<Locale>('en');
  const [activeCategory, setActiveCategory] = useState<MediaType>('games');
  const [activeStatus, setActiveStatus] = useState<ItemStatus>('backlog');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MediaItem | null>(null);
  const [replacePrompt, setReplacePrompt] = useState<{
    current: MediaItem;
    next: MediaItem;
  } | null>(null);
  const [pendingImportDb, setPendingImportDb] = useState<AppDatabase | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale === 'en' || savedLocale === 'pt-BR') {
        setLocale(savedLocale);
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleToggleLocale = () => {
    setLocale((prev) => {
      const next = prev === 'en' ? 'pt-BR' : 'en';
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const t = translations[locale];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEditModal = (item: MediaItem) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  };

  const handleSaveItem = (item: MediaItem) => {
    if (editingItem) {
      updateItem(item);
    } else {
      addItem(item);
      setActiveCategory(item.type);
      setActiveStatus(item.status);
    }
  };

  const handleConsumeNow = (item: MediaItem) => {
    if (item.type === 'movies') return;

    // If already consuming this item, toggle it off
    if (item.isCurrentlyConsuming) {
      setCurrentlyConsuming(item.type, item.id, false);
      return;
    }

    const currentActive = getActiveItem(item.type);
    if (currentActive && currentActive.id !== item.id) {
      setReplacePrompt({ current: currentActive, next: item });
      return;
    }

    setCurrentlyConsuming(item.type, item.id, true);
  };

  const handleConfirmReplaceActive = (newItem: MediaItem) => {
    if (newItem.type !== 'movies') {
      setCurrentlyConsuming(newItem.type, newItem.id, true);
    }
    setReplacePrompt(null);
  };

  const handleConfirmDelete = (item: MediaItem) => {
    deleteItem(item.type, item.id);
    setDeletingItem(null);
  };

  const handleExport = () => {
    exportBackup();
    showToast(t.notifications.exported);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (validateBackupJSON(parsed)) {
          setPendingImportDb(parsed);
        } else {
          showToast(t.notifications.invalidJson);
        }
      } catch {
        showToast(t.notifications.invalidJson);
      }
    };
    reader.readAsText(file);
  };

  const handleOverwriteImport = (incoming: AppDatabase) => {
    overwriteDatabase(incoming);
    setPendingImportDb(null);
    showToast(t.notifications.importedOverwrite);
  };

  const handleMergeImport = (incoming: AppDatabase) => {
    const added = mergeDatabase(incoming);
    setPendingImportDb(null);
    showToast(t.notifications.importedMerge(added));
  };

  const handleLoadDemo = () => {
    loadDemoData();
    showToast(t.notifications.demoLoaded);
  };

  const activeGame = getActiveItem('games') as GameItem | null;
  const activeSeries = getActiveItem('series') as SeriesItem | null;
  const activeBook = getActiveItem('books') as BookItem | null;

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-xs text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] pb-20 text-zinc-100">
      <Header
        locale={locale}
        onToggleLocale={handleToggleLocale}
        onAddItemClick={handleOpenAddModal}
        onExportClick={handleExport}
        onImportFileSelected={handleImportFile}
        lastBackupDate={db.lastBackupDate}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-5 bottom-5 z-50 rounded-xl border border-white/10 bg-[#18181d] px-4 py-2.5 text-xs font-medium text-white shadow-xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      <main>
        {/* Hero Section: Currently Consuming (Games, Series, Books) */}
        <CurrentlyConsumingHero
          locale={locale}
          activeGame={activeGame}
          activeSeries={activeSeries}
          activeBook={activeBook}
          onMarkConsumed={(type, id) => markAsConsumed(type, id)}
          onRemoveFromActive={(type, id) =>
            setCurrentlyConsuming(type, id, false)
          }
        />

        {/* Category View & Horizontal Scroll Track */}
        <CategorySection
          db={db}
          locale={locale}
          activeCategory={activeCategory}
          activeStatus={activeStatus}
          searchQuery={searchQuery}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSearchQuery('');
          }}
          onToggleViewStatus={(status) => setActiveStatus(status)}
          onSearchChange={setSearchQuery}
          onToggleItemStatus={(item) => toggleItemStatus(item.type, item.id)}
          onConsumeNow={handleConsumeNow}
          onEditItem={handleOpenEditModal}
          onDeleteItem={(item) => setDeletingItem(item)}
          onAddItemForCurrentCategory={handleOpenAddModal}
          onLoadDemoData={handleLoadDemo}
        />
      </main>

      {/* Add / Edit Item Modal */}
      <AddEditItemModal
        isOpen={isAddEditOpen}
        locale={locale}
        initialCategory={activeCategory}
        editingItem={editingItem}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Deletion Confirmation Modal */}
      <ConfirmDeleteModal
        item={deletingItem}
        locale={locale}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Active Consuming Overwrite Modal */}
      <ConfirmReplaceActiveModal
        currentItem={replacePrompt?.current || null}
        newItem={replacePrompt?.next || null}
        locale={locale}
        onCancel={() => setReplacePrompt(null)}
        onConfirm={handleConfirmReplaceActive}
      />

      {/* Import JSON Conflict Modal */}
      <ImportConflictModal
        incomingDb={pendingImportDb}
        locale={locale}
        onCancel={() => setPendingImportDb(null)}
        onOverwrite={handleOverwriteImport}
        onMerge={handleMergeImport}
      />
    </div>
  );
}
