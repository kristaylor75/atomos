import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatGeomResult } from '@/lib/geometryData';

const emptyVertex = () => ({ x: '', y: '' });

export default function PolygonCalculator({ t }) {
  const [vertices, setVertices] = useState([emptyVertex(), emptyVertex(), emptyVertex()]);

  const points = useMemo(() => vertices
    .map(v => ({ x: parseFloat(v.x), y: parseFloat(v.y) }))
    .filter(v => !isNaN(v.x) && !isNaN(v.y)), [vertices]);

  const { area, perimeter, centroid } = useMemo(() => {
    if (points.length < 3) return { area: null, perimeter: null, centroid: null };
    let areaSum = 0, perim = 0, cx = 0, cy = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i], p2 = points[(i + 1) % points.length];
      const cross = p1.x * p2.y - p2.x * p1.y;
      areaSum += cross;
      cx += (p1.x + p2.x) * cross;
      cy += (p1.y + p2.y) * cross;
      perim += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    const a = areaSum / 2;
    const absA = Math.abs(a);
    return {
      area: absA,
      perimeter: perim,
      centroid: absA > 1e-9 ? { x: cx / (6 * a), y: cy / (6 * a) } : null,
    };
  }, [points]);

  const svgPoints = useMemo(() => {
    if (points.length < 2) return null;
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
    const pad = 10, size = 200;
    return points.map(p => {
      const nx = ((p.x - minX) / spanX) * (size - pad * 2) + pad;
      const ny = size - (((p.y - minY) / spanY) * (size - pad * 2) + pad); // flip y
      return `${nx},${ny}`;
    }).join(' ');
  }, [points]);

  const updateVertex = (i, key, value) => {
    setVertices(prev => prev.map((v, idx) => idx === i ? { ...v, [key]: value } : v));
  };
  const addVertex = () => setVertices(prev => [...prev, emptyVertex()]);
  const removeVertex = (i) => setVertices(prev => prev.length > 3 ? prev.filter((_, idx) => idx !== i) : prev);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('polygonVertices') || 'Polygon Vertices'}</h3>
        <div className="space-y-2 mb-4">
          {vertices.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono w-5" style={{ color: 'hsl(var(--muted-foreground))' }}>{i + 1}</span>
              <input type="number" step="any" value={v.x} onChange={e => updateVertex(i, 'x', e.target.value)} placeholder="x" className="neu-input font-mono" />
              <input type="number" step="any" value={v.y} onChange={e => updateVertex(i, 'y', e.target.value)} placeholder="y" className="neu-input font-mono" />
              <button onClick={() => removeVertex(i)} disabled={vertices.length <= 3} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addVertex} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
          <Plus className="w-3.5 h-3.5" /> {t('polygonAddVertex') || 'Add Vertex'}
        </button>
      </div>

      {svgPoints && (
        <div className="panel p-5 flex items-center justify-center">
          <svg viewBox="0 0 200 200" width="200" height="200">
            <polygon points={svgPoints} fill="hsl(217 91% 60% / 0.25)" stroke="hsl(217 91% 60%)" strokeWidth="2" />
          </svg>
        </div>
      )}

      {area !== null && (
        <div className="panel p-5 space-y-2">
          <h3 className="font-semibold text-foreground mb-2">{t('geoResults')}</h3>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <span className="text-sm font-medium text-foreground">{t('polygonArea') || 'Area'}</span>
            <span className="text-lg font-bold font-mono" style={{ color: 'hsl(217 80% 70%)' }}>{formatGeomResult(area)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <span className="text-sm font-medium text-foreground">{t('polygonPerimeter') || 'Perimeter'}</span>
            <span className="text-lg font-bold font-mono" style={{ color: 'hsl(217 80% 70%)' }}>{formatGeomResult(perimeter)}</span>
          </div>
          {centroid && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)' }}>
              <span className="text-sm font-medium text-foreground">{t('polygonCentroid') || 'Centroid'}</span>
              <span className="text-lg font-bold font-mono" style={{ color: 'hsl(217 80% 70%)' }}>({formatGeomResult(centroid.x)}, {formatGeomResult(centroid.y)})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}