const STORAGE_KEY = 'calcsuite_presets';

export function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePreset(preset) {
  const presets = getPresets();
  const newPreset = { ...preset, id: Date.now().toString() };
  presets.unshift(newPreset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return newPreset;
}

export function deletePreset(id) {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function renamePreset(id, name) {
  const presets = getPresets().map(p => p.id === id ? { ...p, name } : p);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}