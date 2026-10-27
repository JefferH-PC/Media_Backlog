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
  description?: string;
  images?: string[];
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
// Image Verification & Wikipedia Utilities
// -------------------------------------------------------------

async function checkImageOk(url: string, timeoutMs = 1200): Promise<boolean> {
  if (!url || !url.startsWith('http')) return false;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function getWikiFileUrl(fileName: string): Promise<string | undefined> {
  if (!fileName) return undefined;
  try {
    const cleanName = fileName.replace(/^File:/i, '').replace(/\[\[|\]\]/g, '').trim();
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(cleanName)}&prop=imageinfo&iiprop=url&format=json`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const pages = data.query?.pages;
    const firstPage = Object.values(pages || {})[0] as any;
    return firstPage?.imageinfo?.[0]?.url;
  } catch {
    return undefined;
  }
}

function dedupeImages(images: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const img of images) {
    if (img && typeof img === 'string' && img.startsWith('http') && !seen.has(img)) {
      seen.add(img);
      output.push(img);
    }
  }
  return output;
}

// -------------------------------------------------------------
// 1. Series Lookup: TVMaze with Popularity/Weight + Wikipedia Fallback
// -------------------------------------------------------------
async function lookupSeries(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];
  const queryLower = query.toLowerCase().trim();

  // 1. If TMDB key is provided
  const tmdbKey = process.env.TMDB_API_KEY;
  if (tmdbKey) {
    try {
      const tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(tmdbUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const candidateShows = (data.results || []).slice(0, 4);
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

            const candidateImages = dedupeImages([
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
            ]);

            results.push({
              title: item.name || item.original_name,
              year: item.first_air_date ? item.first_air_date.slice(0, 4) : undefined,
              coverImage: candidateImages[0],
              type: 'series',
              seasons: totalSeasons,
              description: item.overview,
              images: candidateImages,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to TVMaze
    }
  }

  // 2. TVMaze API (Free, No API key required)
  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const sortedItems = (data || []).sort((a: any, b: any) => {
        const weightA = a.show?.weight || 0;
        const weightB = b.show?.weight || 0;
        return weightB - weightA;
      });

      const topItems = sortedItems.slice(0, 4);

      for (const item of topItems) {
        const show = item.show;
        if (!show) continue;

        let totalSeasons = 1;
        try {
          const seasonsRes = await fetch(
            `https://api.tvmaze.com/shows/${show.id}/seasons`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
          );
          if (seasonsRes.ok) {
            const seasonsData = await seasonsRes.json();
            if (Array.isArray(seasonsData) && seasonsData.length > 0) {
              totalSeasons = seasonsData.length;
            }
          }
        } catch {}

        const premierYear = show.premiered ? show.premiered.slice(0, 4) : undefined;
        const candidateImages: string[] = [];

        // Primary cover from show
        const cover = (show.image?.original || show.image?.medium || '').replace('http:', 'https:');
        if (cover) {
          candidateImages.push(cover);
        }

        // Fetch gallery images from TVMaze
        try {
          const imgRes = await fetch(
            `https://api.tvmaze.com/shows/${show.id}/images`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
          );
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            for (const img of (imgData || []).slice(0, 8)) {
              const u = (img.resolutions?.original?.url || img.resolutions?.medium?.url || '').replace('http:', 'https:');
              if (u) candidateImages.push(u);
            }
          }
        } catch {}

        // If no images found yet (unreleased or upcoming show on TVMaze)
        if (candidateImages.length === 0) {
          try {
            const wikiRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(show.name + ' (TV series)')}`,
              { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
            );
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (wikiData.thumbnail?.source) {
                candidateImages.push(wikiData.thumbnail.source);
              }
            }
          } catch {}
        }

        const uniqueImages = dedupeImages(candidateImages);
        if (uniqueImages.length > 0) {
          results.push({
            title: show.name,
            year: premierYear,
            seasons: totalSeasons,
            coverImage: uniqueImages[0],
            type: 'series',
            description: show.summary ? show.summary.replace(/<[^>]*>/g, '').trim() : undefined,
            images: uniqueImages,
          });
        }
      }
    }
  } catch (err) {
    console.error('TVMaze lookup failed:', err);
  }

  // 3. Fallback to Wikipedia for TV shows if TVMaze produced nothing
  if (results.length === 0) {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' TV series')}&limit=4`,
        { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3000) }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const page of (searchData.pages || []).slice(0, 2)) {
          const sumRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
          );
          if (sumRes.ok) {
            const sum = await sumRes.json();
            const candidateImages: string[] = [];
            if (sum.thumbnail?.source) {
              candidateImages.push(sum.thumbnail.source);
            }

            // Check infobox image
            try {
              const parseRes = await fetch(
                `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page.key)}&prop=wikitext&format=json&section=0`,
                { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
              );
              if (parseRes.ok) {
                const parseData = await parseRes.json();
                const wt = parseData.parse?.wikitext?.['*'] || '';
                const imgMatch = wt.match(/image\s*=\s*([^\n|]+)/i);
                if (imgMatch) {
                  const fileUrl = await getWikiFileUrl(imgMatch[1].trim());
                  if (fileUrl) candidateImages.unshift(fileUrl);
                }
              }
            } catch {}

            const uniqueImages = dedupeImages(candidateImages);
            if (uniqueImages.length > 0) {
              const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/) || sum.extract?.match(/\b(19\d\d|20\d\d)\b/);
              results.push({
                title: sum.title.replace(/\s*\(TV series\)/i, '').replace(/\s*\(miniseries\)/i, '').trim(),
                year: yearMatch ? yearMatch[1] : undefined,
                seasons: 1,
                coverImage: uniqueImages[0],
                type: 'series',
                description: sum.description,
                images: uniqueImages,
              });
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error('Wikipedia TV series lookup failed:', err);
    }
  }

  return results;
}

// -------------------------------------------------------------
// 2. Books Lookup: Open Library with Strict Edition & Quality Ranking + Wikipedia Fallback
// -------------------------------------------------------------
async function lookupBooks(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];
  const queryLower = query.toLowerCase().trim();

  const noiseKeywords = [
    'summary of',
    'workbook',
    'study guide',
    'journal',
    'analysis of',
    'notes on',
    'companion to',
    'gradesaver',
    'cliffsnotes',
  ];

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const docs = (data.docs || [])
        .filter((d: any) => {
          const titleLower = (d.title || '').toLowerCase();
          return !noiseKeywords.some((noise) => titleLower.includes(noise));
        })
        .sort((a: any, b: any) => {
          const tA = (a.title || '').toLowerCase().trim();
          const tB = (b.title || '').toLowerCase().trim();

          const matchA = tA === queryLower ? 100 : tA.startsWith(queryLower) ? 50 : 0;
          const matchB = tB === queryLower ? 100 : tB.startsWith(queryLower) ? 50 : 0;

          const edA = Math.min(a.edition_count || 0, 50);
          const edB = Math.min(b.edition_count || 0, 50);

          return matchB + edB - (matchA + edA);
        });

      for (const doc of docs.slice(0, 4)) {
        const candidateImages: string[] = [];

        if (doc.cover_i) {
          candidateImages.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
          candidateImages.push(`https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`);
        }

        if (Array.isArray(doc.id_covers)) {
          for (const cid of doc.id_covers.slice(0, 4)) {
            candidateImages.push(`https://covers.openlibrary.org/b/id/${cid}-L.jpg`);
          }
        }

        if (doc.cover_edition_key) {
          candidateImages.push(`https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`);
        }

        // If OpenLibrary has no cover (e.g. unreleased or newly announced book)
        if (candidateImages.length === 0) {
          try {
            const wikiRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(doc.title + ' (novel)')}`,
              { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(1500) }
            );
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (wikiData.thumbnail?.source) {
                candidateImages.push(wikiData.thumbnail.source);
              }
            }
          } catch {}
        }

        const uniqueImages = dedupeImages(candidateImages);
        if (uniqueImages.length > 0) {
          results.push({
            title: doc.title,
            year: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
            author: doc.author_name?.[0] || 'Unknown Author',
            coverImage: uniqueImages[0],
            type: 'books',
            publisher: doc.publisher?.[0] || 'Unknown Publisher',
            images: uniqueImages,
          });
        }
      }
    }
  } catch (err) {
    console.error('OpenLibrary lookup failed:', err);
  }

  // Fallback to Wikipedia for books
  if (results.length === 0) {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' novel')}&limit=4`,
        { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3000) }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const page of (searchData.pages || []).slice(0, 2)) {
          const sumRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
          );
          if (sumRes.ok) {
            const sum = await sumRes.json();
            if (sum.thumbnail?.source) {
              const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/) || sum.extract?.match(/\b(19\d\d|20\d\d)\b/);
              results.push({
                title: sum.title.replace(/\s*\(novel\)/i, '').replace(/\s*\(book\)/i, '').trim(),
                year: yearMatch ? yearMatch[1] : undefined,
                author: 'Unknown Author',
                publisher: 'Unknown Publisher',
                coverImage: sum.thumbnail.source,
                type: 'books',
                images: [sum.thumbnail.source],
              });
              break;
            }
          }
        }
      }
    } catch {}
  }

  return results;
}

// -------------------------------------------------------------
// 3. Games Lookup: Steam Verified Assets + Screenshots + Wikipedia Fallback
// -------------------------------------------------------------
async function lookupGames(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];
  const queryLower = query.toLowerCase().trim();

  const junkKeywords = [
    'soundtrack',
    'dlc',
    'expansion',
    'dedicated server',
    'artbook',
    'pack',
    'demo',
  ];

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
              images: dedupeImages([g.background_image, ...(g.short_screenshots || []).map((s: any) => s.image)]),
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to Steam
    }
  }

  // 1. Steam Store Search + App Details + Verified Image Fallbacks
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const filteredItems = (data.items || [])
        .filter((item: any) => {
          if (!item.id || !item.name) return false;
          const nameLower = item.name.toLowerCase();
          return !junkKeywords.some((junk) => nameLower.includes(junk));
        })
        .sort((a: any, b: any) => {
          const nameA = a.name.toLowerCase().trim();
          const nameB = b.name.toLowerCase().trim();
          const scoreA = nameA === queryLower ? 100 : nameA.startsWith(queryLower) ? 50 : 0;
          const scoreB = nameB === queryLower ? 100 : nameB.startsWith(queryLower) ? 50 : 0;
          return scoreB - scoreA;
        });

      const topItems = filteredItems.slice(0, 4);

      for (const item of topItems) {
        let developer: string | undefined = undefined;
        let year: string | undefined = undefined;
        let headerImage: string | undefined = undefined;
        let screenshots: string[] = [];
        let capsuleImage: string | undefined = undefined;

        try {
          const detailRes = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${item.id}&l=english`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2500) }
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
              headerImage = appData.header_image;
              capsuleImage = appData.capsule_image;
              screenshots = (appData.screenshots || []).slice(0, 6).map((s: any) => s.path_full || s.path_thumbnail);
            }
          }
        } catch {}

        // Check if vertical 600x900 library asset actually exists (avoids 404 on unreleased/new games)
        const libUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/library_600x900.jpg`;
        const isLibOk = await checkImageOk(libUrl, 900);

        const candidateImages: string[] = [];
        if (isLibOk) candidateImages.push(libUrl);
        if (headerImage) candidateImages.push(headerImage);
        for (const s of screenshots) candidateImages.push(s);
        if (capsuleImage) candidateImages.push(capsuleImage);
        if (item.tiny_image) candidateImages.push(item.tiny_image);

        // For unreleased games with no library art on Steam, check Wikipedia for vertical box art
        if (!isLibOk) {
          try {
            const wikiRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.name + ' (video game)')}`,
              { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(1500) }
            );
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (wikiData.thumbnail?.source) {
                candidateImages.unshift(wikiData.thumbnail.source);
              }
            }
          } catch {}
        }

        const uniqueImages = dedupeImages(candidateImages);
        if (uniqueImages.length > 0) {
          results.push({
            title: item.name,
            year,
            developer,
            coverImage: uniqueImages[0],
            type: 'games',
            images: uniqueImages,
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
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' video game')}&limit=6`,
        { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3000) }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const candidatePages = (searchData.pages || []).filter((page: any) => {
          const t = page.title.toLowerCase();
          const d = (page.description || '').toLowerCase();
          if (t.includes('franchise') || t.includes('list of') || t.includes('characters')) return false;
          return d.includes('video game') || d.includes('game') || d.includes('developed by');
        });

        for (const page of candidatePages.slice(0, 3)) {
          const sumRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
            { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
          );
          if (sumRes.ok) {
            const sum = await sumRes.json();
            // Accept vertical, square, or near-square box arts (height >= width * 0.7)
            if (sum.thumbnail && sum.thumbnail.height >= sum.thumbnail.width * 0.7) {
              let developer: string | undefined = undefined;
              let year: string | undefined = undefined;
              const candidateImages: string[] = [sum.thumbnail.source];

              try {
                const parseRes = await fetch(
                  `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page.key)}&prop=wikitext&format=json&section=0`,
                  { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
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

                  const imgMatch = wt.match(/image\s*=\s*([^\n|]+)/i);
                  if (imgMatch) {
                    const fileUrl = await getWikiFileUrl(imgMatch[1].trim());
                    if (fileUrl) candidateImages.unshift(fileUrl);
                  }
                }
              } catch {}

              if (!year) {
                const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/);
                if (yearMatch) year = yearMatch[1];
              }

              const uniqueImages = dedupeImages(candidateImages);
              results.push({
                title: sum.title.replace(/\s*\(video game\)/i, '').trim(),
                year,
                developer,
                coverImage: uniqueImages[0],
                type: 'games',
                description: sum.description,
                images: uniqueImages,
              });
              break;
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
// 4. Movies Lookup: Theatrical Posters, Infobox Images, and Unreleased Teasers
// -------------------------------------------------------------
async function lookupMovies(query: string): Promise<MediaLookupResult[]> {
  const results: MediaLookupResult[] = [];
  const queryLower = query.toLowerCase().trim();

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

            const candidateImages = dedupeImages([
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
              item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
            ]);

            results.push({
              title: item.title || item.original_title,
              year: item.release_date ? item.release_date.slice(0, 4) : undefined,
              duration,
              coverImage: candidateImages[0],
              type: 'movies',
              description: item.overview,
              images: candidateImages,
            });
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // Fall through to Wikipedia
    }
  }

  // 2. Wikipedia Movie Poster, Infobox Artwork & Teaser Logos
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query + ' film')}&limit=8`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(3500) }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();

      const scoredPages = (searchData.pages || [])
        .filter((page: any) => {
          const t = page.title.toLowerCase();
          const d = (page.description || '').toLowerCase();
          if (
            t.endsWith('in film') ||
            t.includes('franchise') ||
            t.includes('character') ||
            t.includes('soundtrack') ||
            t.includes('list of')
          ) {
            return false;
          }
          return d.includes('film') || d.includes('movie') || d.includes('directed by');
        })
        .sort((a: any, b: any) => {
          const cleanA = a.title.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
          const cleanB = b.title.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
          const scoreA = cleanA === queryLower ? 100 : cleanA.startsWith(queryLower) ? 50 : 10;
          const scoreB = cleanB === queryLower ? 100 : cleanB.startsWith(queryLower) ? 50 : 10;
          return scoreB - scoreA;
        });

      for (const page of scoredPages.slice(0, 4)) {
        const sumRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
          { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
        );
        if (sumRes.ok) {
          const sum = await sumRes.json();
          const candidateImages: string[] = [];

          if (sum.thumbnail?.source) {
            candidateImages.push(sum.thumbnail.source);
          }

          let duration: string | undefined = undefined;
          let year: string | undefined = undefined;

          // Parse section 0 infobox for runtime, year, and high-res infobox poster/logo
          try {
            const parseRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page.key)}&prop=wikitext&format=json&section=0`,
              { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(2000) }
            );
            if (parseRes.ok) {
              const parseData = await parseRes.json();
              const wt = parseData.parse?.wikitext?.['*'] || '';

              const runtimeMatch = wt.match(/runtime\s*=\s*(?:\{\{[^}]*\}\}\s*)?(\d+)\s*(?:min|minutes|\b)/i);
              if (runtimeMatch) {
                const mins = parseInt(runtimeMatch[1], 10);
                if (mins > 0) {
                  duration = formatDuration(mins);
                }
              }

              const dateMatch = wt.match(/release_date\s*=\s*.*?(\d{4})/i);
              if (dateMatch) {
                year = dateMatch[1];
              }

              // Check infobox image parameter
              const imgMatch = wt.match(/image\s*=\s*([^\n|]+)/i);
              if (imgMatch) {
                const fileUrl = await getWikiFileUrl(imgMatch[1].trim());
                if (fileUrl) {
                  candidateImages.unshift(fileUrl);
                }
              }
            }
          } catch {}

          if (!year) {
            const yearMatch = sum.description?.match(/\b(19\d\d|20\d\d)\b/) || sum.extract?.match(/\b(19\d\d|20\d\d)\b/);
            if (yearMatch) year = yearMatch[1];
          }

          const uniqueImages = dedupeImages(candidateImages);

          // We accept any found promotional image (even teaser logos or banners for unreleased films)
          if (uniqueImages.length > 0) {
            results.push({
              title: sum.title.replace(/\s*\(\d{4}\s*film\)/i, '').replace(/\s*\(film\)/i, '').trim(),
              year,
              duration: duration || '2h 00m',
              coverImage: uniqueImages[0],
              type: 'movies',
              description: sum.description,
              images: uniqueImages,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Wikipedia movie lookup failed:', err);
  }

  return results;
}
