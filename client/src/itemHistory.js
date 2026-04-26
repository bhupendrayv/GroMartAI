/**
 * Tracks item usage frequency in localStorage.
 * Each entry: { name, category, price, count }
 */
const HISTORY_KEY = 'grocerio_item_history';

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const recordItem = (name, category = 'Other', price = 0) => {
  if (!name?.trim()) return;
  const history = getHistory();
  const norm = name.trim().toLowerCase();
  const existing = history.find(h => h.name.toLowerCase() === norm);
  if (existing) {
    existing.count += 1;
    existing.category = category; // update to latest category
    if (price > 0) existing.price = price;
  } else {
    history.push({ name: name.trim(), category, price: price || 0, count: 1 });
  }
  // Keep only top 100 by frequency
  history.sort((a, b) => b.count - a.count);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
};

export const getSuggestions = (query = '', limit = 6) => {
  const history = getHistory();
  if (!query.trim()) {
    // Return top-used items when no query
    return history.slice(0, limit);
  }
  const q = query.toLowerCase();
  return history
    .filter(h => h.name.toLowerCase().includes(q))
    .slice(0, limit);
};
