import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Build a safe evaluator for f(x) with variable substitution
function buildEvaluator(expr, vars) {
// Allow free-form input where the user types the whole equation, e.g.
// "y=x", "y = x^2 + 1" or "f(x)=sin(x)". Strip the leading "y=" / "f(x)=" so
// the evaluator works from the right-hand side.
  let processed = expr.trim().replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '');
  if (!processed) return null;

  // Handle implicit multiplication for variables BEFORE substitution
  // e.g., 2k → 2*k, so that 2k with k=3 becomes 2*3=6
  const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const varName of varNames) {
    processed = processed.replace(new RegExp(`(\\d)${varName}\\b`, 'g'), `$1*${varName}`);
    processed = processed.replace(new RegExp(`\\)${varName}\\b`, 'g'), `)*${varName}`);
  }

  // Substitute user-defined variables
  const sortedVars = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const name of sortedVars) {
    processed = processed.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${vars[name]})`);
  }

  // Math symbol replacements
  processed = processed
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, Math.PI)
    .replace(/\be\b/g, Math.E)
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/cbrt\(/g, 'Math.cbrt(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/asin\(/g, 'Math.asin(')
    .replace(/acos\(/g, 'Math.acos(')
    .replace(/atan\(/g, 'Math.atan(')
    .replace(/sinh\(/g, 'Math.sinh(')
    .replace(/cosh\(/g, 'Math.cosh(')
    .replace(/tanh\(/g, 'Math.tanh(')
    .replace(/log10\(/g, 'Math.log10(')
    .replace(/log2\(/g, 'Math.log2(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/\^/g, '**')
    .replace(/%/g, '/100')
    .replace(/(\d)(x)/g, '$1*$2');  // implicit multiply: 2x → 2*x

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', 'Math', `"use strict"; return (${processed});`);
    return (x) => {
      try {
        const v = fn(x, Math);
        return (typeof v === 'number' && isFinite(v)) ? v : null;
      } catch {
        return null;
      }
    };
  } catch {
    return null;
  }
}

// Find zeros using bisection
function findZeros(fn, xMin, xMax, steps = 400) {
  const zeros = [];
  const dx = (xMax - xMin) / steps;
  let prev = fn(xMin);
  for (let i = 1; i <= steps; i++) {
    const x = xMin + i * dx;
    const curr = fn(x);
    if (curr === null || prev === null) { prev = curr; continue; }
    if (prev * curr < 0) {
      // bisection
      let lo = xMin + (i - 1) * dx, hi = x;
      for (let j = 0; j < 40; j++) {
        const mid = (lo + hi) / 2;
        const fm = fn(mid);
        if (fm === null) break;
        if (Math.abs(fm) < 1e-10) { lo = mid; break; }
        if (fn(lo) * fm < 0) hi = mid; else lo = mid;
      }
      let zx = parseFloat(lo.toPrecision(8));
      if (Math.abs(zx) < 1e-9) zx = 0;
      if (!zeros.some(z => Math.abs(z - zx) < dx * 2)) zeros.push(zx);
    }
    prev = curr;
  }
  return zeros;
}

export default function GraphCanvas({
  functions,
  variables,
  onError,
  onPointSelected,
  gridVisible = true,
  axisNumbersVisible = true,
  minorGridlinesVisible = true,
  showArrows = true,
  lockViewport = false,
  xAxisLabel = 'x',
  yAxisLabel = 'y',
}) {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const vpAtPanStart = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const needsInitialRender = useRef(true);

  const vp = viewport;

  // Canvas-to-world coords
  const toWorld = useCallback((cx, cy, canvas) => {
    const w = canvas.width, h = canvas.height;
    return {
      x: vp.xMin + (cx / w) * (vp.xMax - vp.xMin),
      y: vp.yMax - (cy / h) * (vp.yMax - vp.yMin),
    };
  }, [vp]);

  const toCanvas = useCallback((wx, wy, canvas) => {
    const w = canvas.width, h = canvas.height;
    return {
      cx: ((wx - vp.xMin) / (vp.xMax - vp.xMin)) * w,
      cy: ((vp.yMax - wy) / (vp.yMax - vp.yMin)) * h,
    };
  }, [vp]);

  // Compute special points: zeros + intersections between functions
  const computeSpecialPoints = useCallback(() => {
    const pts = [];
    const evaluators = functions
      .filter(fn => fn.visible && fn.expr.trim())
      .map(fn => ({ fn, ev: buildEvaluator(fn.expr, variables) }))
      .filter(e => e.ev !== null);

    // Zeros (crossings with y=0)
    for (const { fn, ev } of evaluators) {
      const zeros = findZeros(ev, vp.xMin, vp.xMax);
      for (const zx of zeros) {
        pts.push({ x: parseFloat(zx.toPrecision(6)), y: 0, label: `Zero (${fn.expr})`, color: fn.color });
      }
    }

    // Y-axis crossings (x=0)
    for (const { fn, ev } of evaluators) {
      const y0 = ev(0);
      if (y0 !== null && isFinite(y0)) {
        pts.push({ x: 0, y: parseFloat(y0.toPrecision(6)), label: `Y-axis (${fn.expr})`, color: fn.color });
      }
    }

    // Local extrema (points where the derivative crosses zero)
    for (const { fn, ev } of evaluators) {
      const h = (vp.xMax - vp.xMin) / 2000;
      const deriv = (x) => {
        const a = ev(x - h), b = ev(x + h);
        return (a === null || b === null) ? null : (b - a) / (2 * h);
      };
      const critXs = findZeros(deriv, vp.xMin, vp.xMax, 300);
      for (const cx of critXs) {
        const y = ev(cx);
        if (y === null) continue;
        const dBefore = deriv(cx - h), dAfter = deriv(cx + h);
        if (dBefore === null || dAfter === null) continue;
        const kind = dBefore > 0 && dAfter < 0 ? 'Local Max' : dBefore < 0 && dAfter > 0 ? 'Local Min' : null;
        if (!kind) continue;
        pts.push({ x: parseFloat(cx.toPrecision(6)), y: parseFloat(y.toPrecision(6)), label: `${kind} (${fn.expr})`, color: fn.color });
      }
    }

    // Intersections between pairs of functions (f1 - f2 = 0)
    for (let i = 0; i < evaluators.length; i++) {
      for (let j = i + 1; j < evaluators.length; j++) {
        const { fn: f1, ev: ev1 } = evaluators[i];
        const { fn: f2, ev: ev2 } = evaluators[j];
        const diff = (x) => {
          const a = ev1(x), b = ev2(x);
          return (a === null || b === null) ? null : a - b;
        };
        const xs = findZeros(diff, vp.xMin, vp.xMax);
        for (const ix of xs) {
          const iy = ev1(ix);
          if (iy === null) continue;
          pts.push({
            x: parseFloat(ix.toPrecision(6)),
            y: parseFloat(iy.toPrecision(6)),
            label: `Intersection (${f1.expr}) ∩ (${f2.expr})`,
            color: f1.color,
          });
        }
      }
    }

    return pts;
  }, [functions, variables, vp]);

  // Main draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    ctx.fillStyle = `hsl(${bgColor})`;
    ctx.fillRect(0, 0, W, H);

    const gridColor = 'rgba(255,255,255,0.06)';
    const axisColor = 'rgba(255,255,255,0.25)';
    const labelColor = 'rgba(255,255,255,0.35)';
    const specialPoints = computeSpecialPoints();

    // Grid
    if (gridVisible) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const xStep = niceStep((vp.xMax - vp.xMin) / 10);
      const yStep = niceStep((vp.yMax - vp.yMin) / 10);

      if (minorGridlinesVisible) {
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        const xMinor = xStep / 5;
        const yMinor = yStep / 5;
        for (let x = Math.ceil(vp.xMin / xMinor) * xMinor; x <= vp.xMax; x += xMinor) {
          const { cx } = toCanvas(x, 0, canvas);
          ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
        }
        for (let y = Math.ceil(vp.yMin / yMinor) * yMinor; y <= vp.yMax; y += yMinor) {
          const { cy } = toCanvas(0, y, canvas);
          ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        }
      }

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = Math.ceil(vp.xMin / xStep) * xStep; x <= vp.xMax; x += xStep) {
        const { cx } = toCanvas(x, 0, canvas);
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      }
      for (let y = Math.ceil(vp.yMin / yStep) * yStep; y <= vp.yMax; y += yStep) {
        const { cy } = toCanvas(0, y, canvas);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      }
    }

    // Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    const { cx: ox } = toCanvas(0, 0, canvas);
    const { cy: oy } = toCanvas(0, 0, canvas);
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();

    // Axis labels
    if (axisNumbersVisible) {
      const xStep = niceStep((vp.xMax - vp.xMin) / 10);
      const yStep = niceStep((vp.yMax - vp.yMin) / 10);
      ctx.fillStyle = labelColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (let x = Math.ceil(vp.xMin / xStep) * xStep; x <= vp.xMax; x += xStep) {
        if (Math.abs(x) < xStep * 0.01) continue;
        const { cx } = toCanvas(x, 0, canvas);
        const labelY = Math.min(Math.max(oy + 12, 12), H - 4);
        ctx.fillText(parseFloat(x.toPrecision(4)), cx, labelY);
      }
      ctx.textAlign = 'right';
      for (let y = Math.ceil(vp.yMin / yStep) * yStep; y <= vp.yMax; y += yStep) {
        if (Math.abs(y) < yStep * 0.01) continue;
        const { cy } = toCanvas(0, y, canvas);
        const labelX = Math.min(Math.max(ox - 4, 4), W - 4);
        ctx.fillText(parseFloat(y.toPrecision(4)), labelX, cy + 3);
      }
    }

    // Plot functions
    const newErrors = {};
    for (const fn of functions) {
      if (!fn.visible || !fn.expr.trim()) continue;
      const evaluator = buildEvaluator(fn.expr, variables);
      if (!evaluator) { newErrors[fn.id] = 'Syntax error'; continue; }
      newErrors[fn.id] = '';

      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let penDown = false;
      const steps = W * 2;
      let prevY = null;
      for (let i = 0; i <= steps; i++) {
        const wx = vp.xMin + (i / steps) * (vp.xMax - vp.xMin);
        const wy = evaluator(wx);
        if (wy === null) { penDown = false; prevY = null; continue; }
        // Discontinuity detection
        if (prevY !== null && Math.abs(wy - prevY) > (vp.yMax - vp.yMin) * 2) {
          penDown = false;
        }
        const { cx, cy } = toCanvas(wx, wy, canvas);
        if (!penDown) { ctx.moveTo(cx, cy); penDown = true; }
        else ctx.lineTo(cx, cy);
        prevY = wy;
      }
      ctx.stroke();
    }

    // Update errors
    for (const [id, err] of Object.entries(newErrors)) {
      onError(parseInt(id), err);
    }

    // Draw special points (zeros)
    for (const pt of specialPoints) {
      const { cx, cy } = toCanvas(pt.x, pt.y, canvas);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw hovered point
    if (hoveredPoint) {
      const { cx, cy } = toCanvas(hoveredPoint.x, hoveredPoint.y, canvas);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      // Tooltip
      const label = `(${parseFloat(hoveredPoint.x.toPrecision(5))}, ${parseFloat(hoveredPoint.y.toPrecision(5))})`;
      ctx.font = '11px monospace';
      ctx.fillStyle = 'hsl(var(--card))';
      const tw = ctx.measureText(label).width + 10;
      const th = 18;
      const tx = Math.min(cx + 10, W - tw - 4);
      const ty = cy - th - 6 < 0 ? cy + 6 : cy - th - 6;
      ctx.fillStyle = 'hsl(220 16% 18%)';
      ctx.beginPath();
      ctx.roundRect(tx - 2, ty, tw, th, 4);
      ctx.fill();
      ctx.fillStyle = 'hsl(220 20% 90%)';
      ctx.fillText(label, tx + 3, ty + 13);
    }

  }, [functions, variables, vp, hoveredPoint, toCanvas, gridVisible, axisNumbersVisible, minorGridlinesVisible, showArrows, computeSpecialPoints]);

  // Resize observer + initial render fix
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      needsInitialRender.current = true;
    });
    ro.observe(canvas.parentElement);
    // Force initial render if canvas has dimensions
    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      needsInitialRender.current = true;
    }
    return () => ro.disconnect();
  }, []);

  // Mouse events
  const handleMouseDown = (e) => {
    if (lockViewport) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    vpAtPanStart.current = { ...vp };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (isPanning && panStart.current) {
      const dx = (e.clientX - panStart.current.x) / rect.width * (vp.xMax - vp.xMin);
      const dy = (e.clientY - panStart.current.y) / rect.height * (vp.yMax - vp.yMin);
      const vp0 = vpAtPanStart.current;
      setViewport({
        xMin: vp0.xMin - dx, xMax: vp0.xMax - dx,
        yMin: vp0.yMin + dy, yMax: vp0.yMax + dy,
      });
    } else {
      // Check if hovering near a special point — snap hover display to it (tight 14px radius)
      const HOVER_SNAP_PX = 14;
      let snappedToSpecial = false;
      const specialPoints = computeSpecialPoints();
      for (const sp of specialPoints) {
        const { cx: scx, cy: scy } = toCanvas(sp.x, sp.y, canvas);
        if (Math.hypot(cx - scx, cy - scy) < HOVER_SNAP_PX) {
          setHoveredPoint({ x: sp.x, y: sp.y, label: sp.label });
          snappedToSpecial = true;
          break;
        }
      }
      if (!snappedToSpecial) {
        // Find closest curve point for hover
        const world = toWorld(cx, cy, canvas);
        let closestY = null, closestFn = null, closestDist = Infinity;
        for (const fn of functions) {
          if (!fn.visible || !fn.expr.trim()) continue;
          const evaluator = buildEvaluator(fn.expr, variables);
          if (!evaluator) continue;
          const wy = evaluator(world.x);
          if (wy === null) continue;
          const dist = Math.abs(wy - world.y);
          if (dist < closestDist) { closestDist = dist; closestY = wy; closestFn = fn; }
        }
        const threshold = (vp.yMax - vp.yMin) * 0.03;
        if (closestFn && closestDist < threshold) {
          setHoveredPoint({ x: world.x, y: closestY, label: `f(x)=${closestFn.expr}` });
        } else {
          setHoveredPoint(null);
        }
      }
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => { setIsPanning(false); setHoveredPoint(null); };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Snap to special points with a tight pixel radius (12px) — always prefer these over raw cursor
    const SNAP_PX = 12;
    let closestSp = null, closestSpDist = Infinity;
    const specialPoints = computeSpecialPoints();
    for (const sp of specialPoints) {
      const { cx: scx, cy: scy } = toCanvas(sp.x, sp.y, canvas);
      const dist = Math.hypot(cx - scx, cy - scy);
      if (dist < SNAP_PX && dist < closestSpDist) {
        closestSpDist = dist;
        closestSp = sp;
      }
    }
    if (closestSp) {
      onPointSelected({ x: closestSp.x, y: closestSp.y, label: closestSp.label });
      return;
    }

    if (!hoveredPoint) return;
    const pt = {
      x: parseFloat(hoveredPoint.x.toPrecision(6)),
      y: parseFloat(hoveredPoint.y.toPrecision(6)),
      label: `f(${parseFloat(hoveredPoint.x.toPrecision(6))})=${parseFloat(hoveredPoint.y.toPrecision(6))}`,
    };
    onPointSelected(pt);
  };

  const handleWheel = (e) => {
    if (lockViewport) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const wx = vp.xMin + mx * (vp.xMax - vp.xMin);
    const wy = vp.yMax - my * (vp.yMax - vp.yMin);
    setViewport({
      xMin: wx + (vp.xMin - wx) * factor,
      xMax: wx + (vp.xMax - wx) * factor,
      yMin: wy + (vp.yMin - wy) * factor,
      yMax: wy + (vp.yMax - wy) * factor,
    });
  };

  // Touch pan/pinch
  const lastTouches = useRef(null);
  const handleTouchStart = (e) => { lastTouches.current = e.touches; };
  const handleTouchMove = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches.length === 1 && lastTouches.current?.length === 1) {
      const dx = (e.touches[0].clientX - lastTouches.current[0].clientX) / rect.width * (vp.xMax - vp.xMin);
      const dy = (e.touches[0].clientY - lastTouches.current[0].clientY) / rect.height * (vp.yMax - vp.yMin);
      setViewport(v => ({ xMin: v.xMin - dx, xMax: v.xMax - dx, yMin: v.yMin + dy, yMax: v.yMax + dy }));
    } else if (e.touches.length === 2 && lastTouches.current?.length === 2) {
      const prevDist = Math.hypot(
        lastTouches.current[0].clientX - lastTouches.current[1].clientX,
        lastTouches.current[0].clientY - lastTouches.current[1].clientY
      );
      const currDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = prevDist / currDist;
      setViewport(v => {
        const cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2;
        const hw = (v.xMax - v.xMin) / 2 * factor, hh = (v.yMax - v.yMin) / 2 * factor;
        return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
      });
    }
    lastTouches.current = e.touches;
  };

  const zoom = (factor) => {
    if (lockViewport) return;
    setViewport(v => {
      const cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2;
      const hw = (v.xMax - v.xMin) / 2 * factor, hh = (v.yMax - v.yMin) / 2 * factor;
      return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
    });
  };

  const reset = () => setViewport({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%', height: '100%', display: 'block',
          cursor: isPanning ? 'grabbing' : (hoveredPoint ? 'crosshair' : 'grab'),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { lastTouches.current = null; }}
      />

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {[
          { icon: ZoomIn, action: () => zoom(0.7), title: 'Zoom in' },
          { icon: ZoomOut, action: () => zoom(1.43), title: 'Zoom out' },
          { icon: Maximize2, action: reset, title: 'Reset view' },
        ].map(({ icon: Icon, action, title }) => (
          <button
            key={title}
            onClick={action}
            title={title}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: 'hsl(220 16% 16% / 0.9)',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Viewport info */}
      <div className="absolute bottom-2 left-2 text-[9px] font-mono pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
        [{parseFloat(vp.xMin.toPrecision(4))}, {parseFloat(vp.xMax.toPrecision(4))}] × [{parseFloat(vp.yMin.toPrecision(4))}, {parseFloat(vp.yMax.toPrecision(4))}]
      </div>
    </div>
  );
}

function niceStep(rawStep) {
  const exp = Math.floor(Math.log10(rawStep));
  const mag = Math.pow(10, exp);
  const frac = rawStep / mag;
  if (frac < 1.5) return mag;
  if (frac < 3.5) return 2 * mag;
  if (frac < 7.5) return 5 * mag;
  return 10 * mag;
}