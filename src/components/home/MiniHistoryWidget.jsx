import { useState, useEffect } from 'react';
import { History, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistoryEntry, formatHistoryEntry } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniHistoryWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(getHistory().slice(0, 4));
    const id = setInterval(() => setEntries(getHistory().slice(0, 4)), 5000);
    return () => clearInterval(id);
  }, []);

  const remove = (id) => { deleteHistoryEntry(id); setEntries(getHistory().slice(0, 4)); };

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> {t('navHistory')}
        </span>
        <button onClick={() => navigate('/history')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('histEmpty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => {
            const { input, result } = formatHistoryEntry(e, t);
            return (
            <li key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--secondary) / 0.4)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-foreground">{input}</p>
                <p className="text-[10px] truncate opacity-60">{result}</p>
              </div>
              <button onClick={() => remove(e.id)} style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}