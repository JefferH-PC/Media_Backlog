import { AppDatabase } from '@/types/backlog';

export const createPosterSvgDataUrl = (
  title: string,
  subtitle: string,
  category: string,
  accentHex = '#10B981',
  bgStart = '#16191D',
  bgEnd = '#0D0F11'
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

  // Split title into up to 2 lines for SVG display
  const words = safeTitle.split(' ');
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if ((line1 + ' ' + word).trim().length <= 16) {
      line1 = (line1 + ' ' + word).trim();
    } else {
      line2 = (line2 + ' ' + word).trim();
    }
  }
  if (line2.length > 18) {
    line2 = line2.slice(0, 16) + '...';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${accentHex}" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <rect width="400" height="360" fill="url(#accentGrad)"/>
    <circle cx="200" cy="210" r="95" fill="none" stroke="${accentHex}" stroke-opacity="0.22" stroke-width="1.5"/>
    <circle cx="200" cy="210" r="60" fill="none" stroke="${accentHex}" stroke-opacity="0.14" stroke-width="1"/>
    <line x1="60" y1="210" x2="340" y2="210" stroke="#2A2F37" stroke-width="1"/>
    <line x1="200" y1="70" x2="200" y2="350" stroke="#2A2F37" stroke-width="1"/>
    <rect x="32" y="36" width="84" height="24" rx="4" fill="#064E3B"/>
    <text x="74" y="52" text-anchor="middle" fill="#6EE7B7" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1.5">${safeCat}</text>
    <text x="200" y="395" text-anchor="middle" fill="#F3F4F6" font-family="system-ui, sans-serif" font-size="26" font-weight="700">${line1}</text>
    ${
      line2
        ? `<text x="200" y="428" text-anchor="middle" fill="#F3F4F6" font-family="system-ui, sans-serif" font-size="24" font-weight="700">${line2}</text>`
        : ''
    }
    <text x="200" y="462" text-anchor="middle" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="14" font-weight="500">${safeSub}</text>
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
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Elden Ring',
          'FromSoftware • 2022',
          'GAME',
          '#10B981',
          '#18221F',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          "Baldur's Gate 3",
          'Larian Studios • 2023',
          'GAME',
          '#10B981',
          '#1B1E24',
          '#0D0F11'
        ),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-game-3',
        type: 'games',
        title: 'Cyberpunk 2077: Phantom Liberty',
        developer: 'CD Projekt Red',
        year: 2023,
        achievements: 65,
        priceBRL: 149.9,
        status: 'backlog',
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Cyberpunk 2077',
          'CD Projekt Red • 2023',
          'GAME',
          '#10B981',
          '#192028',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Hollow Knight',
          'Team Cherry • 2017',
          'PLAYED',
          '#059669',
          '#141A1F',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Oppenheimer',
          '3h 00m • 2023',
          'MOVIE',
          '#10B981',
          '#1E1B18',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Anatomy of a Fall',
          '2h 32m • 2023',
          'MOVIE',
          '#10B981',
          '#161C22',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Parasite',
          '2h 12m • 2019',
          'WATCHED',
          '#059669',
          '#141E1A',
          '#0D0F11'
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
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Severance',
          '2 Seasons • 2022-2025',
          'SERIES',
          '#10B981',
          '#152120',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Shōgun',
          '1 Season • 2024',
          'SERIES',
          '#10B981',
          '#1A1D24',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Breaking Bad',
          '5 Seasons • 2008-2013',
          'WATCHED',
          '#059669',
          '#14201A',
          '#0D0F11'
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
        isCurrentlyConsuming: true,
        coverImage: createPosterSvgDataUrl(
          'Dune',
          'Frank Herbert • Aleph',
          'BOOK',
          '#10B981',
          '#1D1E19',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          'Project Hail Mary',
          'Andy Weir • Suma',
          'BOOK',
          '#10B981',
          '#161B22',
          '#0D0F11'
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
        isCurrentlyConsuming: false,
        coverImage: createPosterSvgDataUrl(
          '1984',
          'George Orwell',
          'READ',
          '#059669',
          '#161E1B',
          '#0D0F11'
        ),
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};
