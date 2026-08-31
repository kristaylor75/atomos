import { useState } from 'react';
import { Triangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const SHAPES = {
  circle: { fields: ['r'], calc: ({ r }) => Math.PI * r * r },
  rectangle: { fields: ['a', 'b'], calc: ({ a, b }) => a * b },
  triangle: { fields: ['b', 'h'], calc: ({ b, h }) => 0.5 * b * h },
};

export default function MiniGeometryWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [shape, setShape] = useState('circle');
  const [values, setValues] = useState({});

  const def = SHAPES[shape];
  const nums = Object.fromEntries(def.fields.map((f) => [f, parseFloat(values[f]) || 0]));
  const area = def.calc(nums);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <Triangle className="w-3.5 h-3.5" /> {t('navGeometry')}
        </span>
        <button onClick={() => navigate('/geometry')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1.5 mb-2">
        {Object.keys(SHAPES).map((s) => (
          <button
            key={s}
            onClick={() => { setShape(s); setValues({}); }}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg"
            style={{
              background: shape === s ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.5)',
              color: shape === s ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
              border: shape === s ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
            }}
          >
            {t(`geoShape_${s}`)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        {def.fields.map((f) => (
          <input
            key={f}
            type="number"
            value={values[f] || ''}
            onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
            placeholder={f.toUpperCase()}
            className="neu-input flex-1 text-sm"
          />
        ))}
      </div>
      <p className="text-sm font-mono font-bold text-center text-foreground">{t('polygonArea')}: {area.toFixed(2)}</p>
    </div>
  );
}