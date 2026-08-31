// Tracks cumulative time the user spends on each tool page.
// Sessions are opened by Layout on route change and closed on the next route
// change, tab hide, or unload. Durations are bucketed per local calendar day so
// the analytics widget can report a 7-day trend and per-tool totals in time
// rather than raw usage counts.

const STORE_KEY = 'atomos_tooltime';
const OPEN_KEY = 'atomos_tooltime_open';
const DAY_MS = 24 * 60 * 60 * 1000;
// Cap a single session at one full day so a forgotten/un-closed session can
// never inflate a tool's total past a realistic ceiling.
const SESSION_CAP = DAY_MS;

function localDateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}

function writeStore(map) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('tooltimechange'));
  } catch { /* storage unavailable — silently ignore */ }
}

function addElapsed(tool, startTs, nowTs) {
  if (!tool) return 0;
  let elapsed = Math.max(0, nowTs - startTs);
  if (elapsed > SESSION_CAP) elapsed = SESSION_CAP;
  const key = localDateKey(startTs);
  const map = readStore();
  map[tool] = map[tool] || {};
  map[tool][key] = (map[tool][key] || 0) + elapsed;
  if (map[tool][key] > DAY_MS) map[tool][key] = DAY_MS;
  writeStore(map);
  return elapsed;
}

// Open a session for `tool`. Closing any prior open session first prevents
// cross-tool time bleed if a start is missed. A null/falsy tool just closes.
export function startToolSession(tool) {
  endToolSession();
  if (!tool) return;
  try { localStorage.setItem(OPEN_KEY, JSON.stringify({ tool, startTime: Date.now() })); } catch {}
}

export function endToolSession() {
  let raw;
  try { raw = localStorage.getItem(OPEN_KEY); } catch { return; }
  if (!raw) return;
  try { localStorage.removeItem(OPEN_KEY); } catch {}
  try {
    const { tool, startTime } = JSON.parse(raw);
    addElapsed(tool, startTime, Date.now());
  } catch { /* corrupt record — drop it */ }
}

// Returns { byTool: { tool: ms }, byDay: [{ key, ms }] } for the last `days`
// days (oldest → newest). Includes the currently-open session so the live
// dashboard reflects active use without waiting for the session to close.
export function getToolTimeStats(days = 7) {
  const map = readStore();
  const dayKeys = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dayKeys.push(localDateKey(d.getTime()));
  }

  const byTool = {};
  for (const [tool, buckets] of Object.entries(map)) {
    let total = 0;
    for (const k of dayKeys) total += buckets[k] || 0;
    if (total > 0) byTool[tool] = total;
  }

  const byDay = dayKeys.map(k => ({ key: k, ms: 0 }));
  for (const buckets of Object.values(map)) {
    for (let i = 0; i < dayKeys.length; i++) byDay[i].ms += buckets[dayKeys[i]] || 0;
  }

  try {
    const raw = localStorage.getItem(OPEN_KEY);
    if (raw) {
      const { tool, startTime } = JSON.parse(raw);
      const add = Math.max(0, Math.min(SESSION_CAP, Date.now() - startTime));
      if (tool) byTool[tool] = (byTool[tool] || 0) + add;
      const lastIdx = dayKeys.length - 1;
      if (lastIdx >= 0) byDay[lastIdx].ms += add;
    }
  } catch { /* ignore */ }

  return { byTool, byDay };
}

export function formatToolDuration(ms) {
  const total = Math.max(0, Math.round((ms || 0) / 1000));
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export function clearToolTime() {
  try {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(OPEN_KEY);
    window.dispatchEvent(new Event('tooltimechange'));
  } catch { /* ignore */ }
}