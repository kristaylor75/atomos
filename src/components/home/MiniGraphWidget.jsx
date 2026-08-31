import { useState, useRef, useEffect } from 'react';
import { LineChart, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { usePrimaryColor } from '@/hooks/useThemeColor';

export default function MiniGraphWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const color = usePrimaryColor();
  const [fn, setFn] = useState('sin(x)');
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.stroke();

    const range = 10;
    const scale = w / range;
    let expr;
    try {
      // Allow free-form input like "y=x", "y = sin(x)" or "f(x)=..." by stripping
      // the leading "y=" / "f(x)=" so the evaluator works on the right-hand side.
      const stripped = fn.replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '');
      const body = stripped.replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(').replace(/abs\(/g, 'Math.abs(')
        .replace(/(\d)(x)/g, '$1*$2');  // implicit multiply: 2x → 2*x
      // eslint-disable-next-line no-new-func
      expr = new Function('x', `"use strict"; return (${body});`);
    } catch {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px++) {
      const x = (px - w / 2) / scale;
      let y;
      try { y = expr(x); } catch { y = NaN; }
      if (typeof y !== 'number' || !isFinite(y)) { started = false; continue; }
      const py = h / 2 - y * scale;
      if (!started) { ctx.moveTo(px, py); started = true; } else { ctx.lineTo(px, py); }
    }
    ctx.stroke();
  }, [fn, color]);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <LineChart className="w-3.5 h-3.5" /> {t('navGraphing')}
        </span>
        <button onClick={() => navigate('/graphing')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <input
        value={fn}
        onChange={(e) => setFn(e.target.value)}
        placeholder="sin(x)"
        className="neu-input w-full text-sm mb-2 font-mono"
      />
      <canvas ref={canvasRef} width={300} height={140} className="w-full rounded-lg" style={{ background: 'hsl(220 18% 7%)' }} />
    </div>
  );
}