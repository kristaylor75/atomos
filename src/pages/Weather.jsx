import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Search, Loader2, Cloud, Wind, Droplets, Gauge, Thermometer, Navigation } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { haptics } from '@/lib/haptics';
import { addHistoryEntry, getHistory } from '@/lib/history';
import { WMO_ICONS, WMO_KEYS } from '@/lib/weatherCodes';
import WeatherHistoryChart from '@/components/weather/WeatherHistoryChart';
import WeatherForecast from '@/components/weather/WeatherForecast';
import WeatherMap from '@/components/weather/WeatherMap';
import ExportHistory from '@/components/ExportHistory';
import WeatherReportDashboard from '@/components/weather/WeatherReportDashboard';

function compass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

export default function Weather() {
  const { t, lang } = useLanguage();
  const [coords, setCoords] = useState(null);          // { lat, lon, accuracy, source }
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [query, setQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSearched, setGeoSearched] = useState(false);
  const [placeName, setPlaceName] = useState('');

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [updated, setUpdated] = useState(null);

  const [unit, setUnit] = useState(() => localStorage.getItem('weatherTempUnit') || 'F');
  const unitSuffix = `°${unit}`;

  const autoTimer = useRef(null);
  const [weatherEntries, setWeatherEntries] = useState([]);

  useEffect(() => {
    const load = () => setWeatherEntries(getHistory().filter(e => e.tool === 'weather'));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const fetchWeather = useCallback(async (lat, lon, label, unitOverride, isCurrentLocation) => {
    const useUnit = unitOverride || unit;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&temperature_unit=${useUnit === 'C' ? 'celsius' : 'fahrenheit'}&wind_speed_unit=mph&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Forecast request failed');
      const data = await res.json();
      setWeather(data.current);
      setForecast(data.daily);
      setUpdated(new Date());
      addHistoryEntry({
        tool: 'weather',
        input: label || `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
        result: `${data.current.temperature_2m}°${useUnit}`,
        mode: 'station',
        isCurrentLocation: !!isCurrentLocation,
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        weather_code: data.current.weather_code,
      });
    } catch (e) {
      setWeatherError(t('weatherOffline'));
    } finally {
      setWeatherLoading(false);
    }
  }, [t, unit]);

  const toggleUnit = (u) => {
    if (u === unit) return;
    setUnit(u);
    localStorage.setItem('weatherTempUnit', u);
    if (coords) fetchWeather(coords.lat, coords.lon, placeName, u);
  };

  const applyCoords = useCallback((lat, lon, label, source, accuracy) => {
    setCoords({ lat, lon, accuracy, source });
    setPlaceName(label);
    haptics.click();
    fetchWeather(lat, lon, label, undefined, source === 'gps');
  }, [fetchWeather]);

  const getLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocError(t('weatherGeoUnsupported'));
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        applyCoords(latitude, longitude, t('weatherCurrentLocation'), 'gps', accuracy);
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === 1 ? t('weatherLocationDenied') : t('weatherOffline'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [applyCoords, t]);

  const searchLocation = useCallback(async () => {
    if (!query.trim()) return;
    setGeoLoading(true);
    setGeoSearched(true);
    setLocError('');
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=${lang}&format=json`);
      const data = await res.json();
      setGeoResults(data.results || []);
    } catch {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, [query]);

  const pickPlace = (r) => {
    setQuery('');
    setGeoResults([]);
    setGeoSearched(false);
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
    applyCoords(r.latitude, r.longitude, label, 'search', null);
  };

  // Auto-refresh the single station every 10 minutes while a location is set.
  useEffect(() => {
    if (!coords) return;
    autoTimer.current = setInterval(() => fetchWeather(coords.lat, coords.lon, placeName, undefined, coords.source === 'gps'), 10 * 60 * 1000);
    return () => clearInterval(autoTimer.current);
  }, [coords, placeName, fetchWeather]);

  const WIcon = weather ? (WMO_ICONS[weather.weather_code] || Cloud) : Cloud;
  const wmoLabel = weather ? t(WMO_KEYS[weather.weather_code] || '') : '';

  return (
    <div className="p-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t('weatherTitle')}</h1>
        <div className="flex rounded-lg overflow-hidden border shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
          <button
            onClick={() => toggleUnit('F')}
            className="px-3 py-1 text-xs font-semibold transition-colors"
            style={{ background: unit === 'F' ? 'hsl(var(--primary))' : 'transparent', color: unit === 'F' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
          >
            °F
          </button>
          <button
            onClick={() => toggleUnit('C')}
            className="px-3 py-1 text-xs font-semibold transition-colors"
            style={{ background: unit === 'C' ? 'hsl(var(--primary))' : 'transparent', color: unit === 'C' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
          >
            °C
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
      <div>
      {/* ── GPS coordinates ── */}
      <div className="panel p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('weatherCoordinates')}
          </span>
          <button
            onClick={getLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--primary))' }}
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {locating ? t('weatherLocating') : t('weatherGetLocation')}
          </button>
        </div>

        {coords ? (
          <div className="display-screen">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold font-mono truncate" style={{ color: 'hsl(var(--foreground))' }}>
                  {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                </p>
                <p className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {coords.source === 'gps' ? `GPS · ±${Math.round(coords.accuracy || 0)} m · ` : ''}{placeName}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {locError || t('weatherCoordsHint')}
          </p>
        )}
      </div>

      {/* ── Location search ── */}
      <div className="panel p-4 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('weatherEnterLocation')}
        </span>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchLocation()}
            placeholder={t('weatherSearchPlaceholder')}
            className="neu-input flex-1 text-sm"
          />
          <button
            onClick={searchLocation}
            disabled={geoLoading}
            className="calc-btn w-10 h-10 flex items-center justify-center shrink-0"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
        {geoSearched && !geoLoading && geoResults.length === 0 && (
          <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('weatherNoResults')}</p>
        )}
        {geoResults.length > 0 && (
          <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto">
            {geoResults.map((r, i) => (
              <li key={`${r.id}-${i}`}>
                <button
                  onClick={() => pickPlace(r)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                  style={{ background: i % 2 === 0 ? 'hsl(var(--secondary) / 0.5)' : 'transparent', border: '1px solid transparent' }}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="truncate">{[r.name, r.admin1, r.country].filter(Boolean).join(', ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      <div>
      {/* ── Weather station ── */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('weatherStation')}
          </span>
          {updated && (
            <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('weatherUpdated')} {updated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {!coords && !weather && !weatherLoading && (
          <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('weatherStationHint')}
          </p>
        )}

        {weatherLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          </div>
        )}

        {weatherError && !weatherLoading && (
          <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--destructive))' }}>{weatherError}</p>
        )}

        {weather && !weatherLoading && (
          <div className="display-screen">
            <div className="flex items-center gap-4">
              <WIcon className="w-14 h-14 shrink-0" style={{ color: weather.is_day ? 'hsl(38 92% 60%)' : 'hsl(217 91% 60%)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                    {Math.round(weather.temperature_2m)}
                  </span>
                  <span className="text-lg font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{unitSuffix}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{wmoLabel || '—'}</p>
                <p className="text-[10px] truncate font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{placeName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
              <Metric icon={Thermometer} label={t('weatherFeelsLike')} value={`${Math.round(weather.apparent_temperature)}${unitSuffix}`} />
              <Metric icon={Wind} label={t('weatherWind')} value={`${Math.round(weather.wind_speed_10m)} mph ${compass(weather.wind_direction_10m)}`} />
              <Metric icon={Droplets} label={t('weatherHumidity')} value={`${weather.relative_humidity_2m}%`} />
              <Metric icon={Gauge} label={t('weatherPressure')} value={`${Math.round(weather.pressure_msl)} hPa`} />
            </div>
          </div>
        )}
      </div>

      <WeatherForecast daily={forecast} />
      <WeatherMap coords={coords} />

      {/* ── Weather history trends ── */}
      <div className="mt-3">
        <div className="flex justify-end mb-2">
          <ExportHistory entries={weatherEntries} filter="weather" />
        </div>
        <WeatherHistoryChart coords={coords} tempUnit={unit} days={7} />
      </div>

      <WeatherReportDashboard />
      </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
        <p className="text-xs font-semibold font-mono truncate" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
      </div>
    </div>
  );
}