import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type')?.trim();

  if (!query || !type) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  let images: string[] = [];

  try {
    if (type === 'movies' || type === 'series') {
      // 1. Primary: TMDB API (when TMDB_API_KEY is configured)
      if (process.env.TMDB_API_KEY) {
        try {
          const tmdbType = type === 'movies' ? 'movie' : 'tv';
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/${tmdbType}?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
            { next: { revalidate: 3600 } }
          );
          if (tmdbRes.ok) {
            const data = await tmdbRes.json();
            images = (data.results || [])
              .filter((r: { poster_path?: string }) => Boolean(r.poster_path))
              .slice(0, 5)
              .map(
                (r: { poster_path: string }) =>
                  `https://image.tmdb.org/t/p/w500${r.poster_path}`
              );
          }
        } catch {
          // Proceed to key-free fallbacks
        }
      }

      // 2. Key-free fallback for Series: TVMaze API
      if (images.length < 5 && type === 'series') {
        try {
          const tvMazeRes = await fetch(
            `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
            { next: { revalidate: 3600 } }
          );
          if (tvMazeRes.ok) {
            const tvData = await tvMazeRes.json();
            const tvImages: string[] = (tvData || [])
              .map(
                (entry: {
                  show?: { image?: { original?: string; medium?: string } };
                }) =>
                  entry.show?.image?.original || entry.show?.image?.medium
              )
              .filter(Boolean)
              .map((url: string) => url.replace(/^http:\/\//i, 'https://'));
            images = Array.from(new Set<string>([...images, ...tvImages])).slice(0, 5);
          }
        } catch {
          // Continue to iTunes fallback
        }
      }

      // 3. Key-free fallback for Movies & Series: iTunes Search API
      if (images.length < 5) {
        try {
          const entity = type === 'movies' ? 'movie' : 'tvSeason';
          const itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=8`,
            { next: { revalidate: 3600 } }
          );
          if (itunesRes.ok) {
            const itunesData = await itunesRes.json();
            const itunesImages = (itunesData.results || [])
              .map((r: { artworkUrl100?: string }) =>
                r.artworkUrl100
                  ? r.artworkUrl100.replace('100x100bb', '600x900bb')
                  : null
              )
              .filter(Boolean) as string[];
            images = Array.from(new Set([...images, ...itunesImages])).slice(
              0,
              5
            );
          }
        } catch {
          // Ignore fallback error
        }
      }
    } else if (type === 'games') {
      // 1. Primary: RAWG API (when RAWG_API_KEY is configured)
      if (process.env.RAWG_API_KEY) {
        try {
          const rawgRes = await fetch(
            `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`,
            { next: { revalidate: 3600 } }
          );
          if (rawgRes.ok) {
            const data = await rawgRes.json();
            images = (data.results || [])
              .filter((g: { background_image?: string }) =>
                Boolean(g.background_image)
              )
              .slice(0, 5)
              .map((g: { background_image: string }) => g.background_image);
          }
        } catch {
          // Proceed to key-free fallback
        }
      }

      // 2. Key-free fallback for Games: Steam Store Search API (returns 2:3 vertical library capsules)
      if (images.length < 5) {
        try {
          const steamRes = await fetch(
            `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`,
            { next: { revalidate: 3600 } }
          );
          if (steamRes.ok) {
            const steamData = await steamRes.json();
            const steamImages = (steamData.items || [])
              .slice(0, 5)
              .map(
                (item: { id?: number; tiny_image?: string }) =>
                  item.id
                    ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900.jpg`
                    : item.tiny_image
              )
              .filter(Boolean) as string[];
            images = Array.from(new Set([...images, ...steamImages])).slice(
              0,
              5
            );
          }
        } catch {
          // Ignore fallback error
        }
      }
    } else if (type === 'books') {
      // 1. Primary: Google Books API
      try {
        const booksRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`,
          { next: { revalidate: 3600 } }
        );
        if (booksRes.ok) {
          const data = await booksRes.json();
          const gBooks: string[] = (data.items || [])
            .map(
              (b: {
                volumeInfo?: {
                  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
                };
              }) =>
                b.volumeInfo?.imageLinks?.thumbnail ||
                b.volumeInfo?.imageLinks?.smallThumbnail
            )
            .filter(Boolean)
            .map((url: string) => url.replace(/^http:\/\//i, 'https://'));
          images = Array.from(new Set<string>(gBooks)).slice(0, 5);
        }
      } catch {
        // Proceed to OpenLibrary fallback
      }

      // 2. Key-free fallback for Books: OpenLibrary Search API
      if (images.length < 5) {
        try {
          const olRes = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`,
            { next: { revalidate: 3600 } }
          );
          if (olRes.ok) {
            const olData = await olRes.json();
            const olCovers: string[] = (olData.docs || [])
              .filter((doc: { cover_i?: number }) => Boolean(doc.cover_i))
              .map(
                (doc: { cover_i: number }) =>
                  `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              );
            images = Array.from(new Set<string>([...images, ...olCovers])).slice(0, 5);
          }
        } catch {
          // Ignore fallback error
        }
      }
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
