import axios from 'axios';

export interface OpenLibraryBookResult {
  title: string;
  author: string;
  isbn: string;
  category: string;
  description?: string;
  coverUrl?: string;
  publishYear?: number;
  publisher?: string;
}

export class OpenLibraryService {
  /**
   * Fetches metadata for an ISBN from Open Library API
   */
  static async lookupByIsbn(isbn: string): Promise<OpenLibraryBookResult | null> {
    const cleanIsbn = isbn.replace(/[-\s]/g, '').trim();

    try {
      const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
      const response = await axios.get(url, { timeout: 7000 });

      const dataKey = `ISBN:${cleanIsbn}`;
      const bookData = response.data && response.data[dataKey];

      if (!bookData) {
        // Fallback to isbn endpoint
        try {
          const fallbackRes = await axios.get(`https://openlibrary.org/isbn/${cleanIsbn}.json`, { timeout: 5000 });
          if (fallbackRes.data) {
            const raw = fallbackRes.data;
            const publishYear = raw.publish_date ? parseInt(raw.publish_date.match(/\d{4}/)?.[0] || '') : undefined;
            return {
              title: raw.title || 'Unknown Title',
              author: 'Open Library Author',
              isbn: cleanIsbn,
              category: 'General',
              description: typeof raw.description === 'string' ? raw.description : raw.description?.value,
              coverUrl: raw.covers && raw.covers.length > 0 ? `https://covers.openlibrary.org/b/id/${raw.covers[0]}-L.jpg` : undefined,
              publishYear: isNaN(publishYear as number) ? undefined : publishYear,
              publisher: raw.publishers?.[0],
            };
          }
        } catch {
          return null;
        }
        return null;
      }

      // Format author string
      const authors = bookData.authors?.map((a: { name: string }) => a.name).join(', ') || 'Unknown Author';

      // Format publisher
      const publishers = bookData.publishers?.map((p: { name: string }) => p.name).join(', ') || undefined;

      // Extract year
      let publishYear: number | undefined;
      if (bookData.publish_date) {
        const match = bookData.publish_date.match(/\d{4}/);
        if (match) {
          publishYear = parseInt(match[0], 10);
        }
      }

      // Category / Subjects
      let category = 'General';
      if (bookData.subjects && bookData.subjects.length > 0) {
        category = bookData.subjects[0].name || 'General';
      }

      // Cover image
      const coverUrl = bookData.cover?.large || bookData.cover?.medium || undefined;

      // Description or notes
      const description = typeof bookData.notes === 'string' ? bookData.notes : undefined;

      return {
        title: bookData.title || '',
        author: authors,
        isbn: cleanIsbn,
        category,
        description,
        coverUrl,
        publishYear,
        publisher: publishers,
      };
    } catch (error) {
      console.warn(`[OpenLibraryService] Lookup failed for ISBN ${cleanIsbn}:`, (error as Error).message);
      return null;
    }
  }
}
