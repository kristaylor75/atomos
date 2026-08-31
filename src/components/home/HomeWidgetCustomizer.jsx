import { useState, useEffect } from 'react';
import { Settings2, Check } from 'lucide-react';
import { AVAILABLE_WIDGETS, getHomeWidgets, setHomeWidgets } from '@/lib/homeWidgets';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function HomeWidgetCustomizer() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => getHomeWidgets());

  useEffect(() => { setHomeWidgets(selected); }, [selected]);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md"
        style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted) / 0.5)' }}
      >
        <Settings2 className="w-3 h-3" /> {t('homeCustomizeWidgets')}
      </button>
      {open && (
        <div className="panel p-3 mt-2 flex flex-wrap gap-2">
          {AVAILABLE_WIDGETS.map(w => {
            const active = selected.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggle(w.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.6)',
                  border: active ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {active && <Check className="w-3 h-3" />}
                {t(w.labelKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}