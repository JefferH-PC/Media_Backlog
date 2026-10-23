import { AppDatabase, MediaItem } from '@/types/backlog';

export const exportDatabaseJSON = (db: AppDatabase): AppDatabase => {
  const updatedDb: AppDatabase = {
    ...db,
    lastBackupDate: new Date().toISOString(),
  };
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(updatedDb, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStamp = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backlog-backup-${dateStamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  return updatedDb;
};

export const validateBackupJSON = (data: unknown): data is AppDatabase => {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  if (!Array.isArray(candidate.games)) return false;
  if (!Array.isArray(candidate.movies)) return false;
  if (!Array.isArray(candidate.series)) return false;
  if (!Array.isArray(candidate.books)) return false;

  const isValidItem = (item: unknown, expectedType: string): boolean => {
    if (!item || typeof item !== 'object') return false;
    const obj = item as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.title === 'string' &&
      obj.type === expectedType &&
      (obj.status === 'backlog' || obj.status === 'consumed')
    );
  };

  return (
    candidate.games.every((g) => isValidItem(g, 'games')) &&
    candidate.movies.every((m) => isValidItem(m, 'movies')) &&
    candidate.series.every((s) => isValidItem(s, 'series')) &&
    candidate.books.every((b) => isValidItem(b, 'books'))
  );
};

export const mergeDatabases = (
  current: AppDatabase,
  incoming: AppDatabase
): { merged: AppDatabase; addedCount: number } => {
  let addedCount = 0;

  const mergeCategory = <T extends MediaItem>(
    existingList: T[],
    incomingList: T[],
    allowActiveSlot: boolean
  ): T[] => {
    const result = [...existingList];
    const hasActive = result.some((item) => item.isCurrentlyConsuming);
    let slotUsed = hasActive;

    for (const item of incomingList) {
      const normalizedTitle = item.title.trim().toLowerCase();
      const duplicate = result.some(
        (existing) =>
          existing.id === item.id ||
          existing.title.trim().toLowerCase() === normalizedTitle
      );

      if (!duplicate) {
        const shouldBeActive =
          allowActiveSlot &&
          item.status === 'backlog' &&
          item.isCurrentlyConsuming &&
          !slotUsed;
        if (shouldBeActive) {
          slotUsed = true;
        }
        result.push({
          ...item,
          isCurrentlyConsuming: shouldBeActive,
        });
        addedCount++;
      }
    }

    return result;
  };

  const merged: AppDatabase = {
    version: 1,
    lastBackupDate: incoming.lastBackupDate || current.lastBackupDate,
    games: mergeCategory(current.games, incoming.games, true),
    movies: mergeCategory(current.movies, incoming.movies, false),
    series: mergeCategory(current.series, incoming.series, true),
    books: mergeCategory(current.books, incoming.books, true),
  };

  return { merged, addedCount };
};
