import { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud, Droplets, MapPin, Loader2, Search, Navigation } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { addHistoryEntry } from '@/lib/history';
import { WMO_ICONS, WMO_KEYS } from '@/lib/weatherCodes';

const STORE_KEY = 'weatherWidgetLocation';
const MIN_MOVE_KM = 8; // refetch forecast only after moving this far

function haversine(aLat, aLon, bLat, bLon) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function WeatherWidget() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const watchIdRef = useRef(null);
  const lastRef = useRef(null);   // { lat, lon, label }

  const load = useCallback(async (lat, lon, label) => {
    setLoading(true); setError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=4&language=${lang}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fail');
      const json = await res.json();
      setData(json);
      const label2 = label || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      setPlace(label2);
      lastRef.current = { lat, lon, label: label2 };
      localStorage.setItem(STORE_KEY, JSON.stringify({ lat, lon, label: label2 }));
      addHistoryEntry({
        tool: 'weather',
        input: label2,
        result: `${json.current.temperature_2m}°F`,
        mode: 'station',
        temperature: json.current.temperature_2m,
        humidity: json.current.relative_humidity_2m,
      });
    } catch {
      setError(t('weatherOffline'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Continuous tracking — only started AFTER the user grants permission via the
  // explicit one-shot request triggered by a click (browsers block geolocation
  // prompts that fire automatically, especially inside an iframe).
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) { setError(t('weatherOffline')); return; }
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const prev = lastRef.current;
        const moved = prev ? haversine(prev.lat, prev.lon, latitude, longitude) >= MIN_MOVE_KM : true;
        if (moved) load(latitude, longitude, t('weatherCurrentLocation'));
        else setLoading(false);
      },
      () => {
        setLoading(false);
        setError(t('weatherLocationDenied'));
        setShowSearch(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [load, t]);

  // IP-based geolocation fallback — requires no browser permission, so it works
  // even when geolocation is blocked or denied (common inside an iframe). Gives
  // an approximate location good enough for a local forecast.
  const loadFromIp = useCallback(async () => {
    // ipwho.is is CORS-friendly and needs no API key or browser permission.
    try {
      const res = await fetch('https://ipwho.is/');
      if (!res.ok) return false;
      const j = await res.json();
      if (!j.success && typeof j.latitude !== 'number') return false;
      if (typeof j.latitude === 'number' && typeof j.longitude === 'number') {
        const label = [j.city, j.region, j.country].filter(Boolean).join(', ');
        await load(j.latitude, j.longitude, label || t('weatherCurrentLocation'));
        return true;
      }
    } catch {}
    return false;
  }, [load, t]);

  // One-shot request fired from a user click — this is what reliably shows the
  // browser permission dialog. Once granted, switch to continuous tracking.
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) { setError(t('weatherOffline')); return; }
    setLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        load(latitude, longitude, t('weatherCurrentLocation'));
        startWatch();
      },
      () => {
        // Permission blocked or denied — fall back to IP geolocation so the
        // weather still loads; only show the error if that fails too.
        loadFromIp().then((ok) => {
          if (!ok) {
            setLoading(false);
            setError(t('weatherLocationDenied'));
            setShowSearch(true);
          }
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [load, startWatch, t, loadFromIp]);

  useEffect(() => {
    // Restore last known location so the widget is never empty. If there is none,
    // fall back to IP-based geolocation (no permission required), so the weather
    // shows even when browser geolocation is blocked/denied.
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(STORE_KEY)); } catch {}
    if (stored) load(stored.lat, stored.lon, stored.label);
    else loadFromIp();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [load, loadFromIp]);

  const searchLocation = useCallback(async () => {
    if (!query.trim()) return;
    setGeoLoading(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`);
      setGeoResults((await res.json()).results || []);
    } catch { setGeoResults([]); } finally { setGeoLoading(false); }
  }, [query]);

  const pickPlace = (r) => {
    setQuery(''); setGeoResults([]); setShowSearch(false);
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
    load(r.latitude, r.longitude, label);
  };

  const cur = data?.current;
  const daily = data?.daily;
  const CurIcon = cur ? (WMO_ICONS[cur.weather_code] || Cloud) : Cloud;
  const wmoLabel = cur ? t(WMO_KEYS[cur.weather_code] || '') : '';

  return (
    <div className="panel p-4 mb-3 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70">{t('weatherStation')}</span>
        <div className="flex items-center gap-2">
          {place && <div className="flex items-center gap-1 font-mono text-[10px] opacity-60"><MapPin className="w-3 h-3" />{place}</div>}
          <button onClick={requestLocation} disabled={loading} title={t('weatherGetLocation')}
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          </button>
          <button onClick={() => setShowSearch(s => !s)} title={t('weatherEnterLocation')}
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            <Search className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-2 flex gap-1.5 relative">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchLocation()}
            placeholder={t('weatherSearchPlaceholder')} className="neu-input flex-1 text-xs py-1.5" autoFocus />
          <button onClick={searchLocation} disabled={geoLoading}
            className="calc-btn w-8 h-8 flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
          {geoResults.length > 0 && (
            <ul className="absolute z-20 mt-9 left-0 w-56 max-h-40 overflow-y-auto panel">
              {geoResults.map((r, i) => (
                <li key={`${r.id}-${i}`}>
                  <button onClick={() => pickPlace(r)} className="w-full text-left px-2 py-1.5 text-xs flex items-center gap-1.5"
                    style={{ background: i % 2 ? 'transparent' : 'hsl(var(--secondary)/0.4)' }}>
                    <MapPin className="w-3 h-3 shrink-0 opacity-50" />
                    <span className="truncate">{[r.name, r.admin1, r.country].filter(Boolean).join(', ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading && !cur && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </div>
      )}
      {!cur && !loading && (
        <div className="flex flex-col items-center gap-2 py-4">
          {error && (
            <p className="text-[11px] text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{error}</p>
          )}
          <button onClick={requestLocation} disabled={loading}
            className="calc-btn px-3 py-2 text-xs font-semibold flex items-center gap-1.5 w-full justify-center"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            <Navigation className="w-3.5 h-3.5" />
            {t('weatherGetLocation')}
          </button>
        </div>
      )}

      {cur && (
        <>
          <div className="flex items-center gap-3">
            <CurIcon className="w-10 h-10 shrink-0" style={{ color: cur.is_day ? 'hsl(38 92% 60%)' : 'hsl(217 91% 60%)' }} />
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono" style={{ color: 'hsl(var(--foreground))' }}>{Math.round(cur.temperature_2m)}</span>
                <span className="text-sm font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>°F</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{wmoLabel || '—'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Droplets className="w-3.5 h-3.5" />{cur.relative_humidity_2m}%
            </div>
          </div>
          {daily && (
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {daily.time.map((d, i) => {
                const DIcon = WMO_ICONS[daily.weather_code[i]] || Cloud;
                const dt = new Date(d);
                return (
                  <div key={d} className="flex flex-col items-center gap-1 py-1.5 rounded-md" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
                    <span className="text-[9px] font-mono opacity-70 uppercase">{i === 0 ? t('weatherDayToday') : new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(dt)}</span>
                    <DIcon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>{Math.round(daily.temperature_2m_max[i])}°</span>
                    <span className="text-[9px] font-mono opacity-50">{Math.round(daily.temperature_2m_min[i])}°</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}