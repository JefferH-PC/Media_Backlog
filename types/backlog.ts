export type MediaType = 'games' | 'movies' | 'series' | 'books';
export type ItemStatus = 'backlog' | 'consumed';
export type Locale = 'en' | 'pt-BR';

export interface BaseMediaItem {
  id: string;
  title: string;
  coverImage: string; // Base64 compressed string or external URL
  year: number | string; // Numeric year (e.g. 2023) or year range for series (e.g. "2008-2013")
  status: ItemStatus; // 'backlog' (to consume) or 'consumed' (already finished)
  isCurrentlyConsuming: boolean; // Relevant for Games, Books, and Series
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export interface GameItem extends BaseMediaItem {
  type: 'games';
  developer: string;
  achievements: number;
  priceBRL: number; // Stored as a raw numeric float (e.g., 199.90)
}

export interface MovieItem extends BaseMediaItem {
  type: 'movies';
  duration: string; // e.g., "2h 15m" or total minutes
}

export interface SeriesItem extends BaseMediaItem {
  type: 'series';
  seasons: number;
}

export interface BookItem extends BaseMediaItem {
  type: 'books';
  author: string;
  publisher: string; // "Editora"
  priceBRL: number; // Stored as a raw numeric float (e.g., 54.90)
}

export type MediaItem = GameItem | MovieItem | SeriesItem | BookItem;

export interface AppDatabase {
  version: 1;
  lastBackupDate?: string;
  games: GameItem[];
  movies: MovieItem[];
  series: SeriesItem[];
  books: BookItem[];
}
