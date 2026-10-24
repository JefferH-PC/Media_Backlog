'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppDatabase,
  MediaItem,
  MediaType,
  GameItem,
  MovieItem,
  SeriesItem,
  BookItem,
} from '@/types/backlog';
import { validateBackupJSON, mergeDatabases, exportDatabaseJSON } from '@/utils/backup';
import { getDemoDatabase } from '@/utils/demoData';
import { idbGet, idbSet } from '@/utils/indexedDB';

export const STORAGE_KEY = 'app_media_backlog_v1';

const DEFAULT_DATABASE: AppDatabase = {
  version: 1,
  games: [],
  movies: [],
  series: [],
  books: [],
};

export function useBacklogStorage() {
  const [db, setDb] = useState<AppDatabase>(DEFAULT_DATABASE);
  const [isHydrated, setIsHydrated] = useState(false);
  const dbRef = useRef<AppDatabase>(DEFAULT_DATABASE);

  // Keep dbRef in sync with state
  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Load and migrate from IndexedDB or legacy localStorage on mount
  useEffect(() => {
    let isCancelled = false;

    async function initStorage() {
      try {
        // 1. Try IndexedDB first
        const idbData = await idbGet<AppDatabase>(STORAGE_KEY);
        if (!isCancelled && idbData && validateBackupJSON(idbData)) {
          const loadedDb: AppDatabase = {
            version: 1,
            lastBackupDate: idbData.lastBackupDate,
            games: idbData.games || [],
            movies: idbData.movies || [],
            series: idbData.series || [],
            books: idbData.books || [],
          };
          setDb(loadedDb);
          setIsHydrated(true);
          return;
        }

        // 2. Migration from legacy localStorage if IndexedDB is empty
        if (typeof window !== 'undefined') {
          const legacyRaw = window.localStorage.getItem(STORAGE_KEY);
          if (legacyRaw) {
            const parsed = JSON.parse(legacyRaw);
            if (validateBackupJSON(parsed)) {
              const loadedDb: AppDatabase = {
                version: 1,
                lastBackupDate: parsed.lastBackupDate,
                games: parsed.games || [],
                movies: parsed.movies || [],
                series: parsed.series || [],
                books: parsed.books || [],
              };
              if (!isCancelled) {
                setDb(loadedDb);
                // Save to IndexedDB for seamless migration
                await idbSet(STORAGE_KEY, loadedDb);
              }
              setIsHydrated(true);
              return;
            }
          }
        }

        // 3. Fallback default
        if (!isCancelled) {
          setDb(DEFAULT_DATABASE);
          await idbSet(STORAGE_KEY, DEFAULT_DATABASE);
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
      } finally {
        if (!isCancelled) {
          setIsHydrated(true);
        }
      }
    }

    initStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Persist to IndexedDB helper
  const saveDb = useCallback((updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      idbSet(STORAGE_KEY, next).catch((err) => {
        console.error('Failed to persist to IndexedDB:', err);
      });
      return next;
    });
  }, []);

  const addItem = useCallback(
    (item: MediaItem) => {
      saveDb((prev) => {
        const now = new Date().toISOString();
        const canConsume =
          item.type !== 'movies' &&
          item.status === 'backlog' &&
          Boolean(item.isCurrentlyConsuming);

        const normalizedItem: MediaItem = {
          ...item,
          isCurrentlyConsuming: canConsume,
          completedAt:
            item.status === 'consumed'
              ? item.completedAt || now
              : undefined,
          createdAt: item.createdAt || now,
          updatedAt: now,
        };

        const updateCategoryList = <T extends MediaItem>(list: T[]): T[] => {
          const cleared = canConsume
            ? list.map((existing) => ({ ...existing, isCurrentlyConsuming: false }))
            : list;
          return [normalizedItem as T, ...cleared];
        };

        switch (normalizedItem.type) {
          case 'games':
            return { ...prev, games: updateCategoryList<GameItem>(prev.games) };
          case 'movies':
            return { ...prev, movies: updateCategoryList<MovieItem>(prev.movies) };
          case 'series':
            return { ...prev, series: updateCategoryList<SeriesItem>(prev.series) };
          case 'books':
            return { ...prev, books: updateCategoryList<BookItem>(prev.books) };
        }
      });
    },
    [saveDb]
  );

  const updateItem = useCallback(
    (updatedItem: MediaItem) => {
      saveDb((prev) => {
        const now = new Date().toISOString();
        const canConsume =
          updatedItem.type !== 'movies' &&
          updatedItem.status === 'backlog' &&
          Boolean(updatedItem.isCurrentlyConsuming);

        const finalItem: MediaItem = {
          ...updatedItem,
          isCurrentlyConsuming: canConsume,
          completedAt:
            updatedItem.status === 'consumed'
              ? updatedItem.completedAt || now
              : undefined,
          updatedAt: now,
        };

        // Remove from all categories first in case user switched category
        const cleaned: AppDatabase = {
          ...prev,
          games: prev.games.filter((g) => g.id !== finalItem.id),
          movies: prev.movies.filter((m) => m.id !== finalItem.id),
          series: prev.series.filter((s) => s.id !== finalItem.id),
          books: prev.books.filter((b) => b.id !== finalItem.id),
        };

        const insertIntoList = <T extends MediaItem>(
          originalList: T[],
          filteredList: T[]
        ): T[] => {
          const baseList = canConsume
            ? filteredList.map((existing) => ({
                ...existing,
                isCurrentlyConsuming: false,
              }))
            : filteredList;

          const existedInSameCategory = originalList.some(
            (existing) => existing.id === finalItem.id
          );

          if (existedInSameCategory) {
            return originalList.map((existing) =>
              existing.id === finalItem.id
                ? (finalItem as T)
                : canConsume
                ? { ...existing, isCurrentlyConsuming: false }
                : existing
            );
          }

          return [finalItem as T, ...baseList];
        };

        switch (finalItem.type) {
          case 'games':
            return {
              ...cleaned,
              games: insertIntoList<GameItem>(prev.games, cleaned.games),
            };
          case 'movies':
            return {
              ...cleaned,
              movies: insertIntoList<MovieItem>(prev.movies, cleaned.movies),
            };
          case 'series':
            return {
              ...cleaned,
              series: insertIntoList<SeriesItem>(prev.series, cleaned.series),
            };
          case 'books':
            return {
              ...cleaned,
              books: insertIntoList<BookItem>(prev.books, cleaned.books),
            };
        }
      });
    },
    [saveDb]
  );

  const deleteItem = useCallback(
    (type: MediaType, id: string) => {
      saveDb((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item.id !== id),
      }));
    },
    [saveDb]
  );

  const toggleItemStatus = useCallback(
    (type: MediaType, id: string) => {
      saveDb((prev) => {
        const now = new Date().toISOString();
        const updatedList = prev[type].map((item) => {
          if (item.id !== id) return item;
          const nextStatus = item.status === 'backlog' ? 'consumed' : 'backlog';
          return {
            ...item,
            status: nextStatus,
            completedAt:
              nextStatus === 'consumed'
                ? item.completedAt || now
                : undefined,
            isCurrentlyConsuming:
              nextStatus === 'consumed' ? false : item.isCurrentlyConsuming,
            updatedAt: now,
          };
        });
        return {
          ...prev,
          [type]: updatedList,
        };
      });
    },
    [saveDb]
  );

  const markAsConsumed = useCallback(
    (type: MediaType, id: string) => {
      saveDb((prev) => {
        const now = new Date().toISOString();
        const updatedList = prev[type].map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'consumed' as const,
                completedAt: item.completedAt || now,
                isCurrentlyConsuming: false,
                updatedAt: now,
              }
            : item
        );
        return {
          ...prev,
          [type]: updatedList,
        };
      });
    },
    [saveDb]
  );

  const setCurrentlyConsuming = useCallback(
    (type: 'games' | 'series' | 'books', id: string, active: boolean) => {
      saveDb((prev) => {
        const now = new Date().toISOString();
        const updatedList = prev[type].map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status: active ? ('backlog' as const) : item.status,
              isCurrentlyConsuming: active,
              updatedAt: now,
            };
          }
          return active ? { ...item, isCurrentlyConsuming: false } : item;
        });

        return {
          ...prev,
          [type]: updatedList,
        };
      });
    },
    [saveDb]
  );

  const getActiveItem = useCallback(
    (type: 'games' | 'series' | 'books') => {
      return db[type].find((item) => item.isCurrentlyConsuming) || null;
    },
    [db]
  );

  const exportBackup = useCallback(() => {
    saveDb((prev) => exportDatabaseJSON(prev));
  }, [saveDb]);

  const overwriteDatabase = useCallback(
    (incoming: AppDatabase) => {
      saveDb(() => ({
        version: 1,
        lastBackupDate: incoming.lastBackupDate || new Date().toISOString(),
        games: incoming.games || [],
        movies: incoming.movies || [],
        series: incoming.series || [],
        books: incoming.books || [],
      }));
    },
    [saveDb]
  );

  const mergeDatabase = useCallback(
    (incoming: AppDatabase): number => {
      let added = 0;
      const result = mergeDatabases(db, incoming);
      added = result.addedCount;
      saveDb(() => result.merged);
      return added;
    },
    [db, saveDb]
  );

  const loadDemoData = useCallback(() => {
    const demo = getDemoDatabase();
    saveDb(() => demo);
  }, [saveDb]);

  return {
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
  };
}
