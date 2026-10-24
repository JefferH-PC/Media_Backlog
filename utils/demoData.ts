import { AppDatabase } from '@/types/backlog';

export const createPosterSvgDataUrl = (
  title: string,
  subtitle: string,
  category: string,
  accentHex = '#71717a',
  bgStart = '#18181b',
  bgEnd = '#09090b'
): string => {
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeSub = subtitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeCat = category.toUpperCase();

  // Split title into up to 3 lines if long
  const words = safeTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= 15) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].slice(0, 12) + '...';
  }

  const startY =
    displayLines.length === 1 ? 310 : displayLines.length === 2 ? 295 : 275;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <linearGradient id="glow" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="${accentHex}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Background Canvas -->
    <rect width="400" height="600" fill="url(#bg)"/>
    <rect width="400" height="300" fill="url(#glow)"/>

    <!-- Subtle Inset Hairline Frame -->
    <rect x="20" y="20" width="360" height="560" rx="3" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

    <!-- Top Editorial Header -->
    <text x="44" y="60" fill="${accentHex}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="2.5">${safeCat}</text>
    <circle cx="352" cy="56" r="3.5" fill="${accentHex}" opacity="0.6"/>

    <!-- Title Lines -->
    ${displayLines
      .map(
        (line, idx) =>
          `<text x="44" y="${startY + idx * 36}" fill="#f4f4f5" font-family="Georgia, serif" font-size="28" font-weight="600" letter-spacing="-0.3">${line}</text>`
      )
      .join('\n    ')}

    <!-- Minimal Hairline Divider -->
    <line x1="44" y1="425" x2="104" y2="425" stroke="${accentHex}" stroke-opacity="0.45" stroke-width="1.5"/>

    <!-- Editorial Subtitle / Metadata Footer -->
    <text x="44" y="460" fill="#a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" letter-spacing="0.2">${safeSub}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const getDemoDatabase = (): AppDatabase => {
  const now = new Date().toISOString();
  return {
    version: 1,
    lastBackupDate: now,
    games: [
      {
        id: 'demo-game-1',
        type: 'games',
        title: 'Elden Ring',
        developer: 'FromSoftware',
        year: 2022,
        achievements: 42,
        priceBRL: 229.9,
        status: 'backlog',
        platform: 'PlayStation 5',
        notes: 'Currently in the Lands Between. Exploring Leyndell Royal Capital next.',
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Elden Ring',
          'FromSoftware · 2022',
          'Game',
          '#38bdf8',
          '#0f172a',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-game-2',
        type: 'games',
        title: "Baldur's Gate 3",
        developer: 'Larian Studios',
        year: 2023,
        achievements: 54,
        priceBRL: 199.99,
        status: 'backlog',
        platform: 'Steam',
        notes: 'Planned co-op campaign run.',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          "Baldur's Gate 3",
          'Larian Studios · 2023',
          'Game',
          '#818cf8',
          '#131127',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-game-3',
        type: 'games',
        title: 'Cyberpunk 2077',
        developer: 'CD Projekt Red',
        year: 2023,
        achievements: 65,
        priceBRL: 149.9,
        status: 'backlog',
        platform: 'PC',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Cyberpunk 2077',
          'CD Projekt Red · 2023',
          'Game',
          '#34d399',
          '#111e19',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-game-4',
        type: 'games',
        title: 'Hollow Knight',
        developer: 'Team Cherry',
        year: 2017,
        achievements: 63,
        priceBRL: 46.99,
        status: 'consumed',
        platform: 'Nintendo Switch',
        rating: 5,
        notes: 'A masterclass in level design and atmosphere. Completed 112% run.',
        completedAt: '2023-11-14T19:00:00.000Z',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Hollow Knight',
          'Team Cherry · 2017',
          'Played',
          '#a1a1aa',
          '#18181b',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
    ],
    movies: [
      {
        id: 'demo-movie-1',
        type: 'movies',
        title: 'Oppenheimer',
        duration: '3h 00m',
        year: 2023,
        status: 'backlog',
        platform: 'Cinema',
        notes: 'Watch in 4K HDR audio system.',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Oppenheimer',
          '3h 00m · Christopher Nolan',
          'Film',
          '#f59e0b',
          '#21160d',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-movie-2',
        type: 'movies',
        title: 'Anatomy of a Fall',
        duration: '2h 32m',
        year: 2023,
        status: 'backlog',
        platform: 'Prime Video',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Anatomy of a Fall',
          '2h 32m · Justine Triet',
          'Film',
          '#38bdf8',
          '#0f1722',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-movie-3',
        type: 'movies',
        title: 'Parasite',
        duration: '2h 12m',
        year: 2019,
        status: 'consumed',
        platform: 'Blu-ray',
        rating: 5,
        notes: 'Flawless pacing and social commentary. Bong Joon-ho at his peak.',
        completedAt: '2022-08-10T21:30:00.000Z',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Parasite',
          '2h 12m · Bong Joon-ho',
          'Watched',
          '#a1a1aa',
          '#18181b',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
    ],
    series: [
      {
        id: 'demo-series-1',
        type: 'series',
        title: 'Severance',
        seasons: 2,
        year: '2022-2025',
        status: 'backlog',
        platform: 'Apple TV+',
        notes: 'In progress. Episode 7 next.',
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Severance',
          '2 Seasons · 2022-2025',
          'Series',
          '#38bdf8',
          '#0e1b20',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-series-2',
        type: 'series',
        title: 'Shōgun',
        seasons: 1,
        year: '2024',
        status: 'backlog',
        platform: 'Disney+',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Shōgun',
          '1 Season · 2024',
          'Series',
          '#f59e0b',
          '#22170f',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-series-3',
        type: 'series',
        title: 'Breaking Bad',
        seasons: 5,
        year: '2008-2013',
        status: 'consumed',
        platform: 'Netflix',
        rating: 5,
        notes: 'One of the greatest television dramas ever made.',
        completedAt: '2021-04-18T22:00:00.000Z',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Breaking Bad',
          '5 Seasons · 2008-2013',
          'Watched',
          '#a1a1aa',
          '#18181b',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
    ],
    books: [
      {
        id: 'demo-book-1',
        type: 'books',
        title: 'Dune',
        author: 'Frank Herbert',
        publisher: 'Editora Aleph',
        year: 1965,
        priceBRL: 74.9,
        status: 'backlog',
        platform: 'Physical',
        notes: 'Reading Book 2: Muad\'Dib. World-building is unmatched.',
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Dune',
          'Frank Herbert · Aleph',
          'Book',
          '#fb923c',
          '#22160e',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-book-2',
        type: 'books',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        publisher: 'Suma',
        year: 2021,
        priceBRL: 59.9,
        status: 'backlog',
        platform: 'Kindle',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Project Hail Mary',
          'Andy Weir · Suma',
          'Book',
          '#38bdf8',
          '#0e1622',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-book-3',
        type: 'books',
        title: '1984',
        author: 'George Orwell',
        publisher: 'Companhia das Letras',
        year: 1949,
        priceBRL: 44.9,
        status: 'consumed',
        platform: 'Paperback',
        rating: 5,
        notes: 'Chilling and timeless examination of totalitarianism.',
        completedAt: '2020-05-12T15:00:00.000Z',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          '1984',
          'George Orwell · 1949',
          'Read',
          '#a1a1aa',
          '#18181b',
          '#09090b'
        ),
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};
