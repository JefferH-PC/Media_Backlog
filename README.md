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
- **Client-Side Poster Pipeline**:
  - Client-side HTML5 Canvas WebP compressor (`300x450`, quality `0.75`) for instant local image uploads.
  - Direct image URL support.
  - Dynamic geometric SVG fallback posters with category styling.
- **Resilient JSON Backup & Restore**: Full JSON export (`backlog-backup-YYYY-MM-DD.json`) and validated JSON import with **Merge** or **Overwrite** conflict resolution.
- **Bilingual Interface**: Instant `EN` / `PT-BR` switch in the header.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
