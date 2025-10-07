// main.js
// Frontend Phase 1 - main script for Book Explorer
// Assumes fetchBooks(query) is exported from ./fetchBooks.js as in your assignment

import { fetchBooks } from './fetchBooks.js';

const LS_KEY = 'book_explorer_favorites_v1';

// --- Helper: localStorage favorites management ---
function loadFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse favorites from localStorage', e);
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch (e) {
    console.error('Failed to save favorites to localStorage', e);
  }
}

function isFavorite(bookId) {
  const favs = loadFavorites();
  return favs.some(b => b.id === bookId);
}

function addFavorite(book) {
  const favs = loadFavorites();
  // avoid duplicates
  if (!favs.some(b => b.id === book.id)) {
    favs.unshift(book); // newest first
    saveFavorites(favs);
  }
}

function removeFavorite(bookId) {
  let favs = loadFavorites();
  favs = favs.filter(b => b.id !== bookId);
  saveFavorites(favs);
}

// --- Helper: DOM utilities ---
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createBookCardHTML(book, { showRemove = false } = {}) {
  // Expects book to have: id, title, author, image, description
  const safeTitle = escapeHtml(book.title || 'No title');
  const safeAuthor = escapeHtml(book.author || 'Unknown');
  const safeDesc = escapeHtml((book.description || '').toString()).slice(0, 160); // short excerpt
  const img = book.image || './assets/images/library.jpg';

  // Button label and data attribute for simplicity
  const favBtnLabel = showRemove ? 'Remove' : (isFavorite(book.id) ? 'Saved' : 'Add to Favorites');
  const favBtnClasses = showRemove
    ? 'px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md'
    : (isFavorite(book.id)
        ? 'px-3 py-2 bg-slate-400 text-slate-900 rounded-md cursor-default'
        : 'px-3 py-2 bg-sky-400 hover:bg-sky-500 text-slate-900 rounded-md');

  return `
    <article class="bg-slate-800 rounded-xl p-4 shadow-lg hover:scale-105 hover:shadow-xl transform transition-all duration-300 flex flex-col">
      <img src="${img}" alt="${safeTitle}" class="rounded-lg mb-4 w-full h-56 object-cover">
      <h3 class="text-sky-400 font-bold text-lg mb-1">${safeTitle}</h3>
      <p class="text-slate-300 text-sm mb-2">${safeAuthor}</p>
      <p class="text-slate-400 text-xs mb-4">${safeDesc}${(book.description && book.description.length > 160) ? '…' : ''}</p>
      <div class="mt-auto">
        <button data-book-id="${escapeHtml(book.id)}" class="favorite-btn ${favBtnClasses}" type="button">${favBtnLabel}</button>
        ${showRemove ? '' : `<a href="#" class="ml-2 text-xs text-slate-400 hover:text-sky-400">Details</a>`}
      </div>
    </article>
  `;
}

// --- UI helpers for loading / messages ---
function showLoading(container) {
  container.innerHTML = `
    <div class="col-span-full text-center py-10">
      <div class="inline-flex items-center gap-3">
        <svg class="animate-spin h-6 w-6 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span class="text-slate-300">Loading...</span>
      </div>
    </div>
  `;
}

function showNoResults(container, query) {
  container.innerHTML = `
    <div class="col-span-full text-center py-14 text-slate-400">
      No results found for <strong class="text-sky-400">${escapeHtml(query)}</strong>.
      <div class="mt-4 text-sm">Try different keywords or check your spelling.</div>
    </div>
  `;
}

// --- Render functions ---
function renderBooksList(container, books = []) {
  if (!container) return;
  if (!books.length) {
    container.innerHTML = '';
    showNoResults(container, '');
    return;
  }

  // compose grid items
  container.innerHTML = books.map(book => createBookCardHTML(book)).join('');
  // attach event listeners to favorite buttons
  container.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-book-id');
      // Find corresponding book object (we keep in DOM via id; but better: attach book data in a map)
      // For simplicity, read nearest card title/author/image to recreate a small book object
      const card = btn.closest('article');
      const title = card.querySelector('h3')?.textContent || 'No Title';
      const author = card.querySelector('p')?.textContent || 'Unknown';
      const img = card.querySelector('img')?.src || './assets/images/library.jpg';
      const bookObj = { id, title, author, image: img, description: card.querySelector('p + p')?.textContent || '' };

      if (isFavorite(id)) {
        // Already saved -> do nothing or inform user
        // Here we'll remove on long-press? For simplicity leave it saved; user can remove from favorites page
        return;
      } else {
        addFavorite(bookObj);
        // Update button visuals to "Saved"
        btn.textContent = 'Saved';
        btn.className = 'favorite-btn px-3 py-2 bg-slate-400 text-slate-900 rounded-md cursor-default';
      }
    });
  });
}

function renderFavoritesPage(container) {
  const favs = loadFavorites();
  if (!favs.length) {
    container.innerHTML = `<p class="text-center text-slate-500 italic col-span-full">You haven’t added any favorites yet. Add some on the homepage!</p>`;
    return;
  }

  container.innerHTML = favs.map(book => createBookCardHTML(book, { showRemove: true })).join('');

  // Attach remove handlers
  container.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-book-id');
      removeFavorite(id);
      // re-render favorites area
      renderFavoritesPage(container);
    });
  });
}

// --- Main behavior: detect page and wire up elements ---
document.addEventListener('DOMContentLoaded', () => {
  const isFavoritesPage = Boolean(document.getElementById('favorites-list'));
  const booksContainer = document.getElementById('books-container'); // homepage grid container
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');

  // If we are on favorites page
  if (isFavoritesPage) {
    const favsContainer = document.getElementById('favorites-list');
    renderFavoritesPage(favsContainer);
    return; // favorites page done
  }

  // Homepage behavior
  // If containers not present bail gracefully
  if (!booksContainer) {
    console.warn('No #books-container found on this page — main.js has nothing to render.');
    return;
  }

  // Search button and input exist? If not, create a minimal fallback to fetch default query
  // Attach search handler
  async function performSearch(query) {
    booksContainer.innerHTML = ''; // clear
    showLoading(booksContainer);

    const q = (query && query.trim()) ? query.trim() : 'best sellers';

    // Fetch books using your API module
    const books = await fetchBooks(q);

    if (!books || books.length === 0) {
      showNoResults(booksContainer, q);
      return;
    }

    // Render results
    renderBooksList(booksContainer, books);
  }

  // Wire search button
  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (!q) return;
      performSearch(q);
    });

    // Allow Enter key on input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (!q) return;
        performSearch(q);
      }
    });
  }

  // Initial load on homepage (default query)
  performSearch('javascript');
});
