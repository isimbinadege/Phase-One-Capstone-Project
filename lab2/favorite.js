// favorites.js
// Module for favorites management (localStorage + subscribe)

const LS_KEY = 'book_explorer_favorites_v1';

export function getFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('getFavorites: failed to parse localStorage value', err);
    return [];
  }
}

function saveFavorites(arr) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('saveFavorites: failed to save to localStorage', err);
  }
}

export function isFavorite(id) {
  if (!id) return false;
  const favs = getFavorites();
  return favs.some(b => b.id === id);
}

export function addFavorite(book) {
  if (!book || !book.id) {
    console.warn('addFavorite: invalid book object', book);
    return;
  }
  const favs = getFavorites();
  if (favs.some(b => b.id === book.id)) return;
  favs.unshift(book);
  saveFavorites(favs);
  notifySubscribers(favs);
}

export function removeFavorite(id) {
  if (!id) return;
  const favs = getFavorites();
  const newFavs = favs.filter(b => b.id !== id);
  if (newFavs.length === favs.length) return;
  saveFavorites(newFavs);
  notifySubscribers(newFavs);
}

export function clearFavorites() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (err) {
    console.error('clearFavorites error:', err);
  }
  notifySubscribers([]);
}

/* subscription system so pages can react immediately */
const subscribers = new Set();

function notifySubscribers(newFavs) {
  subscribers.forEach(fn => {
    try { fn(newFavs); } catch (e) { console.error('favorites subscriber error', e); }
  });
}

export function subscribe(cb) {
  if (typeof cb !== 'function') throw new Error('subscribe expects a function');
  subscribers.add(cb);
  try { cb(getFavorites()); } catch (e) { /* ignore */ }
  return () => subscribers.delete(cb);
}
