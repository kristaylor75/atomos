import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, X, ArrowLeftRight } from 'lucide-react';
import { getConversionShortcuts, removeConversionShortcut } from '@/lib/conversionShortcuts';

export default function QuickConversionsPanel() {
  const [shortcuts, setShortcuts] = useState(() => getConversionShortcuts());
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = () => setShortcuts(getConversionShortcuts());
    window.addEventListener('conversionshortcutschange', refresh);
    return () => window.removeEventListener('conversionshortcutschange', refresh);
  }, []);

  if (shortcuts.length === 0) return null;

  const goTo = (s) => navigate(`/converter?category=${encodeURIComponent(s.category)}&from=${encodeURIComponent(s.fromUnit)}&to=${encodeURIComponent(s.toUnit)}`);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-3.5 h-3.5" style={{ color: 'hsl(38 92% 60%)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>Quick Conversions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map(s => (
          <button
            key={s.id}
            onClick={() => goTo(s)}
            className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          >
            <ArrowLeftRight className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            {s.label}
            <span
              onClick={(e) => { e.stopPropagation(); removeConversionShortcut(s.id); }}
              className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}