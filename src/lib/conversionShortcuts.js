// Saved unit-conversion shortcuts for quick access from the Home dashboard
const STORAGE_KEY = 'calc_conversion_shortcuts';
const MAX_SHORTCUTS = 20;

export function getConversionShortcuts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isDuplicateShortcut(category, fromUnit, toUnit) {
  return getConversionShortcuts().some(s => s.category === category && s.fromUnit === fromUnit && s.toUnit === toUnit);
}

export function saveConversionShortcut(shortcut) {
  const shortcuts = getConversionShortcuts();
  const newShortcut = { ...shortcut, id: Date.now() };
  const updated = [newShortcut, ...shortcuts].slice(0, MAX_SHORTCUTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('conversionshortcutschange'));
  return newShortcut;
}

export function removeConversionShortcut(id) {
  const updated = getConversionShortcuts().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('conversionshortcutschange'));
}