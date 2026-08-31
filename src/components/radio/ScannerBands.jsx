import { useState, useCallback } from 'react';
import { Loader2, Radio, Play, Shield, Plane, Ship, Wifi, CloudRain, Waves } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Each band maps to one or more radio-browser.info tags. Scanner / aviation /
// marine / ham / weather feeds are real, free, browser-playable internet streams
// aggregated by the community radio-browser database.
const BANDS = [
  { id: 'scanner',  labelKey: 'radioBand_scanner', icon: Shield,   tags: ['police', 'fire', 'ems', 'scanner'] },
  { id: 'aviation', labelKey: 'radioBand_aviation', icon: Plane,    tags: ['aviation', 'atc'] },
  { id: 'marine',   labelKey: 'radioBand_marine',   icon: Ship,     tags: ['marine'] },
  { id: 'amateur',  labelKey: 'radioBand_amateur',  icon: Wifi,     tags: ['amateur', 'ham'] },
  { id: 'weather',  labelKey: 'radioBand_weather',  icon: CloudRain,tags: ['weather', 'noaa'] },
  { id: 'public',   labelKey: 'radioBand_public',   icon: Waves,    tags: ['public-safety', 'emergency'] },
];

const API = 'https://de1.api.radio-browser.info/json/stations/search';

export default function ScannerBands({ onPlay, currentStation }) {
  const { t } = useLanguage();
  const [bandId, setBandId] = useState('scanner');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (id) => {
    const band = BANDS.find(b => b.id === id) || BANDS[0];
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const fetches = band.tags.map(tag =>
        fetch(`${API}?tag=${encodeURIComponent(tag)}&limit=40&hidebroken=true&order=votes&reverse=true`)
          .then(r => r.json()).catch(() => [])
      );
      const sets = await Promise.all(fetches);
      const seen = new Set();
      const merged = sets.flat()
        .filter(s => s.url_resolved)
        .filter(s => (seen.has(s.stationuuid) ? false : seen.add(s.stationuuid), true))
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setResults(merged);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectBand = (id) => {
    haptics.tap();
    setBandId(id);
    search(id);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Band chips */}
      <div className="flex flex-wrap gap-1.5">
        {BANDS.map(b => {
          const Icon = b.icon;
          const active = bandId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => selectBand(b.id)}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: active ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <Icon className="w-3 h-3" />
              {t(b.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-[10px] leading-snug px-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {t('radioBandHint')}
      </p>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {!searched && !loading && (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('radioBandSelectHint')}
          </p>
        )}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
        )}
        {searched && !loading && results.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('radioBandNoFeeds')}
          </p>
        )}
        {results.map((s, i) => {
          const isActive = currentStation?.url === s.url_resolved;
          return (
            <button
              key={s.stationuuid}
              onClick={() => { haptics.click(); onPlay({ name: s.name, url: s.url_resolved, country: s.country, tags: s.tags, favicon: s.favicon }); }}
              className={cn('w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all')}
              style={{
                background: isActive ? 'hsl(var(--primary) / 0.15)' : i % 2 === 0 ? 'hsl(var(--secondary) / 0.4)' : 'transparent',
                border: isActive ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid transparent',
              }}
            >
              {s.favicon ? (
                <img src={s.favicon} alt="" className="w-6 h-6 rounded object-cover shrink-0" onError={e => e.target.style.display='none'} />
              ) : (
                <Radio className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{s.name}</p>
                <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{[s.country, s.tags?.split(',').slice(0, 2).join(' / ')].filter(Boolean).join(' · ')}</p>
              </div>
              {isActive && <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}