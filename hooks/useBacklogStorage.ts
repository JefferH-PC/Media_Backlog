'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Load and migrate/validate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validateBackupJSON(parsed)) {
          setDb({
            version: 1,
            lastBackupDate: parsed.lastBackupDate,
            games: parsed.games || [],
            movies: parsed.movies || [],
            series: parsed.series || [],
            books: parsed.books || [],
          });
        } else {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE));
        }
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE));
      }
    } catch (err) {
      console.error('Failed to read localStorage database:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage helper
  const saveDb = useCallback((updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist to localStorage:', err);
      }
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
          updatedAt: now,
        };

        // Remove from all categories first in case the user switched category during edit
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
