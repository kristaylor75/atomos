import { useState, useEffect } from 'react';
import { getHistory, clearHistory, formatHistoryEntry } from '@/lib/history';
import { Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import SendTo from '@/components/SendTo';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function InlineHistory({ tool, onSelect }) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const load = () => {
    const all = getHistory();
    setEntries(tool ? all.filter(e => e.tool === tool) : all);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [tool]);

  if (entries.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {t('recent')}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => { clearHistory(tool); load(); }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="max-h-80 overflow-y-auto">
          {entries.slice(0, 20).map((entry, i) => {
            const { input, result } = formatHistoryEntry(entry, t, lang);
            return (
            <div
              key={entry.id}
              className="px-4 py-2.5 group transition-colors"
              style={{
                borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <p className="text-[10px] font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {input}
              </p>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p
                  onClick={() => onSelect?.(entry)}
                  className={`text-sm font-semibold font-mono truncate flex-1 ${onSelect ? 'cursor-pointer' : ''}`}
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {result}
                </p>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <SendTo value={entry.result} exclude={entry.tool} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}