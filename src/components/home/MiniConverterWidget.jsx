import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getUnitCategories, UNIT_CATEGORIES_RAW, convertUnit } from '@/lib/unitData';

const CATEGORY_KEYS = Object.keys(UNIT_CATEGORIES_RAW).filter(k => k !== 'currency');

const selectStyle = {
  appearance: 'none',
  background: 'hsl(var(--secondary))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--foreground))',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 500,
};

export default function MiniConverterWidget() {
  const { t } = useLanguage();
  const CATEGORIES = useMemo(() => getUnitCategories(t), [t]);
  const [category, setCategory] = useState('length');
  const cat = CATEGORIES[category];
  const units = Object.keys(cat.units);
  const [fromUnit, setFromUnit] = useState(units[0]);
  const [toUnit, setToUnit] = useState(units[1] || units[0]);
  const [value, setValue] = useState('1');

  const handleCategoryChange = (key) => {
    const u = Object.keys(CATEGORIES[key].units);
    setCategory(key);
    setFromUnit(u[0]);
    setToUnit(u[1] || u[0]);
  };

  const result = (() => {
    const num = parseFloat(value);
    if (isNaN(num) || !fromUnit || !toUnit) return null;
    const res = convertUnit(num, fromUnit, toUnit, category);
    return res === null || res === undefined ? null : parseFloat(res.toPrecision(8)).toString();
  })();

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70">{t('homeQuickConvert')}</span>
        <select value={category} onChange={e => handleCategoryChange(e.target.value)} style={selectStyle}>
          {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="neu-input flex-1 text-sm py-1.5" />
        <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} style={selectStyle}>
          {units.map(u => <option key={u} value={u}>{cat.units[u].label}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
        <div className="flex-1 text-sm font-mono font-semibold truncate" style={{ color: 'hsl(var(--primary))' }}>{result !== null ? result : '—'}</div>
        <select value={toUnit} onChange={e => setToUnit(e.target.value)} style={selectStyle}>
          {units.map(u => <option key={u} value={u}>{cat.units[u].label}</option>)}
        </select>
      </div>
    </div>
  );
}