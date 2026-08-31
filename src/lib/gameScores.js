// Shared per-game best-stat persistence (localStorage).
// Each "stat" is either a "high" (highest score) or "low" (fastest time) value.
// Games call submitStat() when a run completes; Scoreboard components read the
// stored bests and react to the 'gamescoreschange' event for live updates.

const PREFIX = 'game_best_';

export function getStats(gameKey) {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + gameKey) || '{}') || {};
  } catch {
    return {};
  }
}

export function submitStat(gameKey, statKey, value, better = 'high') {
  if (value == null || (typeof value === 'number' && !isFinite(value))) return;
  const all = getStats(gameKey);
  const cur = all[statKey];
  const isBetter = cur == null || (better === 'low' ? value < cur : value > cur);
  if (!isBetter) return;
  all[statKey] = value;
  try { localStorage.setItem(PREFIX + gameKey, JSON.stringify(all)); } catch {}
  window.dispatchEvent(new CustomEvent('gamescoreschange', { detail: gameKey }));
}