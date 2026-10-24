import { NextResponse } from 'next/server';

// Helper to fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 3500
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// 1. Cinemeta: Highly reliable, fast, key-free movie & series posters (IMDb/Amazon CDN)
async function fetchCinemeta(query: string, type: 'movies' | 'series'): Promise<string[]> {
  try {
    const cinemetaType = type === 'movies' ? 'movie' : 'series';
    const url = `https://v3-cinemeta.strem.io/catalog/${cinemetaType}/top/search=${encodeURIComponent(query)}.json`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'MediaBacklog/1.0' } }, 3500);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.metas)) return [];

    return data.metas
      .map((item: { poster?: string }) => {
        if (!item.poster) return null;
        // Upgrade Amazon/IMDb poster resolution to high-res vertical (600px width)
        return item.poster.replace(/_SX\d+\.jpg$/, '_SX600.jpg');
      })
      .filter((img: string | null): img is string => Boolean(img) && (img as string).startsWith('https://'));
  } catch {
    return [];
  }
}

// 2. TVMaze: Outstanding key-free series posters
async function fetchTvMaze(query: string): Promise<string[]> {
  try {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, {}, 3000);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((entry: { show?: { image?: { original?: string; medium?: string } } }) =>
        entry.show?.image?.original || entry.show?.image?.medium
      )
      .filter((img: string | undefined): img is string => Boolean(img))
      .map((url: string) => url.replace(/^http:\/\//i, 'https://'));
  } catch {
    return [];
  }
}

// 3. Steam: Key-free PC game vertical posters (600x900 library capsules)
async function fetchSteamGames(query: string): Promise<string[]> {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      3000
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.items)) return [];

    const posters: string[] = [];
    for (const item of data.items) {
      if (item.id) {
        // High-res 2:3 vertical library capsule
        posters.push(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900.jpg`);
      }
      if (item.tiny_image) {
        posters.push(item.tiny_image.replace(/^http:\/\//i, 'https://'));
      }
    }
    return posters;
  } catch {
    return [];
  }
}

// 4. Wikipedia OpenSearch + Page Summary (Direct search first, then with category suffix)
async function fetchWikipediaImages(query: string, categorySuffix?: string): Promise<string[]> {
  const titlesToTry: string[] = [];

  // 1. Direct search
  try {
    const directUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`;
    const res = await fetchWithTimeout(
      directUrl,
      { headers: { 'User-Agent': 'MediaBacklog/1.0 (https://github.com/JefferH-PC/Media_Backlog)' } },
      2500
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data[1])) {
        titlesToTry.push(...data[1]);
      }
    }
  } catch {
    // Ignore
  }

  // 2. Suffix search if direct search yielded few results
  if (titlesToTry.length < 2 && categorySuffix) {
    try {
      const suffixUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query + ' ' + categorySuffix)}&limit=3&namespace=0&format=json&origin=*`;
      const res = await fetchWithTimeout(
        suffixUrl,
        { headers: { 'User-Agent': 'MediaBacklog/1.0 (https://github.com/JefferH-PC/Media_Backlog)' } },
        2500
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data[1])) {
          titlesToTry.push(...data[1]);
        }
      }
    } catch {
      // Ignore
    }
  }

  if (titlesToTry.length === 0) return [];

  const uniqueTitles = Array.from(new Set(titlesToTry)).slice(0, 3);
  const imagePromises = uniqueTitles.map(async (title) => {
    try {
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const sRes = await fetchWithTimeout(
        sumUrl,
        { headers: { 'User-Agent': 'MediaBacklog/1.0 (https://github.com/JefferH-PC/Media_Backlog)' } },
        2000
      );
      if (!sRes.ok) return null;
      const sData = await sRes.json();
      const src = sData.thumbnail?.source;
      if (src && typeof src === 'string' && src.startsWith('https://')) {
        // Exclude generic SVG icons and disambiguation markers
        if (!src.includes('.svg') && !src.includes('logo_vector') && !src.includes('Disambig')) {
          return src;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(imagePromises);
  return results.filter((img: string | null): img is string => Boolean(img));
}

// 5. OpenLibrary: Fast and extensive book covers
async function fetchOpenLibrary(query: string): Promise<string[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,cover_i`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.docs)) return [];

    return data.docs
      .filter((doc: { cover_i?: number }) => Boolean(doc.cover_i))
      .map((doc: { cover_i: number }) => `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
  } catch {
    return [];
  }
}

// 6. Google Books API
async function fetchGoogleBooks(query: string): Promise<string[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;
    const res = await fetchWithTimeout(url, {}, 3000);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.items)) return [];

    return data.items
      .map(
        (b: { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }) =>
          b.volumeInfo?.imageLinks?.thumbnail || b.volumeInfo?.imageLinks?.smallThumbnail
      )
      .filter((img: string | undefined): img is string => Boolean(img))
      .map((url: string) => url.replace(/^http:\/\//i, 'https://'));
  } catch {
    return [];
  }
}

// 7. iTunes API with country=US
async function fetchItunes(query: string, entity: string): Promise<string[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=US&entity=${entity}&limit=6`;
    const res = await fetchWithTimeout(url, {}, 3000);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results
      .map((r: { artworkUrl100?: string }) =>
        r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x900bb') : null
      )
      .filter((img: string | null): img is string => Boolean(img) && (img as string).startsWith('https://'));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type')?.trim();

  if (!query || !type) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  let images: string[] = [];

  try {
    if (type === 'movies') {
      // 1. TMDB (if TMDB_API_KEY is configured)
      if (process.env.TMDB_API_KEY) {
        try {
          const tmdbRes = await fetchWithTimeout(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
            {},
            3000
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const tmdbImages = (tmdbData.results || [])
              .filter((r: { poster_path?: string }) => Boolean(r.poster_path))
              .map((r: { poster_path: string }) => `https://image.tmdb.org/t/p/w500${r.poster_path}`);
            images.push(...tmdbImages);
          }
        } catch {
          // ignore
        }
      }

      // 2. Cinemeta (key-free IMDb/Amazon posters)
      if (images.length < 5) {
        const cinemetaImages = await fetchCinemeta(query, 'movies');
        images.push(...cinemetaImages);
      }

      // 3. Wikipedia
      if (images.length < 5) {
        const wikiImages = await fetchWikipediaImages(query, 'film');
        images.push(...wikiImages);
      }

      // 4. iTunes
      if (images.length < 5) {
        const itunesImages = await fetchItunes(query, 'movie');
        images.push(...itunesImages);
      }
    } else if (type === 'series') {
      // 1. TMDB (if TMDB_API_KEY is configured)
      if (process.env.TMDB_API_KEY) {
        try {
          const tmdbRes = await fetchWithTimeout(
            `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
            {},
            3000
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const tmdbImages = (tmdbData.results || [])
              .filter((r: { poster_path?: string }) => Boolean(r.poster_path))
              .map((r: { poster_path: string }) => `https://image.tmdb.org/t/p/w500${r.poster_path}`);
            images.push(...tmdbImages);
          }
        } catch {
          // ignore
        }
      }

      // 2. Cinemeta Series
      if (images.length < 5) {
        const cinemetaImages = await fetchCinemeta(query, 'series');
        images.push(...cinemetaImages);
      }

      // 3. TVMaze
      if (images.length < 5) {
        const tvImages = await fetchTvMaze(query);
        images.push(...tvImages);
      }

      // 4. Wikipedia
      if (images.length < 5) {
        const wikiImages = await fetchWikipediaImages(query, 'television');
        images.push(...wikiImages);
      }
    } else if (type === 'games') {
      // 1. RAWG (if RAWG_API_KEY is configured)
      if (process.env.RAWG_API_KEY) {
        try {
          const rawgRes = await fetchWithTimeout(
            `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`,
            {},
            3000
          );
          if (rawgRes.ok) {
            const rawgData = await rawgRes.json();
            const rawgImages = (rawgData.results || [])
              .filter((g: { background_image?: string }) => Boolean(g.background_image))
              .map((g: { background_image: string }) => g.background_image);
            images.push(...rawgImages);
          }
        } catch {
          // ignore
        }
      }

      // 2. Steam (PC games with 600x900 library capsule posters)
      if (images.length < 5) {
        const steamImages = await fetchSteamGames(query);
        images.push(...steamImages);
      }

      // 3. Wikipedia (Direct title + video game suffix covers console games like Zelda, Mario, Pokemon, Bloodborne)
      if (images.length < 5) {
        const wikiImages = await fetchWikipediaImages(query, 'video game');
        images.push(...wikiImages);
      }
    } else if (type === 'books') {
      // 1. OpenLibrary
      const olImages = await fetchOpenLibrary(query);
      images.push(...olImages);

      // 2. Google Books
      if (images.length < 5) {
        const gbImages = await fetchGoogleBooks(query);
        images.push(...gbImages);
      }

      // 3. Wikipedia
      if (images.length < 5) {
        const wikiImages = await fetchWikipediaImages(query, 'novel');
        images.push(...wikiImages);
      }
    }

    // Deduplicate and filter valid images (provide pool for client to select 3 loaded ones)
    const uniqueImages = Array.from(
      new Set(images.filter((url) => typeof url === 'string' && url.startsWith('https://')))
    ).slice(0, 6);

    return NextResponse.json(
      { images: uniqueImages },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', images: [] },
      { status: 500 }
    );
  }
}
