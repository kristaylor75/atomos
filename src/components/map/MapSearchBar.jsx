import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MapSearchBar({ onSelectLocation }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setResults(data);
      if (data.length === 0) setError(t('mapNoResults'));
    } catch {
      setError(t('mapSearchError'));
    } finally {
      setLoading(false);
    }
  };

  const pick = (r) => {
    onSelectLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name });
    setResults([]);
    setQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="mb-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('mapSearchPlaceholder')}
          className="neu-input text-sm flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs mt-1" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
      {results.length > 0 && (
        <div className="mt-2 panel divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-xs hover:opacity-80"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}