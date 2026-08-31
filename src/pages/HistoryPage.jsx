import { useState, useEffect, useCallback } from 'react';
import { getHistory, clearHistory, deleteHistoryEntry, formatHistoryEntry, formatHistoryTimestamp } from '@/lib/history';
// import { appData } from "@/api/localClient";
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExportHistory from '@/components/ExportHistory';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const TOOLS = ['all', 'calculator', 'converter', 'datetime', 'geometry', 'graphing', 'radio', 'weather', 'generator', 'textconverter', 'notes', 'map', 'calls'];
const TOOL_LABEL_KEYS = {
  all: 'histAll',
  calculator: 'navCalculator',
  converter: 'navConverter',
  datetime: 'navDateTime',
  geometry: 'navGeometry',
  graphing: 'navGraphing',
  radio: 'navRadio',
  weather: 'navWeather',
  generator: 'navGenerator',
  textconverter: 'textConverterTitle',
  notes: 'navNotes',
  map: 'navMap',
  calls: 'navCalls',
};

const TOOL_COLORS = {
  calculator:   { bg: 'hsl(217 91% 60% / 0.12)', text: 'hsl(217 80% 70%)', border: 'hsl(217 91% 60% / 0.2)' },
  converter:    { bg: 'hsl(173 58% 45% / 0.12)', text: 'hsl(173 58% 65%)', border: 'hsl(173 58% 45% / 0.2)' },
  datetime:     { bg: 'hsl(38 92% 60% / 0.12)',  text: 'hsl(38 92% 70%)',  border: 'hsl(38 92% 60% / 0.2)'  },
  geometry:     { bg: 'hsl(280 65% 65% / 0.12)', text: 'hsl(280 65% 75%)', border: 'hsl(280 65% 65% / 0.2)' },
  graphing:     { bg: 'hsl(280 65% 65% / 0.12)', text: 'hsl(280 65% 75%)', border: 'hsl(280 65% 65% / 0.2)' },
  radio:        { bg: 'hsl(173 58% 45% / 0.12)', text: 'hsl(173 58% 65%)', border: 'hsl(173 58% 45% / 0.2)' },
  weather:      { bg: 'hsl(217 91% 60% / 0.12)', text: 'hsl(217 80% 70%)', border: 'hsl(217 91% 60% / 0.2)' },
  generator:    { bg: 'hsl(340 75% 58% / 0.12)', text: 'hsl(340 75% 70%)', border: 'hsl(340 75% 58% / 0.2)' },
  textconverter:{ bg: 'hsl(173 58% 45% / 0.12)', text: 'hsl(173 58% 65%)', border: 'hsl(173 58% 45% / 0.2)' },
  notes:        { bg: 'hsl(38 92% 60% / 0.12)',  text: 'hsl(38 92% 70%)',  border: 'hsl(38 92% 60% / 0.2)'  },
  map:          { bg: 'hsl(120 45% 45% / 0.12)', text: 'hsl(120 45% 60%)', border: 'hsl(120 45% 45% / 0.2)' },
  calls:        { bg: 'hsl(38 92% 60% / 0.12)',  text: 'hsl(38 92% 70%)',  border: 'hsl(38 92% 60% / 0.2)'  },
};

function formatDuration(sec) {
  const total = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(total / 60), s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HistoryPage() {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [callEntries, setCallEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [, forceRefresh] = useState(0);

  const load = () => setEntries(getHistory());

  // Re-render timestamps immediately when the date/time format preference changes
  useEffect(() => {
    const sync = () => forceRefresh(n => n + 1);
    window.addEventListener('dateformatchange', sync);
    window.addEventListener('timeformatchange', sync);
    return () => {
      window.removeEventListener('dateformatchange', sync);
      window.removeEventListener('timeformatchange', sync);
    };
  }, []);

  const loadCalls = useCallback(async () => {
    const me = await appData.auth.me();
    const completed = await appData.entities.Communication.filter({ type: 'call', call_status: 'completed' }, '-timestamp', 200);
    const mine = completed.filter(c => c.sender_email === me.email || c.recipient_email === me.email);
    setCallEntries(mine.map(c => ({
      id: `call-${c.id}`,
      communicationId: c.id,
      tool: 'calls',
      input: c.sender_email === me.email ? c.recipient_email : c.sender,
      result: formatDuration(c.duration_seconds),
      timestamp: c.timestamp || c.created_date,
    })));
  }, []);

  useEffect(() => { load(); loadCalls(); }, [loadCalls]);

  const combined = [...entries, ...callEntries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const filtered = filter === 'all' ? combined : combined.filter(e => e.tool === filter);

  const handleClear = async () => {
    if (filter === 'calls') {
      await Promise.all(callEntries.map(e => appData.entities.Communication.delete(e.communicationId)));
      loadCalls();
      return;
    }
    clearHistory(filter === 'all' ? null : filter);
    load();
  };

  const handleDelete = async (entry) => {
    if (entry.tool === 'calls') {
      await appData.entities.Communication.delete(entry.communicationId);
      loadCalls();
      return;
    }
    deleteHistoryEntry(entry.id);
    load();
  };

  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('histTitle')}</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('histSubtitle')}</p>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <ExportHistory entries={filtered} filter={filter} />
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                color: 'hsl(var(--destructive))',
                border: '1px solid hsl(var(--destructive) / 0.25)',
                background: 'hsl(var(--destructive) / 0.06)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--destructive) / 0.06)'}
            >
              <Trash2 className="w-4 h-4" />
              {t('histClear')} {filter === 'all' ? t('histAll') : t(TOOL_LABEL_KEYS[filter])}
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="tab-bar mb-5 flex-wrap">
        {TOOLS.map(tool => (
          <button
            key={tool}
            onClick={() => setFilter(tool)}
            className={cn('tab-item', filter === tool && 'active')}
          >
            {t(TOOL_LABEL_KEYS[tool])}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'hsl(var(--muted))',
              boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.35), inset -1px -1px 3px rgba(255,255,255,0.03)',
            }}
          >
            <Clock className="w-7 h-7 opacity-25" />
          </div>
          <p className="text-sm">{t('histEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const colors = TOOL_COLORS[entry.tool] || TOOL_COLORS.calculator;
            const { input, result } = formatHistoryEntry(entry, t, lang);
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 group transition-all"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.3), -1px -1px 3px rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
                onMouseLeave={e => e.currentTarget.style.background = 'hsl(var(--card))'}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {TOOL_LABEL_KEYS[entry.tool] ? t(TOOL_LABEL_KEYS[entry.tool]) : entry.tool}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                      {formatHistoryTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{input}</p>
                  <p className="text-sm font-semibold font-mono truncate text-foreground">{result}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry)}
                  className="ml-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}