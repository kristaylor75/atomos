/**
 * Skin definitions — each skin overrides CSS custom properties on :root
 * AND applies a body class for deep structural/aesthetic overrides in index.css.
 */

export const SKINS = [
  {
    id: 'default',
    name: 'Default',
    description: 'Dark neumorphic glassmorphism',
    nameKey: 'skin_default_name',
    descriptionKey: 'skin_default_desc',
    preview: ['#1a1f2e', '#3b82f6', '#1e2435'],
    vars: {},
    skinClass: '',
  },
  {
    id: 'ham-radio',
    name: 'Ham Radio',
    description: 'Car telematics / ham radio console',
    nameKey: 'skin_ham_radio_name',
    descriptionKey: 'skin_ham_radio_desc',
    preview: ['#111008', '#d97706', '#1c1200'],
    skinClass: 'skin-ham-radio',
    vars: {
      '--background': '35 12% 6%',
      '--foreground': '38 95% 68%',
      '--card': '35 12% 9%',
      '--card-foreground': '38 95% 68%',
      '--popover': '35 12% 9%',
      '--popover-foreground': '38 95% 68%',
      '--primary': '38 100% 52%',
      '--primary-foreground': '35 12% 6%',
      '--secondary': '35 10% 13%',
      '--secondary-foreground': '38 70% 55%',
      '--muted': '35 10% 10%',
      '--muted-foreground': '38 35% 42%',
      '--accent': '35 10% 14%',
      '--accent-foreground': '38 95% 68%',
      '--destructive': '0 80% 50%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '35 15% 17%',
      '--input': '35 10% 10%',
      '--ring': '38 100% 52%',
      '--radius': '0.25rem',
      '--neu-light': 'rgba(255,190,40,0.05)',
      '--neu-dark': 'rgba(0,0,0,0.7)',
    },
  },
  {
    id: 'pip-boy',
    name: 'Pip-Boy',
    description: 'Military survival terminal, green phosphor CRT',
    nameKey: 'skin_pip_boy_name',
    descriptionKey: 'skin_pip_boy_desc',
    preview: ['#060d06', '#1db81d', '#0a180a'],
    skinClass: 'skin-pip-boy',
    vars: {
      '--background': '120 25% 4%',
      '--foreground': '115 70% 62%',
      '--card': '120 22% 7%',
      '--card-foreground': '115 70% 62%',
      '--popover': '120 22% 7%',
      '--popover-foreground': '115 70% 62%',
      '--primary': '115 65% 42%',
      '--primary-foreground': '120 25% 4%',
      '--secondary': '120 18% 10%',
      '--secondary-foreground': '115 50% 48%',
      '--muted': '120 18% 8%',
      '--muted-foreground': '115 28% 32%',
      '--accent': '120 18% 12%',
      '--accent-foreground': '115 70% 62%',
      '--destructive': '45 95% 52%',
      '--destructive-foreground': '120 25% 4%',
      '--border': '120 22% 16%',
      '--input': '120 18% 8%',
      '--ring': '115 65% 42%',
      '--radius': '0.15rem',
      '--neu-light': 'rgba(30,200,30,0.06)',
      '--neu-dark': 'rgba(0,0,0,0.7)',
    },
  },
  {
    id: 'graphing-calc',
    name: 'Graphing Calc',
    description: 'TI-89 / Casio V.P.A.M. pixel academic terminal',
    nameKey: 'skin_graphing_calc_name',
    descriptionKey: 'skin_graphing_calc_desc',
    preview: ['#d4d0c8', '#1a1a1a', '#b8b4a8'],
    skinClass: 'skin-graphing-calc',
    vars: {
      '--background': '45 15% 82%',
      '--foreground': '0 0% 8%',
      '--card': '45 12% 76%',
      '--card-foreground': '0 0% 8%',
      '--popover': '45 12% 76%',
      '--popover-foreground': '0 0% 8%',
      '--primary': '0 0% 10%',
      '--primary-foreground': '45 15% 82%',
      '--secondary': '45 10% 70%',
      '--secondary-foreground': '0 0% 20%',
      '--muted': '45 10% 72%',
      '--muted-foreground': '0 0% 40%',
      '--accent': '45 10% 68%',
      '--accent-foreground': '0 0% 8%',
      '--destructive': '0 72% 45%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '45 8% 55%',
      '--input': '45 10% 72%',
      '--ring': '0 0% 10%',
      '--radius': '0rem',
      '--neu-light': 'rgba(255,255,255,0.5)',
      '--neu-dark': 'rgba(0,0,0,0.2)',
    },
  },
  {
    id: 'audio-rack',
    name: 'Audio Rack',
    description: 'Studio hardware, Akai / Roland rack unit',
    nameKey: 'skin_audio_rack_name',
    descriptionKey: 'skin_audio_rack_desc',
    preview: ['#0d0d0d', '#86efac', '#1a1a1a'],
    skinClass: 'skin-audio-rack',
    vars: {
      '--background': '0 0% 7%',
      '--foreground': '120 60% 75%',
      '--card': '0 0% 10%',
      '--card-foreground': '120 60% 75%',
      '--popover': '0 0% 10%',
      '--popover-foreground': '120 60% 75%',
      '--primary': '120 55% 55%',
      '--primary-foreground': '0 0% 5%',
      '--secondary': '0 0% 15%',
      '--secondary-foreground': '120 40% 55%',
      '--muted': '0 0% 12%',
      '--muted-foreground': '0 0% 42%',
      '--accent': '0 0% 17%',
      '--accent-foreground': '120 60% 75%',
      '--destructive': '0 85% 55%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '0 0% 22%',
      '--input': '0 0% 12%',
      '--ring': '120 55% 55%',
      '--radius': '0.2rem',
      '--neu-light': 'rgba(255,255,255,0.05)',
      '--neu-dark': 'rgba(0,0,0,0.75)',
    },
  },
  {
    id: 'retro-scifi',
    name: 'Retro Sci-Fi',
    description: 'Windows 95 / LCARS hybrid space station',
    nameKey: 'skin_retro_scifi_name',
    descriptionKey: 'skin_retro_scifi_desc',
    preview: ['#000080', '#c0c0c0', '#008080'],
    skinClass: 'skin-retro-scifi',
    vars: {
      '--background': '240 100% 10%',
      '--foreground': '0 0% 90%',
      '--card': '240 60% 14%',
      '--card-foreground': '0 0% 90%',
      '--popover': '240 60% 14%',
      '--popover-foreground': '0 0% 90%',
      '--primary': '180 100% 45%',
      '--primary-foreground': '240 100% 5%',
      '--secondary': '240 50% 20%',
      '--secondary-foreground': '0 0% 80%',
      '--muted': '240 50% 16%',
      '--muted-foreground': '240 20% 60%',
      '--accent': '240 50% 22%',
      '--accent-foreground': '0 0% 90%',
      '--destructive': '0 90% 55%',
      '--destructive-foreground': '0 0% 100%',
      '--border': '240 40% 28%',
      '--input': '240 50% 16%',
      '--ring': '180 100% 45%',
      '--radius': '0rem',
      '--neu-light': 'rgba(192,192,255,0.08)',
      '--neu-dark': 'rgba(0,0,0,0.6)',
    },
  },
];

const STORAGE_KEY = 'omnicale_skin';
const DEFAULT_SKIN_ID = 'default';

export function getSkin() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && SKINS.some(s => s.id === saved) ? saved : DEFAULT_SKIN_ID;
}

export function forceDefaultSkin() {
  localStorage.setItem(STORAGE_KEY, DEFAULT_SKIN_ID);
  applySkinsVars(DEFAULT_SKIN_ID);
  window.dispatchEvent(new Event('skinchange'));
}

export function setSkin(id) {
  localStorage.setItem(STORAGE_KEY, id);
  applySkinsVars(id);
  window.dispatchEvent(new Event('skinchange'));
}

export function applySkinsVars(id) {
  const skin = SKINS.find(s => s.id === id) || SKINS[0];
  const root = document.documentElement;
  // Remove all skin classes and CSS vars from previous skin
  SKINS.forEach(s => {
    if (s.skinClass) root.classList.remove(s.skinClass);
    Object.keys(s.vars).forEach(k => root.style.removeProperty(k));
  });
  // Apply new skin
  Object.entries(skin.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  if (skin.skinClass) root.classList.add(skin.skinClass);
}