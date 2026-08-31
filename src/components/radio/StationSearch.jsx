import { useState } from 'react';
import { Search, Loader2, Radio, Play } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const GENRES = [
  { tag: 'pop', key: 'radioGenre_pop' }, { tag: 'rock', key: 'radioGenre_rock' }, { tag: 'jazz', key: 'radioGenre_jazz' },
  { tag: 'classical', key: 'radioGenre_classical' }, { tag: 'electronic', key: 'radioGenre_electronic' }, { tag: 'hip-hop', key: 'radioGenre_hiphop' },
  { tag: 'country', key: 'radioGenre_country' }, { tag: 'news', key: 'radioGenre_news' }, { tag: 'talk', key: 'radioGenre_talk' },
  { tag: 'metal', key: 'radioGenre_metal' }, { tag: 'r&b', key: 'radioGenre_rnb' }, { tag: 'ambient', key: 'radioGenre_ambient' },
];

const GENRE_BY_TAG = {};
GENRES.forEach(g => { GENRE_BY_TAG[g.tag] = g.key; });

export default function StationSearch({ onPlay, currentStation }) {
  const { t, lang } = useLanguage();

  const localizedGenre = (station) => {
    const tag = station.tags?.split(',').map(s => s.trim().toLowerCase()).find(Boolean);
    if (!tag) {
      const activeKey = GENRE_BY_TAG[genre];
      return activeKey ? t(activeKey) : null;
    }
    const key = GENRE_BY_TAG[tag];
    if (key) return t(key);
    const activeKey = GENRE_BY_TAG[genre];
    return activeKey ? t(activeKey) : (station.tags?.split(',')[0]?.trim() || tag);
  };

  const localizedCountry = (station) => {
    const code = station.countrycode;
    if (code) {
      try {
        const display = new Intl.DisplayNames([lang], { type: 'region' });
        const name = display.of(code.toUpperCase());
        if (name && name !== code) return name;
      } catch {}
    }
    return station.country || null;
  };
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim() && !genre) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        limit: 30,
        order: 'votes',
        reverse: true,
        hidebroken: true,
      });
      if (query.trim()) params.set('name', query.trim());
      if (genre) params.set('tag', genre);

      const res = await fetch(`https://de1.api.radio-browser.info/json/stations/search?${params}`);
      const data = await res.json();
      setResults(data.filter(s => s.url_resolved));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search input */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={t('radioSearchPlaceholder')}
          className="neu-input flex-1 text-sm"
        />
        <button
          onClick={search}
          className="calc-btn w-10 h-10 flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5">
        {GENRES.map(g => (
          <button
            key={g.tag}
            onClick={() => { setGenre(genre === g.tag ? '' : g.tag); haptics.tap(); }}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all"
            style={{
              background: genre === g.tag ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              color: genre === g.tag ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            {t(g.key)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {!searched && (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('radioSearchHint')}
          </p>
        )}
        {searched && results.length === 0 && !loading && (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('radioNoStationsFound')}
          </p>
        )}
        {results.map((s, i) => {
          const isActive = currentStation?.url === s.url_resolved;
          return (
            <button
              key={s.stationuuid}
              onClick={() => { haptics.click(); onPlay({ name: s.name, url: s.url_resolved, tags: s.tags, country: s.country, favicon: s.favicon }); }}
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
                <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{[localizedCountry(s), localizedGenre(s)].filter(Boolean).join(' · ')}</p>
              </div>
              {isActive && <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}