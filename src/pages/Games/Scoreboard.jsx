import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getStats } from '@/lib/gameScores';

// Small best-stats table shown alongside each game.
// props:
//   gameKey  — localStorage namespace key (e.g. 'snake')
//   stats    — [{ key, labelKey, fmt }] — fmt maps a stored value to display
export default function Scoreboard({ gameKey, stats }) {
  const { t } = useLanguage();
  const [bests, setBests] = useState(() => getStats(gameKey));

  useEffect(() => {
    const onUpdate = (e) => {
      if (!e.detail || e.detail === gameKey) setBests(getStats(gameKey));
    };
    window.addEventListener('gamescoreschange', onUpdate);
    return () => window.removeEventListener('gamescoreschange', onUpdate);
  }, [gameKey]);

  return (
    <div className="panel p-3 mt-3">
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2 font-mono">{t('scoreboard')}</div>
      <div className="grid gap-1.5">
        {stats.map((s) => (
          <div key={s.key} className="flex items-center justify-between font-mono">
            <span className="opacity-70 text-[11px] uppercase tracking-wide">{t(s.labelKey)}</span>
            <span className="font-bold text-sm">
              {bests[s.key] != null ? (s.fmt ? s.fmt(bests[s.key]) : bests[s.key]) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}