import { useState } from 'react';
import { Route, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { fetchMultiRoute } from '@/lib/mapRouting';
import { useLanguage } from '@/lib/LanguageContext.jsx';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export default function TripPlanner({ waypoints, onRouteComputed, onClearRoute }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState([]); // array of waypoint objects, in order
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { distance, duration }

  const toggle = (wp) => {
    haptics.tap();
    setResult(null);
    setError('');
    onClearRoute();
    setSelected((prev) =>
      prev.some((w) => w.id === wp.id) ? prev.filter((w) => w.id !== wp.id) : [...prev, wp]
    );
  };

  const move = (index, dir) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id) => {
    setResult(null);
    setError('');
    onClearRoute();
    setSelected((prev) => prev.filter((w) => w.id !== id));
  };

  const planRoute = async () => {
    if (selected.length < 2) { setError(t('mapTripMinTwo')); return; }
    setLoading(true);
    setError('');
    try {
      const route = await fetchMultiRoute(selected.map((w) => [w.latitude, w.longitude]));
      if (!route) throw new Error('no route');
      setResult({ distance: route.distance, duration: route.duration });
      onRouteComputed(route.coords);
      haptics.success();
    } catch {
      setError(t('mapTripError'));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setSelected([]);
    setResult(null);
    setError('');
    onClearRoute();
  };

  return (
    <div className="panel p-3 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <Route className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('mapTripPlanner')}
        </span>
      </div>
      <p className="text-[10px] mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapTripSelectHint')}</p>

      {/* Waypoint picker */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {waypoints.map((wp) => {
          const idx = selected.findIndex((w) => w.id === wp.id);
          const isSelected = idx !== -1;
          return (
            <button
              key={wp.id}
              onClick={() => toggle(wp)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all"
              style={{
                background: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.5)',
                border: isSelected ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
                color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
              }}
            >
              {isSelected && <span className="font-mono font-bold">{idx + 1}.</span>}
              {wp.label}
            </button>
          );
        })}
      </div>

      {/* Selected order list */}
      {selected.length > 0 && (
        <div className="space-y-1 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
            {t('mapTripSelected')}
          </span>
          {selected.map((wp, i) => (
            <div key={wp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.4)' }}>
              <span className="text-xs font-mono font-bold w-4" style={{ color: 'hsl(var(--primary))' }}>{i + 1}</span>
              <span className="flex-1 text-sm truncate">{wp.label}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="disabled:opacity-30" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(wp.id)} style={{ color: 'hsl(var(--muted-foreground))' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={planRoute}
          disabled={loading || selected.length < 2}
          className="calc-btn flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 disabled:opacity-40"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
          {loading ? t('mapTripCalculating') : t('mapTripPlanRoute')}
        </button>
        {(selected.length > 0 || result) && (
          <button
            onClick={clear}
            className="calc-btn px-3 text-xs font-semibold"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}
          >
            {t('mapTripClear')}
          </button>
        )}
      </div>

      {error && <p className="text-xs mt-2" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}

      {result && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-lg px-3 py-2" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapTripDistance')}</p>
            <p className="text-sm font-bold font-mono">{(result.distance / 1000).toFixed(1)} km</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapTripDuration')}</p>
            <p className="text-sm font-bold font-mono">{formatDuration(result.duration)}</p>
          </div>
        </div>
      )}
    </div>
  );
}