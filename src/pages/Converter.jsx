import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getUnitCategories, UNIT_CATEGORIES_RAW, convertUnit } from '@/lib/unitData';
import { addHistoryEntry, getHistory } from '@/lib/history';
import InlineHistory from '@/components/InlineHistory';
import ExportHistory from '@/components/ExportHistory';
import { ArrowLeftRight, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import SendTo from '@/components/SendTo';
import { ALL_CURRENCIES, getEnabledCurrencies, setEnabledCurrencies } from '@/lib/currencyPrefs';
import { getCurrencyName } from '@/lib/currencyNames';
import PresetsPanel from '@/components/PresetsPanel';
import SaveShortcutButton from '@/components/converter/SaveShortcutButton';


const CATEGORY_KEYS = Object.keys(UNIT_CATEGORIES_RAW);

async function fetchLiveRates(base) {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`);
  if (!res.ok) throw new Error('Failed to fetch rates');
  const data = await res.json();
  return data[base];
}

export default function Converter({ initialCategory, initialValue, initialFrom, initialTo }) {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState(initialCategory || 'length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [inputVal, setInputVal] = useState(initialValue || '');
  const [result, setResult] = useState(null);

  const [enabledCurrencies, setEnabledCurrenciesState] = useState(() => getEnabledCurrencies());
  const handleCurrencyChange = (list) => { setEnabledCurrenciesState(list); setEnabledCurrencies(list); };

  // Re-read the enabled currency list whenever it changes elsewhere (e.g. the
  // Settings customizer), so the from/to dropdowns reflect the user's current
  // selection instead of whatever was enabled when this page first mounted.
  useEffect(() => {
    const sync = () => setEnabledCurrenciesState(getEnabledCurrencies());
    window.addEventListener('currencieschange', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('currencieschange', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const currencyUnits = Object.fromEntries(
    enabledCurrencies.map(key => {
      const c = ALL_CURRENCIES[key];
      const name = getCurrencyName(key, lang, c?.label || key);
      return [key, { label: `${c?.flag || ''} ${c?.code || key.toUpperCase()} — ${name}` }];
    })
  );

  const [converterEntries, setConverterEntries] = useState([]);
  useEffect(() => {
    const load = () => setConverterEntries(getHistory().filter(e => e.tool === 'converter'));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const [liveRates, setLiveRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState('');
  const [ratesBase, setRatesBase] = useState('');

  const UNIT_CATEGORIES = getUnitCategories(t, currencyUnits);
  const cat = UNIT_CATEGORIES[category];
  const units = Object.keys(cat.units);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
    if (initialValue) setInputVal(initialValue);
  }, [initialCategory, initialValue]);

  useEffect(() => {
    const unitKeys = category === 'currency'
      ? enabledCurrencies
      : Object.keys(UNIT_CATEGORIES[category].units);
    const defaultFrom = initialFrom && unitKeys.includes(initialFrom) ? initialFrom : unitKeys[0];
    const defaultTo = initialTo && unitKeys.includes(initialTo) ? initialTo : (unitKeys[1] || unitKeys[0]);
    setFromUnit(defaultFrom);
    setToUnit(defaultTo);
    setLiveRates(null);
    setRatesBase('');
  }, [category, initialFrom, initialTo, enabledCurrencies]);

  useEffect(() => {
    if (category !== 'currency' || !fromUnit) return;
    if (ratesBase === fromUnit && liveRates) return;
    setRatesLoading(true);
    setRatesError('');
    fetchLiveRates(fromUnit)
      .then(rates => { setLiveRates(rates); setRatesBase(fromUnit); })
      .catch(() => setRatesError('Could not load live rates.'))
      .finally(() => setRatesLoading(false));
  }, [category, fromUnit]);

  const doConvert = useCallback((val, from, to, catKey, rates, catUnits) => {
    if (!val || isNaN(parseFloat(val))) { setResult(null); return; }
    const num = parseFloat(val);
    let res;
    if (catKey === 'currency' && rates && rates[to]) {
      res = num * rates[to];
    } else {
      res = convertUnit(num, from, to, catKey);
    }
    if (res === null || res === undefined) { setResult(null); return; }
    let formatted;
    if (Math.abs(res) > 1e12 || (Math.abs(res) < 0.000001 && res !== 0)) {
      formatted = res.toExponential(6);
    } else {
      formatted = parseFloat(res.toPrecision(10)).toString();
    }
    setResult(formatted);
  }, []);

  useEffect(() => {
    if (fromUnit && toUnit && inputVal) doConvert(inputVal, fromUnit, toUnit, category, liveRates, cat.units);
    else setResult(null);
  }, [inputVal, fromUnit, toUnit, category, liveRates, doConvert]);

  // Only log to history after the user stops changing the input, so a single
  // typed value doesn't create one history entry per keystroke.
  useEffect(() => {
    if (!fromUnit || !toUnit || !inputVal || result === null) return;
    const id = setTimeout(() => {
      addHistoryEntry({ tool: 'converter', category, fromUnit, toUnit, value: inputVal, resultValue: result });
    }, 900);
    return () => clearTimeout(id);
  }, [inputVal, fromUnit, toUnit, category, result]);

  const refreshRates = () => { setRatesBase(''); setLiveRates(null); };
  const swapUnits = () => { setFromUnit(toUnit); setToUnit(fromUnit); };

  // Shared select style
  const selectStyle = {
    appearance: 'none',
    background: 'hsl(var(--secondary))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    borderRadius: '0.75rem',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    minWidth: '160px',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.35), inset -1px -1px 3px rgba(255,255,255,0.03)',
  };

  return (
    <div className="p-5 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('convTitle')}</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('convSubtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 min-w-0">
            {/* Category picker */}
            <div className="panel p-5 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('convCategory')}
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map(key => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                    style={category === key ? {
                      background: 'hsl(var(--primary))',
                      color: '#fff',
                      boxShadow: '0 0 12px hsl(var(--primary) / 0.35), 2px 2px 5px rgba(0,0,0,0.4)',
                    } : {
                      background: 'hsl(var(--secondary))',
                      color: 'hsl(var(--muted-foreground))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    {UNIT_CATEGORIES[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Converter card */}
            <div className="panel p-5">
              {category === 'currency' && (
                <div
                  className="mb-4 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}
                >
                  {ratesLoading ? (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <Loader2 className="w-3 h-3 animate-spin" /> {t('convLiveRatesLoading')}
                    </span>
                  ) : ratesError ? (
                    <span className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{t('convLiveRatesError')}</span>
                  ) : liveRates ? (
                    <span className="text-xs font-medium" style={{ color: 'hsl(173 58% 55%)' }}>{t('convLiveRatesLoaded')}</span>
                  ) : null}
                  <button
                    onClick={refreshRates}
                    className="flex items-center gap-1.5 text-xs ml-auto transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
                    onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                  >
                    <RefreshCw className="w-3 h-3" /> {t('convRefresh')}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {/* From row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('convFrom')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      placeholder={t('convEnterValue')}
                      className="flex-1 neu-input text-lg"
                    />
                    <div className="relative">
                      <select
                        value={fromUnit}
                        onChange={e => setFromUnit(e.target.value)}
                        style={selectStyle}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{cat.units[u].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </div>
                  </div>
                </div>

                {/* Swap */}
                <div className="flex justify-center">
                  <button
                    onClick={swapUnits}
                    className="p-2.5 rounded-full transition-all"
                    style={{
                      background: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                      boxShadow: '2px 2px 5px rgba(0,0,0,0.35), -1px -1px 3px rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--primary))'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 10px hsl(var(--primary) / 0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--secondary))'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.35), -1px -1px 3px rgba(255,255,255,0.03)'; }}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* To row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('convTo')}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 rounded-xl px-4 py-3 text-lg font-semibold font-mono min-h-[52px] flex items-center"
                      style={{
                        background: 'hsl(217 91% 60% / 0.07)',
                        border: '1px solid hsl(var(--primary) / 0.2)',
                        color: result !== null ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground) / 0.35)',
                        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.02)',
                      }}
                    >
                      {result !== null ? result : '—'}
                    </div>
                    <div className="relative">
                      <select
                        value={toUnit}
                        onChange={e => setToUnit(e.target.value)}
                        style={selectStyle}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>{cat.units[u].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    </div>
                  </div>
                </div>

                {/* Summary row */}
                {result !== null && inputVal && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-2 flex-wrap"
                    style={{
                      background: 'hsl(var(--muted))',
                      border: '1px solid hsl(var(--border) / 0.6)',
                    }}
                  >
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="font-semibold text-foreground font-mono">{inputVal}</span>
                      {' '}{cat.units[fromUnit]?.label} ={' '}
                      <span className="font-semibold font-mono" style={{ color: 'hsl(217 80% 70%)' }}>{result}</span>
                      {' '}{cat.units[toUnit]?.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <SaveShortcutButton
                        category={category}
                        fromUnit={fromUnit}
                        toUnit={toUnit}
                        fromLabel={cat.units[fromUnit]?.label || fromUnit}
                        toLabel={cat.units[toUnit]?.label || toUnit}
                      />
                      <SendTo
                        value={result}
                        exclude="converter"
                        allowedTools={['length','area','volume'].includes(category) ? ['calculator','geometry'] : ['calculator']}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-64 shrink-0 space-y-3">
            <PresetsPanel
              tool="converter"
              currentData={inputVal ? { category, fromUnit, toUnit, inputVal } : null}
              label={inputVal ? `${inputVal} ${fromUnit} → ${toUnit}` : ''}
              onLoad={(data) => {
                setCategory(data.category);
                setTimeout(() => { setFromUnit(data.fromUnit); setToUnit(data.toUnit); setInputVal(data.inputVal); }, 50);
              }}
            />
            <div className="flex justify-end">
              <ExportHistory entries={converterEntries} filter="converter" />
            </div>
            <InlineHistory tool="converter" />
          </div>
      </div>
    </div>
  );
}