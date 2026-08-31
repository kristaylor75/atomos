// Registry + persistence for the customizable, drag-and-drop Home dashboard widgets.
// Every entry renders its own functional mini-widget component (see WIDGET_COMPONENTS in PipBoyHome.jsx).
const STORAGE_KEY = 'pipboy_home_widgets';

export const AVAILABLE_WIDGETS = [
  { id: 'status', label: 'System Status', labelKey: 'sysStatusTitle' },
  { id: 'weather', label: 'Weather Station', labelKey: 'weatherStation' },
  { id: 'converter', label: 'Quick Convert', labelKey: 'homeQuickConvert' },
  { id: 'todayNotes', label: "Today's Notes", labelKey: 'homeTodayNotes' },
  { id: 'communications', label: 'Communications', labelKey: 'navCatCommunications' },
  { id: 'calculator', label: 'Calculator', labelKey: 'navCalculator' },
  { id: 'datetime', label: 'Date & Time', labelKey: 'navDateTime' },
  { id: 'geometry', label: 'Geometry', labelKey: 'navGeometry' },
  { id: 'graphing', label: 'Graphing', labelKey: 'navGraphing' },
  { id: 'notes', label: 'Notes', labelKey: 'navNotes' },
  { id: 'generator', label: 'Generator', labelKey: 'navGenerator' },
  { id: 'textConverter', label: 'Text Converter', labelKey: 'homeToolTextConverter' },
  { id: 'radio', label: 'Radio', labelKey: 'navRadio' },
  { id: 'history', label: 'History', labelKey: 'navHistory' },
  { id: 'analytics', label: 'Usage Analytics', labelKey: 'homeUsageAnalytics' },
];

export function getHomeWidgets() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return stored;
  } catch {}
  return [];
}

export function setHomeWidgets(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('homewidgetschange'));
}