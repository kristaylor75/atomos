const STORAGE_KEY = 'composite_shape_presets';

export function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePreset(name, shapes) {
  const presets = loadPresets();
  presets.push({ id: crypto.randomUUID(), name, shapes });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}

export function deletePreset(id) {
  const presets = loadPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}