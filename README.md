# Personal Media Backlog Tracker

Minimalist, dark-themed personal backlog tracker for **Games**, **Movies**, **Series**, and **Books**. Built with Next.js (App Router), React 19, TypeScript, and Tailwind CSS.

## Key Features
- **Local-First Database (`localStorage`)**: Stores all records under `app_media_backlog_v1` with schema validation and zero external database dependencies.
- **"Currently Consuming" Hero Showcase**: Dedicated active focus slots for **Games**, **Series**, and **Books** with 1-click completion (`Mark Played`, `Mark Watched`, `Mark Read`).
- **Dynamic Category & Status Nomenclature**:
  - `Games` $\leftrightarrow$ `Played`
  - `Movies` $\leftrightarrow$ `Watched`
  - `Series` $\leftrightarrow$ `Watched`
  - `Books` $\leftrightarrow$ `Read`
- **2:3 Vertical Poster Cards**: Horizontal side-scrolling tracks, live title search, `pt-BR` (`R$`) currency formatting, and discreet `⋮` Edit/Delete menus.
- **Hybrid Poster Pipeline**:
  - `/api/suggest-images` serverless endpoint supporting TMDB, RAWG, and Google Books APIs with automatic key-free fallbacks (Steam Store Search, TVMaze, iTunes Search, OpenLibrary).
  - Client-side HTML5 Canvas WebP compressor (`300x450`, quality `0.75`).
  - Direct image URL support.
- **Resilient JSON Backup & Restore**: Full JSON export (`backlog-backup-YYYY-MM-DD.json`) and validated JSON import with **Merge** or **Overwrite** conflict resolution.
- **Bilingual Interface**: Instant `EN` / `PT-BR` switch in the header.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Optional Environment Variables (`.env.local`)
Even without API keys, `/api/suggest-images` automatically returns 5 cover suggestions using key-free public APIs. To use TMDB and RAWG as primary providers, create `.env.local`:

```env
TMDB_API_KEY=your_tmdb_api_key
RAWG_API_KEY=your_rawg_api_key
```
