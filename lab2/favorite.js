// favorites.js
// Module for managing favorites in Book Explorer
// Exports: addFavorite, removeFavorite, getFavorites, isFavorite, clearFavorites, subscribe

const LS_KEY = 'book_explorer_favorites_v1';

/**
 * Load favorites array from localStorage
 * @returns {Array} - array of book objects
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('getFavorites: failed to parse localStorage value', err);
    return [];
  }
}

/**
 * Save favorites array to localStorage
 * @param {Array} arr
 */
function saveFavorites(arr) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('saveFavorites: failed to save to localStorage', err);
  }
}

/**
 * Check whether a book id is already in favorites
 * @param {string} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  if (!id) return false;
  const favs = getFavorites();
  return favs.some(b => b.id === id);
}

/**
 * Add a book object to favorites (avoids duplicates)
 * @param {Object} book - expected shape { id, title, author, image, description }
 */
export function addFavorite(book) {
  if (!book || !book.id) {
    console.warn('addFavorite: invalid book object', book);
    return;
  }
  const favs = getFavorites();
  if (favs.some(b => b.id === book.id)) return; // already saved
  favs.unshift(book); // add to front (recent first)
  saveFavorites(favs);
  notifySubscribers(favs);
}

/**
 * Remove a book from favorites by id
 * @param {string} id
 */
export function removeFavorite(id) {
  if (!id) return;
  let favs = getFavorites();
  const newFavs = favs.filter(b => b.id !== id);
  if (newFavs.length === favs.length) return; // nothing removed
  saveFavorites(newFavs);
  notifySubscribers(newFavs);
}

/**
 * Clear all favorites (useful for testing)
 */
export function clearFavorites() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (err) {
    console.error('clearFavorites error:', err);
  }
  notifySubscribers([]);
}


const subscribers = new Set();

function notifySubscribers(newFavs) {
  subscribers.forEach(fn => {
    try { fn(newFavs); } catch (e) { console.error('favorites subscriber error', e); }
  });
}

/**
 * Subscribe to favorites changes.
 * @param {Function} cb - callback receiving new favorites array
 * @returns {Function} unsubscribe function
 */
export function subscribe(cb) {
  if (typeof cb !== 'function') throw new Error('subscribe expects a function');
  subscribers.add(cb);
  // Immediately call with current value so caller can initialize UI
  try { cb(getFavorites()); } catch (e) { }
  return () => subscribers.delete(cb);
}
