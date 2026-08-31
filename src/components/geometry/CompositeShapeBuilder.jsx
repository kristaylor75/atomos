import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { formatGeomResult } from '@/lib/geometryData';
import Composite3DViewer from './Composite3DViewer';
import CopyResultButton from './CopyResultButton';
import { loadPresets, savePreset, deletePreset } from '@/lib/compositePresets';

const PI = Math.PI;
const DEFAULT_DIMS = {
  box: { w: 1, h: 1, dep: 1 },
  sphere: { r: 1 },
  cylinder: { r: 1, h: 1 },
  cone: { r: 1, h: 1 },
  pyramid: { w: 1, h: 1, dep: 1 },
  torus: { R: 1, r: 0.3 },
  hemisphere: { r: 1 },
  prism: { w: 1, h: 1, dep: 1 },
};

const newShape = () => ({ id: crypto.randomUUID(), type: 'box', op: 'add', dims: { ...DEFAULT_DIMS.box } });

function volumeOf(shape) {
  const d = shape.dims;
  switch (shape.type) {
    case 'sphere': return (4 / 3) * PI * d.r ** 3;
    case 'cylinder': return PI * d.r ** 2 * d.h;
    case 'cone': return (1 / 3) * PI * d.r ** 2 * d.h;
    case 'pyramid': return (1 / 3) * d.w * d.dep * d.h;
    case 'torus': return 2 * PI ** 2 * d.R * d.r ** 2;
    case 'hemisphere': return (2 / 3) * PI * d.r ** 3;
    case 'prism': return 0.5 * d.w * d.h * d.dep;
    case 'box':
    default: return d.w * d.h * d.dep;
  }
}
function surfaceAreaOf(shape) {
  const d = shape.dims;
  switch (shape.type) {
    case 'sphere': return 4 * PI * d.r ** 2;
    case 'cylinder': return 2 * PI * d.r * (d.r + d.h);
    case 'cone': return PI * d.r * (d.r + Math.sqrt(d.r ** 2 + d.h ** 2));
    case 'pyramid': {
      const slant = Math.sqrt(d.h ** 2 + (Math.max(d.w, d.dep) / 2) ** 2);
      return d.w * d.dep + d.w * slant + d.dep * slant;
    }
    case 'torus': return 4 * PI ** 2 * d.R * d.r;
    case 'hemisphere': return 3 * PI * d.r ** 2;
    case 'prism': {
      const slant = Math.sqrt((d.w / 2) ** 2 + d.h ** 2);
      return d.w * d.h + d.w * d.dep + 2 * slant * d.dep;
    }
    case 'box':
    default: return 2 * (d.w * d.h + d.h * d.dep + d.w * d.dep);
  }
}

const FIELD_LABEL_KEYS = { w: 'compositeFieldWidth', h: 'compositeFieldHeight', dep: 'compositeFieldDepth', r: 'compositeFieldRadius', R: 'compositeFieldMajorRadius' };

export default function CompositeShapeBuilder({ t }) {
  const [shapes, setShapes] = useState([newShape()]);
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  useEffect(() => { setPresets(loadPresets()); }, []);

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    setPresets(savePreset(name, shapes));
    setPresetName('');
  };

  const handleLoadPreset = (preset) => {
    setShapes(preset.shapes.map(s => ({ ...s, id: crypto.randomUUID() })));
  };

  const handleDeletePreset = (id) => {
    setPresets(deletePreset(id));
  };

  const addShape = () => setShapes(prev => [...prev, newShape()]);
  const removeShape = (id) => setShapes(prev => prev.filter(s => s.id !== id));
  const updateType = (id, type) => setShapes(prev => prev.map(s => s.id === id ? { ...s, type, dims: { ...DEFAULT_DIMS[type] } } : s));
  const updateOp = (id, op) => setShapes(prev => prev.map(s => s.id === id ? { ...s, op } : s));
  const updateDim = (id, key, value) => setShapes(prev => prev.map(s => s.id === id ? { ...s, dims: { ...s.dims, [key]: parseFloat(value) || 0 } } : s));

  const totals = useMemo(() => {
    let volume = 0, surfaceArea = 0;
    shapes.forEach(s => {
      const sign = s.op === 'subtract' ? -1 : 1;
      volume += sign * volumeOf(s);
      surfaceArea += surfaceAreaOf(s);
    });
    return { volume: Math.max(volume, 0), surfaceArea };
  }, [shapes]);

  const selectStyle = { background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('compositeBuilderTitle')}</h3>
        <div className="space-y-3 mb-4">
          {shapes.map(shape => (
            <div key={shape.id} className="rounded-xl p-3 space-y-2" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={shape.type} onChange={e => updateType(shape.id, e.target.value)} style={selectStyle}>
                  <option value="box">{t('compositeShapeBox') || 'Box'}</option>
                  <option value="sphere">{t('compositeShapeSphere') || 'Sphere'}</option>
                  <option value="cylinder">{t('compositeShapeCylinder') || 'Cylinder'}</option>
                  <option value="cone">{t('compositeShapeCone') || 'Cone'}</option>
                  <option value="pyramid">{t('compositeShapePyramid') || 'Pyramid'}</option>
                  <option value="torus">{t('compositeShapeTorus') || 'Torus'}</option>
                  <option value="hemisphere">{t('compositeShapeHemisphere') || 'Hemisphere'}</option>
                  <option value="prism">{t('compositeShapePrism') || 'Prism'}</option>
                </select>
                <select value={shape.op} onChange={e => updateOp(shape.id, e.target.value)} style={selectStyle}>
                  <option value="add">{t('compositeAdd') || 'Add'}</option>
                  <option value="subtract">{t('compositeSubtract') || 'Subtract'}</option>
                </select>
                <button onClick={() => removeShape(shape.id)} disabled={shapes.length <= 1} className="ml-auto shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.keys(shape.dims).map(key => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>{t(FIELD_LABEL_KEYS[key]) || FIELD_LABEL_KEYS[key]}</span>
                    <input type="number" step="any" value={shape.dims[key]} onChange={e => updateDim(shape.id, key, e.target.value)} className="neu-input font-mono" style={{ width: 72 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addShape} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
          <Plus className="w-3.5 h-3.5" /> {t('compositeAddShape')}
        </button>
      </div>

      <div className="panel p-5 space-y-3">
        <h3 className="font-semibold text-foreground">{t('compositePresets') || 'Saved Presets'}</h3>
        <div className="flex items-center gap-2">
          <input
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder={t('compositePresetNamePlaceholder') || 'Preset name…'}
            className="neu-input flex-1"
          />
          <button onClick={handleSavePreset} disabled={!presetName.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <Star className="w-3.5 h-3.5" /> {t('compositeSavePreset') || 'Save'}
          </button>
        </div>
        {presets.length > 0 && (
          <div className="space-y-1.5">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
                <button onClick={() => handleLoadPreset(preset)} className="text-sm font-medium text-foreground text-left flex-1">
                  {preset.name}
                </button>
                <button onClick={() => handleDeletePreset(preset.id)} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-2 overflow-hidden">
        <Composite3DViewer shapes={shapes} t={t} />
      </div>

      <div className="panel p-5 space-y-2">
        <h3 className="font-semibold text-foreground mb-2">{t('geoResults')}</h3>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <span className="text-sm font-medium text-foreground">{t('compositeTotalVolume') || 'Total Volume'}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{formatGeomResult(totals.volume)}</span>
            <CopyResultButton value={formatGeomResult(totals.volume)} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <span className="text-sm font-medium text-foreground">{t('compositeTotalSurfaceArea') || 'Total Surface Area (approx)'}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono" style={{ color: 'hsl(var(--primary))' }}>{formatGeomResult(totals.surfaceArea)}</span>
            <CopyResultButton value={formatGeomResult(totals.surfaceArea)} />
          </div>
        </div>
      </div>
    </div>
  );
}