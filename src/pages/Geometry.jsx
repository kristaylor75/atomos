import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { SHAPES, FIELD_LABELS, formatGeomResult } from '@/lib/geometryData';
import { addHistoryEntry } from '@/lib/history';
import InlineHistory from '@/components/InlineHistory';
import SendTo from '@/components/SendTo';
import FieldInput from '@/components/geometry/FieldInput';
import CopyResultButton from '@/components/geometry/CopyResultButton';
import PolygonCalculator from '@/components/geometry/PolygonCalculator';
import CompositeShapeBuilder from '@/components/geometry/CompositeShapeBuilder';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { useEffect } from 'react';

const SHAPE_KEYS = Object.keys(SHAPES);

// Maps geometry result keys to converter category slugs
const RESULT_TO_CONVERTER_CAT = {
  area:          'area',
  surfaceArea:   'area',
  circumference: 'length',
  perimeter:     'length',
  diagonal:      'length',
  slantHeight:   'length',
  diameter:      'length',
  volume:        'volume',
};

const LENGTH_UNITS = ['mm', 'cm', 'm', 'in', 'ft'];
const unitSuffix = (key, unit) => {
  const cat = RESULT_TO_CONVERTER_CAT[key];
  if (cat === 'area') return `${unit}\u00B2`;
  if (cat === 'volume') return `${unit}\u00B3`;
  if (cat === 'length') return unit;
  return '';
};

export default function Geometry() {
  const { t } = useLanguage();
  const location = useLocation();
  const lastTsRef = useRef(null);

  const [selectedShape, setSelectedShape] = useState('circle');
  const [fields, setFields] = useState({});
  const [fieldModes, setFieldModes] = useState({}); // { fieldKey: alternativeKey }
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState('basic'); // 'basic' | 'advanced'
  const [unit, setUnit] = useState('cm');
  const [advancedTab, setAdvancedTab] = useState('polygon'); // 'polygon' | 'composite'

  const shape = SHAPES[selectedShape];
  const twoDShapes = SHAPE_KEYS.filter(k => SHAPES[k].category === '2D');
  const threeDShapes = SHAPE_KEYS.filter(k => SHAPES[k].category === '3D');

  // Receive a value sent from another tool — cycle through the shape's fields
  useEffect(() => {
    const state = location.state;
    if (!state?.incomingValue || !state?.ts) return;
    if (state.ts === lastTsRef.current) return;
    lastTsRef.current = state.ts;

    const num = parseFloat(state.incomingValue);
    if (isNaN(num)) return;

    const cursorKey = `geo_cursor_${selectedShape}`;
    const cursor = parseInt(sessionStorage.getItem(cursorKey) || '0', 10);
    const fieldsList = SHAPES[selectedShape].fields;
    const idx = cursor % fieldsList.length;
    const fieldName = fieldsList[idx];

    // Reset mode to canonical and fill with the value
    setFieldModes(prev => ({ ...prev, [fieldName]: fieldName }));
    setFields(prev => ({ ...prev, [fieldName]: String(num) }));
    sessionStorage.setItem(cursorKey, String(idx + 1));
  }, [location.state]);

  const selectShape = (key) => {
    setSelectedShape(key);
    setFields({});
    setFieldModes({});
    setResults([]);
  };

  const handleFieldChange = (field, value) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const handleModeChange = (field, modeKey) => {
    setFieldModes(prev => ({ ...prev, [field]: modeKey }));
  };

  const calculate = useCallback(() => {
    // Resolve canonical field values, accounting for alternative input modes
    const canonicalFields = {};
    for (const field of shape.fields) {
      const raw = parseFloat(fields[field]);
      if (isNaN(raw)) continue;
      const modeKey = fieldModes[field] || field;
      const alts = shape.fieldAlternatives?.[field];
      if (alts && modeKey !== field) {
        const alt = alts.find(a => a.key === modeKey);
        canonicalFields[field] = alt ? alt.from(raw) : raw;
      } else {
        canonicalFields[field] = raw;
      }
    }

    const res = [];
    for (const [key, formula] of Object.entries(shape.formulas)) {
      try {
        const value = formula.fn(canonicalFields);
        const formatted = formatGeomResult(value);
        res.push({ key, label: formula.label, formula: formula.formula, value: formatted, raw: value });
      } catch {
        res.push({ key, label: formula.label, formula: formula.formula, value: 'N/A', raw: null });
      }
    }
    setResults(res);

    const validResults = res.filter(r => r.value !== 'N/A');
    if (validResults.length > 0) {
      const fieldEntries = shape.fields
        .filter(f => fields[f])
        .map(f => ({ field: f, modeKey: fieldModes[f] || f, value: fields[f] }));
      addHistoryEntry({
        tool: 'geometry',
        shapeKey: selectedShape,
        fieldEntries,
        results: validResults.map(r => ({ key: r.key, value: r.value })),
      });
    }
  }, [shape, fields, fieldModes]);

  const shapeButtonStyle = (key) => selectedShape === key ? {
    background: 'hsl(var(--primary))',
    color: '#fff',
    boxShadow: '0 0 12px hsl(var(--primary) / 0.35), 2px 2px 6px rgba(0,0,0,0.4)',
  } : {
    background: 'hsl(var(--secondary))',
    color: 'hsl(var(--muted-foreground))',
    border: '1px solid hsl(var(--border))',
  };

  return (
    <div className="p-5 max-w-4xl mx-auto w-full">
      <div className="mb-5 flex items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('geoTitle')}</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('geoSubtitle')}</p>
        </div>
        <div className="tab-bar" style={{ width: 'fit-content' }}>
          <button onClick={() => setMode('basic')} className={`tab-item px-4 py-2 text-xs font-semibold ${mode === 'basic' ? 'active' : ''}`}>{t('geoModeBasic') || 'Basic'}</button>
          <button onClick={() => setMode('advanced')} className={`tab-item px-4 py-2 text-xs font-semibold ${mode === 'advanced' ? 'active' : ''}`}>{t('geoModeAdvanced') || 'Advanced'}</button>
        </div>
      </div>

      {mode === 'advanced' ? (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="tab-bar" style={{ width: 'fit-content' }}>
              <button onClick={() => setAdvancedTab('polygon')} className={`tab-item px-4 py-2 text-xs font-semibold ${advancedTab === 'polygon' ? 'active' : ''}`}>{t('geoAdvancedPolygon') || 'Custom Polygon'}</button>
              <button onClick={() => setAdvancedTab('composite')} className={`tab-item px-4 py-2 text-xs font-semibold ${advancedTab === 'composite' ? 'active' : ''}`}>{t('geoAdvancedComposite') || 'Composite 3D Shape'}</button>
            </div>
            {advancedTab === 'polygon' ? <PolygonCalculator t={t} /> : <CompositeShapeBuilder t={t} />}
          </div>
          <div className="lg:w-64 shrink-0">
            <InlineHistory tool="geometry" />
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-4">

          {/* Shape selector */}
          <div className="panel p-5">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {t('geo2DShapes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {twoDShapes.map(key => (
                    <button key={key} onClick={() => selectShape(key)}
                      className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                      style={shapeButtonStyle(key)}
                    >
                      {t(`geoShape_${key}`) || SHAPES[key].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {t('geo3DShapes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {threeDShapes.map(key => (
                    <button key={key} onClick={() => selectShape(key)}
                      className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                      style={shapeButtonStyle(key)}
                    >
                      {t(`geoShape_${key}`) || SHAPES[key].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {t(`geoShape_${selectedShape}`) || shape.label} — {t('geoDimensions')}
              </h3>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: 8, padding: '4px 8px', fontSize: 12, outline: 'none' }}
              >
                {LENGTH_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              {shape.fields.map(field => (
                <FieldInput
                  key={field}
                  field={field}
                  value={fields[field] || ''}
                  onChange={handleFieldChange}
                  alternatives={shape.fieldAlternatives?.[field]}
                  mode={fieldModes[field] || field}
                  onModeChange={handleModeChange}
                />
              ))}
            </div>
            <button onClick={calculate} className="btn-primary">
              {t('geoCalculate')}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="panel p-5">
              <h3 className="font-semibold text-foreground mb-4">{t('geoResults')}</h3>
              <div className="space-y-2">
                {results.map(r => (
                  <div
                    key={r.key}
                    className="flex items-center justify-between rounded-xl px-4 py-3 group"
                    style={{
                      background: 'hsl(var(--muted))',
                      border: '1px solid hsl(var(--border) / 0.6)',
                      boxShadow: 'inset 1px 1px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.03)',
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{t(`geoFormula_${r.key}`) || r.label}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.formula}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{r.value} {unitSuffix(r.key, unit)}</span>
                      <CopyResultButton value={`${r.value} ${unitSuffix(r.key, unit)}`.trim()} />
                      {r.raw !== null && isFinite(r.raw) && (
                        <SendTo
                          value={r.value}
                          exclude="geometry"
                          converterCategory={RESULT_TO_CONVERTER_CAT[r.key]}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-64 shrink-0">
          <InlineHistory tool="geometry" />
        </div>
      </div>
      )}
    </div>
  );
}