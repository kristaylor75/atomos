import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Past-week daily weather history for the user's current location, sourced
// from the Open-Meteo Archive (ERA5 reanalysis) API. Only renders once a
// location is available — without coords there is nothing to look up.
export default function WeatherHistoryChart({ coords, tempUnit = 'F', days = 7, title }) {
  const { t, lang } = useLanguage();
  const displayTitle = title || t('weatherHistoryTitle');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coords) { setData(null); setError(''); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const end = new Date();
        const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
        const fmt = (d) => d.toISOString().slice(0, 10);
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}` +
          `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&temperature_unit=${tempUnit === 'C' ? 'celsius' : 'fahrenheit'}&precipitation_unit=mm&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('history fetch failed');
        const json = await res.json();
        const d = json.daily || {};
        const arr = (d.time || []).map((iso, i) => ({
          date: new Date(iso + 'T00:00:00'),
          tmax: d.temperature_2m_max?.[i],
          tmin: d.temperature_2m_min?.[i],
          precip: d.precipitation_sum?.[i] ?? 0,
        }));
        if (!cancelled) setData(arr);
      } catch (e) {
        if (!cancelled) setError(t('weatherOffline'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lon, tempUnit, days]);

  if (!coords) {
    return (
      <div className="panel p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{displayTitle}</span>
        <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('weatherHistoryNoLoc') }</p>
      </div>
    );
  }
  if (loading && !data) {
    return (
      <div className="panel p-4 flex items-center justify-center" style={{ minHeight: 240 }}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('weatherLocating')}</span>
        </div>
      </div>
    );
  }
  if (error || !data || data.length === 0) {
    return (
      <div className="panel p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{displayTitle}</span>
        <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{error || t('weatherHistoryEmpty')}</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: new Intl.DateTimeFormat(lang || undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(d.date),
    tmax: d.tmax,
    tmin: d.tmin,
  }));

  return (
    <div className="panel p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: 'hsl(var(--muted-foreground))' }}>{displayTitle}</span>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} unit={`°${tempUnit}`} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="tmax" name={`${t('weatherHigh') || 'High'} (°${tempUnit})`} stroke="hsl(0 72% 58%)" dot={{ r: 2 }} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="tmin" name={`${t('weatherLow') || 'Low'} (°${tempUnit})`} stroke="hsl(217 91% 60%)" dot={{ r: 2 }} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}