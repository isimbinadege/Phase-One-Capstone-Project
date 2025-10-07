
const OPENLIB_SEARCH = "https://openlibrary.org/search.json?q=";
const COVER_BASE = "https://covers.openlibrary.org/b/id/";
const DEFAULT_IMAGE = "./assets/images/library.jpg"; // update path if your placeholder is elsewhere

/**
 * fetchBooks
 * @param {string} query - search term (default 'javascript')
 * @returns {Promise<Array>} - array of books (max 20)
 */
export async function fetchBooks(query = 'javascript') {
  // basic validation / fallback
  const q = (query && String(query).trim()) ? String(query).trim() : 'javascript';
  const url = `${OPENLIB_SEARCH}${encodeURIComponent(q)}&limit=20`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // network/server error
      console.error(`OpenLibrary error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    // Normalize results
    const books = data.docs.slice(0, 20).map((book) => {
      // description: OpenLibrary may provide first_sentence as string or array
      let description = 'No description available.';
      if (book.first_sentence) {
        if (Array.isArray(book.first_sentence)) {
          description = book.first_sentence.join(' ');
        } else if (typeof book.first_sentence === 'string') {
          description = book.first_sentence;
        } else if (book.first_sentence.value) {
          description = book.first_sentence.value;
        }
      } else if (book.subtitle) {
        description = book.subtitle;
      }

      return {
        id: book.key || book.cover_edition_key || `${book.title}_${book.first_publish_year || ''}`,
        title: book.title || 'No Title',
        author: book.author_name ? book.author_name.join(', ') : 'Unknown',
        image: book.cover_i ? `${COVER_BASE}${book.cover_i}-L.jpg` : DEFAULT_IMAGE,
        description
      };
    });

    return books;
  } catch (err) {
    console.error('fetchBooks - network or parsing error:', err);
    return [];
  }
}
