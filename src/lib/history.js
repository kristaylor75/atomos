import { format } from 'date-fns';
import { getUnitLabel } from './unitData';
import { getDateFormat, getTimeFormat } from './dateFormatPref';

const HISTORY_KEY = 'calcsuite_history';

// Formats a history entry's timestamp using the user's chosen date/time
// format from Settings, instead of the browser's default locale format.
export function formatHistoryTimestamp(timestamp) {
  const d = new Date(timestamp);
  const timePattern = getTimeFormat() === '12h' ? 'h:mm a' : 'HH:mm';
  try {
    return format(d, `${getDateFormat()} ${timePattern}`);
  } catch {
    return d.toLocaleString();
  }
}
const MAX_ENTRIES = 100;

// Builds the display input/result strings for a history entry using the
// CURRENT language, rather than whatever language was active when it was
// saved. Entries that store raw unit keys / flags (converter, weather
// "current location") are re-translated live; everything else falls back
// to its stored input/result strings.
export function formatHistoryEntry(entry, t, lang = 'en') {
  if (entry.tool === 'converter' && entry.fromUnit && entry.toUnit) {
    const fromLabel = getUnitLabel(entry.fromUnit, entry.category, t, lang);
    const toLabel = getUnitLabel(entry.toUnit, entry.category, t, lang);
    return { input: `${entry.value} ${fromLabel}`, result: `${entry.resultValue} ${toLabel}` };
  }
  if (entry.tool === 'weather' && entry.isCurrentLocation) {
    return { input: t('weatherCurrentLocation'), result: entry.result };
  }
  if (entry.tool === 'radio' && entry.isSearchAction) {
    return { input: t('radioTabSearch'), result: entry.result };
  }
  if (entry.tool === 'geometry' && entry.shapeKey) {
    const shapeLabel = t(`geoShape_${entry.shapeKey}`) || entry.shapeKey;
    const fieldSummary = (entry.fieldEntries || [])
      .map(f => {
        const label = f.modeKey === f.field ? t(`geoField_${f.field}`) : (t(`geoFormula_${f.modeKey}`) || f.modeKey);
        return `${label}=${f.value}`;
      })
      .join(', ');
    const resultSummary = (entry.results || [])
      .map(r => `${t(`geoFormula_${r.key}`) || r.key}: ${r.value}`)
      .join(' | ');
    return { input: `${shapeLabel} (${fieldSummary})`, result: resultSummary };
  }
  if (entry.tool === 'datetime' && entry.subtype === 'age') {
    return {
      input: `${t('dtTabAge')}: ${entry.birthDateFmt} \u2192 ${entry.asOfFmt}`,
      result: `${entry.years} ${t('dtAgeYearsOld')}, ${entry.months} ${t('dtAgeMonthsDays')}, ${entry.days} ${t('dtAgeDays')}`,
    };
  }
  if (entry.tool === 'datetime' && entry.subtype === 'diff') {
    return {
      input: `${t('dtDiffTitle')}: ${entry.date1Fmt} \u2192 ${entry.date2Fmt}`,
      result: `${entry.days} ${t('dtDiffDays')} (${entry.years} ${t('dtDiffYears')}, ${entry.months % 12} ${t('dtDiffMonths')})`,
    };
  }
  if (entry.tool === 'datetime' && entry.subtype === 'timezone') {
    return {
      input: `${entry.dateFmt} ${entry.time} (${entry.sourceZone})`,
      result: `${t('dtTZConvert')}: ${entry.targetCount} ${t('dtTZTargets')}`,
    };
  }
  return { input: entry.input, result: entry.result };
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry) {
  const history = getHistory();
  const newEntry = { ...entry, id: Date.now(), timestamp: new Date().toISOString() };
  const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(tool) {
  if (tool) {
    const history = getHistory().filter(e => e.tool !== tool);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } else {
    localStorage.removeItem(HISTORY_KEY);
  }
}

export function deleteHistoryEntry(id) {
  const history = getHistory().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}