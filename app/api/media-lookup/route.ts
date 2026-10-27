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
// 1. Series Lookup: Auto-fills Year & Seasons (TVMaze)
// -------------------------------------------------------------
async function lookupSeries(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // If TMDB key is provided
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(tmdbUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const candidateShows = (data.results || []).slice(0, 3);
        for (const item of candidateShows) {
          if (item.poster_path) {
            let totalSeasons = 1;
            try {
              const detailRes = await fetch(
                `https://api.themoviedb.org/3/tv/${item.id}?api_key=${tmdbKey}`
              );
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (detail.number_of_seasons) {
                  totalSeasons = detail.number_of_seasons;
                }
              }
            } catch {}

            results.push({
              title: item.name || item.original_name,
              year: item.first_air_date ? item.first_air_date.slice(0, 4) : undefined,
              coverImage: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              type: 'series',
              seasons: totalSeasons,
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
      const topItems = (data || []).slice(0, 4);

      for (const item of topItems) {
        const show = item.show;
        if (!show) continue;
        const cover = show.image?.original || show.image?.medium;
        if (cover) {
          // Fetch seasons count
          let totalSeasons = 1;
          try {
            const seasonsRes = await fetch(
              `https://api.tvmaze.com/shows/${show.id}/seasons`,
              { headers: { 'User-Agent': USER_AGENT } }
            );
            if (seasonsRes.ok) {
              const seasonsData = await seasonsRes.json();
              if (Array.isArray(seasonsData) && seasonsData.length > 0) {
                totalSeasons = seasonsData.length;
              }
            }
          } catch {}

          const platformName = show.network?.name || show.webChannel?.name;
          const premierYear = show.premiered ? show.premiered.slice(0, 4) : undefined;

          results.push({
            title: show.name,
            year: premierYear,
            seasons: totalSeasons,
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
// 2. Books Lookup: Auto-fills Author & Year (Open Library)
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
            author: doc.author_name?.[0] || 'Unknown Author',
            coverImage: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
            type: 'books',
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
// 3. Games Lookup: Auto-fills Year & Developer (Steam + Wiki)
// -------------------------------------------------------------
async function lookupGames(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // RAWG key if provided
  const rawgKey = process.env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(query)}&page_size=4`
      );
      if (res.ok) {
        const data = await res.json();
        for (const g of (data.results || []).slice(0, 4)) {
          if (g.background_image) {
            results.push({
              title: g.name,
              year: g.released ? g.released.slice(0, 4) : undefined,
              developer: g.developers?.[0]?.name,
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

  // 1. Steam Store Search + App Details
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (res.ok) {
      const data = await res.json();
      const items = (data.items || []).slice(0, 4);

      for (const item of items) {
        if (item.id) {
          let developer: string | undefined = undefined;
          let year: string | undefined = undefined;

          try {
            const detailRes = await fetch(
              `https://store.steampowered.com/api/appdetails?appids=${item.id}&l=english`,
              { headers: { 'User-Agent': USER_AGENT } }
            );
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              const appData = detailJson[String(item.id)]?.data;
              if (appData) {
                developer = appData.developers?.[0];
                const yearMatch = appData.release_date?.date?.match(/\b(19\d\d|20\d\d)\b/);
                if (yearMatch) {
                  year = yearMatch[1];
                }
              }
            }
          } catch {}

          results.push({
            title: item.name,
            year,
            developer,
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
                let developer: string | undefined = undefined;
                let year: string | undefined = undefined;

                try {
                  const parseRes = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page.key)}&prop=wikitext&format=json&section=0`,
                    { headers: { 'User-Agent': USER_AGENT } }
                  );
                  if (parseRes.ok) {
                    const parseData = await parseRes.json();
                    const wt = parseData.parse?.wikitext?.['*'] || '';
                    const devMatch = wt.match(/developer\s*=\s*(?:\[\[(?:[^|\]]*\|)?([^\]]+)\]\]|([^\n|]+))/i);
                    if (devMatch) {
                      developer = (devMatch[1] || devMatch[2]).replace(/\{\{[^}]*\}\}/g, '').trim();
                    }
                    const yearMatch = wt.match(/released\s*=\s*.*?(\d{4})/i) || sum.description?.match(/\b(19\d\d|20\d\d)\b/);
                    if (yearMatch) {
                      year = yearMatch[1];
                    }
                  }
                } catch {}

                if (!year) {
                  const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/);
                  if (yearMatch) year = yearMatch[1];
                }

                results.push({
                  title: sum.title.replace(/\s*\(video game\)/i, ''),
                  year,
                  developer,
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
// 4. Movies Lookup: Auto-fills Release Year & Duration (Wiki / TMDB)
// -------------------------------------------------------------
async function lookupMovies(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];

  // Helper to format minutes to "Xh Ym"
  const formatDuration = (totalMinutes: number): string => {
    if (!totalMinutes || totalMinutes <= 0) return '2h 00m';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // 1. If TMDB key provided
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of (data.results || []).slice(0, 4)) {
          if (item.poster_path) {
            let duration = '2h 00m';
            try {
              const detailRes = await fetch(
                `https://api.themoviedb.org/3/movie/${item.id}?api_key=${tmdbKey}`
              );
              if (detailRes.ok) {
                const detail = await detailRes.json();
                if (detail.runtime) {
                  duration = formatDuration(detail.runtime);
                }
              }
            } catch {}

            results.push({
              title: item.title || item.original_title,
              year: item.release_date ? item.release_date.slice(0, 4) : undefined,
              duration,
              coverImage: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              type: 'movies',
              description: item.overview,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to Wikipedia
    }
  }

  // 2. Wikipedia Theatrical Movie Poster + Infobox Runtime & Year Search
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
              let duration: string | undefined = undefined;
              let year: string | undefined = undefined;

              // Parse section 0 infobox for runtime & release date
              try {
                const parseRes = await fetch(
                  `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page.key)}&prop=wikitext&format=json&section=0`,
                  { headers: { 'User-Agent': USER_AGENT } }
                );
                if (parseRes.ok) {
                  const parseData = await parseRes.json();
                  const wt = parseData.parse?.wikitext?.['*'] || '';

                  // Match runtime
                  const runtimeMatch = wt.match(/runtime\s*=\s*(?:\{\{[^}]*\}\}\s*)?(\d+)\s*(?:min|minutes|\b)/i);
                  if (runtimeMatch) {
                    const mins = parseInt(runtimeMatch[1], 10);
                    if (mins > 0) {
                      duration = formatDuration(mins);
                    }
                  }

                  // Match year
                  const dateMatch = wt.match(/release_date\s*=\s*.*?(\d{4})/i);
                  if (dateMatch) {
                    year = dateMatch[1];
                  }
                }
              } catch {}

              if (!year) {
                const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/) || sum.extract?.match(/\b(19\d\d|20\d\d)\b/);
                if (yearMatch) year = yearMatch[1];
              }

              results.push({
                title: sum.title.replace(/\s*\(\d{4}\s*film\)/i, '').replace(/\s*\(film\)/i, ''),
                year,
                duration: duration || '2h 00m',
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
