import { useState, useMemo } from 'react';
import { ALL_CURRENCIES, getEnabledCurrencies, setEnabledCurrencies } from '@/lib/currencyPrefs';
import { Search, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getCurrencyName } from '@/lib/currencyNames';

const DEFAULT_ENABLED = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'mxn'];

export default function CurrencyCustomizer({ enabled, onChange }) {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return Object.entries(ALL_CURRENCIES).filter(([key, c]) => {
      if (!q) return true;
      const localName = getCurrencyName(c.code, lang, c.label).toLowerCase();
      return localName.includes(q) || c.code.toLowerCase().includes(q) || key.includes(q);
    });
  }, [search, lang]);

  const toggle = (key) => {
    if (enabled.includes(key)) {
      if (enabled.length <= 2) return; // keep at least 2
      onChange(enabled.filter(k => k !== key));
    } else {
      onChange([...enabled, key]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t('currencySelection')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{enabled.length} {t('currencyOf')} {Object.keys(ALL_CURRENCIES).length} {t('currencyEnabled')}</p>
        </div>
        <button
          onClick={() => onChange(DEFAULT_ENABLED)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> {t('currencyReset')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('currencySearch')}
          className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[480px] overflow-y-auto pr-1">
        {filtered.map(([key, c]) => {
          const isOn = enabled.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                isOn
                  ? 'bg-primary/5 border-primary/30 text-foreground'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{c.code}</p>
                <p className="text-[11px] truncate opacity-75">{getCurrencyName(c.code, lang, c.label)}</p>
              </div>
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                isOn ? 'bg-primary border-primary' : 'border-muted-foreground/40'
              )}>
                {isOn && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground text-center py-8">{t('currencyNoResults')}</p>
        )}
      </div>
    </div>
  );
}