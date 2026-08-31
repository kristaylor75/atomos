const STORAGE_KEY = 'calcsuite_notifications';

export const NOTIFICATION_TYPES = [
  { id: 'calls', labelKey: 'notifCallsLabel', descriptionKey: 'notifCallsDesc', default: true },
  { id: 'sms', labelKey: 'notifSmsLabel', descriptionKey: 'notifSmsDesc', default: true },
  { id: 'notes', labelKey: 'notifNotesLabel', descriptionKey: 'notifNotesDesc', default: true },
  { id: 'weather', labelKey: 'notifWeatherLabel', descriptionKey: 'notifWeatherDesc', default: true },
  { id: 'battery', labelKey: 'notifBatteryLabel', descriptionKey: 'notifBatteryDesc', default: true },
];

export function getNotificationPrefs() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { stored = null; }
  const prefs = {};
  for (const type of NOTIFICATION_TYPES) {
    prefs[type.id] = stored && typeof stored[type.id] === 'boolean' ? stored[type.id] : type.default;
  }
  return prefs;
}

export function isNotificationEnabled(id) {
  return getNotificationPrefs()[id] !== false;
}

export function setNotificationPref(id, enabled) {
  const prefs = getNotificationPrefs();
  prefs[id] = enabled;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('notificationprefchange', { detail: { id, enabled } }));
}