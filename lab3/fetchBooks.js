
/**
 * fetchBooks
 * @param {string} query - search term (default: 'javascript')
 * @returns {Promise<Array>} - array of normalized book objects
 */
export async function fetchBooks(query = 'javascript') {
  try {
    // Encode the search query for the URL
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`;
    
    // Fetch data from Open Library API
    const res = await fetch(url);

    // Check if response is OK
    if (!res.ok) {
      throw new Error(`Error fetching books: ${res.status}`);
    }

    // Parse the JSON response
    const data = await res.json();

    // Map the results into a simpler format
    return data.docs.slice(0, 20).map(book => ({
      id: book.key || 'unknown',
      title: book.title || 'No Title',
      author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
      image: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : 'assets/images/library.jpg', // fallback image
      description: book.first_sentence
        ? Array.isArray(book.first_sentence)
          ? book.first_sentence.join(' ')
          : book.first_sentence
        : 'No description available.'
    }));

  } catch (error) {
    console.error('fetchBooks error:', error);
    // Return empty array if something goes wrong
    return [];
  }
}
