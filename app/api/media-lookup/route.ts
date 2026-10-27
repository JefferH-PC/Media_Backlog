import { NextResponse } from 'next/server';

export interface MediaLookupResult {
  title: string;
  year?: string | number;
  coverImage: string;
  type: 'games' | 'movies' | 'series' | 'books';
  developer?: string;
  author?: string;
  publisher?: string;
  duration?: string;
  seasons?: number;
  platform?: string;
  description?: string;
}

const USER_AGENT = 'MediaBacklogApp/1.0 (https://github.com/my-backlog; contact@local.dev)';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') as 'games' | 'movies' | 'series' | 'books' | null;

  if (!q || !type) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: MediaLookupResult[] = [];

    switch (type) {
      case 'series':
        results = await lookupSeries(q);
        break;
      case 'books':
        results = await lookupBooks(q);
        break;
      case 'games':
        results = await lookupGames(q);
        break;
      case 'movies':
        results = await lookupMovies(q);
        break;
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Media lookup error:', error);
    return NextResponse.json({ results: [], error: 'Lookup failed' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// 1. Series Lookup (Primary: TVMaze - 100% Free, No Key Needed)
// -------------------------------------------------------------
async function lookupSeries(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // If TMDB key is provided, prefer TMDB
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(tmdbUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.results || []).slice(0, 5)) {
          if (item.poster_path) {
            results.push({
              title: item.name || item.original_name,
              year: item.first_air_date ? item.first_air_date.slice(0, 4) : undefined,
              coverImage: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              type: 'series',
              description: item.overview,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to TVMaze
    }
  }

  // TVMaze API (100% Free, No API key required)
  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const item of (data || []).slice(0, 5)) {
        const show = item.show;
        if (!show) continue;
        const cover = show.image?.original || show.image?.medium;
        if (cover) {
          const platformName = show.network?.name || show.webChannel?.name;
          results.push({
            title: show.name,
            year: show.premiered ? show.premiered.slice(0, 4) : undefined,
            coverImage: cover.replace('http:', 'https:'),
            type: 'series',
            platform: platformName || undefined,
            description: show.summary ? show.summary.replace(/<[^>]*>/g, '').trim() : undefined,
          });
        }
      }
    }
  } catch (err) {
    console.error('TVMaze lookup failed:', err);
  }

  return results;
}

// -------------------------------------------------------------
// 2. Books Lookup (Open Library - 100% Free, No Key Needed)
// -------------------------------------------------------------
async function lookupBooks(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const doc of data.docs || []) {
        if (doc.cover_i) {
          results.push({
            title: doc.title,
            year: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
            coverImage: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
            type: 'books',
            author: doc.author_name?.[0] || 'Unknown Author',
            publisher: doc.publisher?.[0] || 'Unknown Publisher',
          });
        }
      }
    }
  } catch (err) {
    console.error('OpenLibrary lookup failed:', err);
  }

  return results;
}

// -------------------------------------------------------------
// 3. Games Lookup (Steam Store API + Wikipedia fallback)
// -------------------------------------------------------------
async function lookupGames(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // RAWG key if provided
  const rawgKey = process.env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(query)}&page_size=5`
      );
      if (res.ok) {
        const data = await res.json();
        for (const g of (data.results || []).slice(0, 5)) {
          if (g.background_image) {
            results.push({
              title: g.name,
              year: g.released ? g.released.slice(0, 4) : undefined,
              coverImage: g.background_image,
              type: 'games',
              platform: g.platforms?.[0]?.platform?.name,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to Steam
    }
  }

  // 1. Steam Store Search (Vertical 600x900 Box Art)
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const item of (data.items || []).slice(0, 4)) {
        if (item.id) {
          results.push({
            title: item.name,
            coverImage: `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/library_600x900.jpg`,
            type: 'games',
            platform: 'Steam',
          });
        }
      }
    }
  } catch (err) {
    console.error('Steam lookup failed:', err);
  }

  // 2. Wikipedia fallback for Console Exclusives (Nintendo, PlayStation, etc.)
  if (results.length === 0) {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' video game')}&limit=2`,
        { headers: { 'User-Agent': USER_AGENT } }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const page of searchData.pages || []) {
          if (page.key) {
            const sumRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
              { headers: { 'User-Agent': USER_AGENT } }
            );
            if (sumRes.ok) {
              const sum = await sumRes.json();
              if (sum.thumbnail?.source) {
                // Extract year if available from description e.g. "2023 video game"
                const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/);
                results.push({
                  title: sum.title.replace(/\s*\(video game\)/i, ''),
                  year: yearMatch ? yearMatch[1] : undefined,
                  coverImage: sum.thumbnail.source,
                  type: 'games',
                  description: sum.description,
                });
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Wikipedia game lookup failed:', err);
    }
  }

  return results;
}

// -------------------------------------------------------------
// 4. Movies Lookup (TMDB or Wikipedia + iTunes)
// -------------------------------------------------------------
async function lookupMovies(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // 1. If TMDB key provided
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.results || []).slice(0, 5)) {
          if (item.poster_path) {
            results.push({
              title: item.title || item.original_title,
              year: item.release_date ? item.release_date.slice(0, 4) : undefined,
              coverImage: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              type: 'movies',
              description: item.overview,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through
    }
  }

  // 2. Wikipedia Theatrical Movie Poster Search
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' film')}&limit=3`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      for (const page of searchData.pages || []) {
        if (page.key) {
          const sumRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
            { headers: { 'User-Agent': USER_AGENT } }
          );
          if (sumRes.ok) {
            const sum = await sumRes.json();
            if (sum.thumbnail?.source) {
              const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/);
              results.push({
                title: sum.title.replace(/\s*\(\d{4}\s*film\)/i, '').replace(/\s*\(film\)/i, ''),
                year: yearMatch ? yearMatch[1] : undefined,
                coverImage: sum.thumbnail.source,
                type: 'movies',
                description: sum.description,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Wikipedia movie lookup failed:', err);
  }

  return results;
}
