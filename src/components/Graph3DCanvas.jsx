import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const RANGE = 10;
const SEGMENTS = 48;

// Which two variables are "free" (plotted on the horizontal plane) for a given dependent variable
const FREE_VARS = { z: ['x', 'y'], y: ['x', 'z'], x: ['y', 'z'] };

// Given a function's mode3d ('z'|'y'|'x'|'none') and typed expr, resolve the dependent
// variable and the right-hand-side formula to evaluate.
function resolveEquation(fn) {
  const mode3d = fn.mode3d || 'z';
  if (mode3d === 'none') {
    const match = fn.expr.match(/^\s*([xyz])\s*=\s*(.+)$/i);
    if (match) return { dep: match[1].toLowerCase(), rhs: match[2] };
    return { dep: 'z', rhs: fn.expr };
  }
  return { dep: mode3d, rhs: fn.expr };
}

// Build a safe evaluator for dep = f(free1, free2) with variable substitution
function build3DEvaluator(expr, vars, freeNames) {
  let processed = expr.trim();
  if (!processed) return null;
  const [v1name, v2name] = freeNames;

  const varNames = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const varName of varNames) {
    processed = processed.replace(new RegExp(`(\\d)${varName}\\b`, 'g'), `$1*${varName}`);
    processed = processed.replace(new RegExp(`\\)${varName}\\b`, 'g'), `)*${varName}`);
  }
  for (const name of varNames) {
    processed = processed.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${vars[name]})`);
  }

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
    .replace(new RegExp(`(\\d)(${v1name})`, 'g'), '$1*$2')
    .replace(new RegExp(`(\\d)(${v2name})`, 'g'), '$1*$2');

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(v1name, v2name, 'Math', `"use strict"; return (${processed});`);
    return (a, b) => {
      try {
        const v = fn(a, b, Math);
        return (typeof v === 'number' && isFinite(v)) ? v : null;
      } catch {
        return null;
      }
    };
  } catch {
    return null;
  }
}

// CSS Color 4 space-separated hsl() isn't recognized by three.js Color parsing — convert to commas
function toThreeColor(cssColor) {
  const match = cssColor.match(/^hsl\((\d+)\s+(\d+)%\s+(\d+)%\)$/);
  if (match) return `hsl(${match[1]}, ${match[2]}%, ${match[3]}%)`;
  return cssColor;
}

// Does `str` actually reference variable `letter`? (letter not glued to another letter,
// so implicit-multiplication forms like "2y" or "cos(y)" are still detected correctly —
// unlike \b, which fails between a digit and a letter.)
function usesVar(str, letter) {
  return new RegExp(`(^|[^a-zA-Z])${letter}(?![a-zA-Z])`).test(str);
}

const AXIS_LEN = RANGE + 2;

// Reads the app's current skin accent color so the axes always match the active appearance
function getAxisColor() {
  const val = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  return val ? `hsl(${val})` : 'hsl(217, 91%, 60%)';
}

function createAxisLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 1.4, 1);
  return sprite;
}

function buildAxes(color) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color });

  const xGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-AXIS_LEN, 0, 0), new THREE.Vector3(AXIS_LEN, 0, 0)]);
  group.add(new THREE.Line(xGeo, material));
  const yGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -AXIS_LEN, 0), new THREE.Vector3(0, AXIS_LEN, 0)]);
  group.add(new THREE.Line(yGeo, material.clone()));
  const zGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -AXIS_LEN), new THREE.Vector3(0, 0, AXIS_LEN)]);
  group.add(new THREE.Line(zGeo, material.clone()));

  // Physical three.js Y (vertical) shows math Z (height); physical three.js Z (depth) shows math Y —
  // this matches the standard 3D-grapher convention (Z-up) and lines up with GridHelper's ground plane.
  const xLabel = createAxisLabel('X', color);
  xLabel.position.set(AXIS_LEN + 0.8, 0, 0);
  group.add(xLabel);
  const zLabel = createAxisLabel('Z', color);
  zLabel.position.set(0, AXIS_LEN + 0.8, 0);
  group.add(zLabel);
  const yLabel = createAxisLabel('Y', color);
  yLabel.position.set(0, 0, AXIS_LEN + 0.8);
  group.add(yLabel);

  return group;
}

function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });
}

// Bisection root-finder along a single free parameter t
function findZeros1D(evalFn, tMin, tMax, steps = 200) {
  const zeros = [];
  const dt = (tMax - tMin) / steps;
  let prev = evalFn(tMin);
  for (let i = 1; i <= steps; i++) {
    const t = tMin + i * dt;
    const curr = evalFn(t);
    if (curr === null || prev === null) { prev = curr; continue; }
    if (prev * curr < 0) {
      let lo = tMin + (i - 1) * dt, hi = t;
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        const fm = evalFn(mid);
        if (fm === null) break;
        if (Math.abs(fm) < 1e-9) { lo = mid; break; }
        if (evalFn(lo) * fm < 0) hi = mid; else lo = mid;
      }
      zeros.push(lo);
    }
    prev = curr;
  }
  return zeros;
}

export default function Graph3DCanvas({ functions, variables, onError, onPointSelected }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const surfacesRef = useRef([]);
  const frameRef = useRef(null);
  const axesGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const specialPointsRef = useRef([]);
  const onPointSelectedRef = useRef(onPointSelected);
  onPointSelectedRef.current = onPointSelected;

  // One-time scene setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(16, 14, 16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 1;
    controls.panSpeed = 1;
    controls.minDistance = 3;
    controls.maxDistance = 80;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    scene.add(new THREE.GridHelper(RANGE * 2, 20, 0x555555, 0x333333));
    const axes = buildAxes(getAxisColor());
    scene.add(axes);
    axesGroupRef.current = axes;

    const onSkinChange = () => {
      const oldAxes = axesGroupRef.current;
      if (oldAxes) { scene.remove(oldAxes); disposeObject(oldAxes); }
      const newAxes = buildAxes(getAxisColor());
      scene.add(newAxes);
      axesGroupRef.current = newAxes;
    };
    window.addEventListener('skinchange', onSkinChange);

    // Click-to-select: snap to the nearest special point (not a drag/rotate)
    let downPos = null;
    const onPointerDown = (e) => { downPos = { x: e.clientX, y: e.clientY }; };
    const onPointerUp = (e) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const SNAP_PX = 18;
      let closest = null, closestDist = Infinity;
      for (const sp of specialPointsRef.current) {
        const v = sp.pos.clone().project(camera);
        const sx = (v.x * 0.5 + 0.5) * rect.width;
        const sy = (1 - (v.y * 0.5 + 0.5)) * rect.height;
        const d = Math.hypot(clickX - sx, clickY - sy);
        if (d < SNAP_PX && d < closestDist) { closestDist = d; closest = sp; }
      }
      if (closest && onPointSelectedRef.current) {
        onPointSelectedRef.current({ x: closest.x, y: closest.y, z: closest.z, label: closest.label });
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      window.removeEventListener('skinchange', onSkinChange);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      for (const mesh of surfacesRef.current) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      surfacesRef.current = [];
      if (axesGroupRef.current) disposeObject(axesGroupRef.current);
      renderer.dispose();
      if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement);
    };
  }, []);

  // Rebuild surfaces whenever functions or variables change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    for (const mesh of surfacesRef.current) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    surfacesRef.current = [];

    const newErrors = {};
    const newSpecialPoints = [];
    const lineDescriptors = [];
    const step = (RANGE * 2) / SEGMENTS;
    const vertsPerRow = SEGMENTS + 1;

    for (const fn of functions) {
      if (!fn.visible || !fn.expr.trim()) continue;
      const { dep, rhs } = resolveEquation(fn);
      const freeNames = FREE_VARS[dep] || FREE_VARS.z;
      const evaluator = build3DEvaluator(rhs, variables, freeNames);
      if (!evaluator) { newErrors[fn.id] = 'Syntax error'; continue; }
      newErrors[fn.id] = '';

      const color = toThreeColor(fn.color);
      // Variables the formula doesn't actually reference default to 0 instead of sweeping the full range
      const usesV1 = usesVar(rhs, freeNames[0]);
      const usesV2 = usesVar(rhs, freeNames[1]);
      const clampDep = (v) => (v === null || !isFinite(v)) ? 0 : Math.max(-50, Math.min(50, v));

      // Map (freeVar1, freeVar2, dependentValue) to the actual math {x, y, z} —
      // and from there to the matching physical three.js axis. Math Z maps to the vertical
      // three.js Y axis (so z=3x rises upward, not sideways) and math Y maps to three.js Z (depth),
      // matching the standard Z-up 3D-grapher convention.
      const coordsFor = (v1, v2, depVal) => {
        const c = { x: 0, y: 0, z: 0 };
        c[freeNames[0]] = v1;
        c[dep] = depVal;
        c[freeNames[1]] = v2;
        return c;
      };
      // Math Y is negated on the depth axis so increasing values move away from the
      // (positive-Z-positioned) camera — matching the intuitive "rises/extends" direction
      // instead of appearing to invert toward the viewer.
      const vecFor = (v1, v2, depVal) => {
        const c = coordsFor(v1, v2, depVal);
        return new THREE.Vector3(c.x, c.z, -c.y);
      };
      const roundCoords = (v1, v2, depVal) => {
        const c = coordsFor(v1, v2, depVal);
        return { x: parseFloat(c.x.toPrecision(6)), y: parseFloat(c.y.toPrecision(6)), z: parseFloat(c.z.toPrecision(6)) };
      };
      const addMarker = (pos, label, coords) => {
        const geometry = new THREE.SphereGeometry(0.13, 12, 12);
        const material = new THREE.MeshPhongMaterial({ color });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(pos);
        scene.add(marker);
        surfacesRef.current.push(marker);
        newSpecialPoints.push({ pos: pos.clone(), label, ...coords });
      };

      if (usesV1 && usesV2) {
        // Full surface
        const positions = [];
        const indices = [];
        for (let j = 0; j <= SEGMENTS; j++) {
          const v2 = -RANGE + j * step;
          for (let i = 0; i <= SEGMENTS; i++) {
            const v1 = -RANGE + i * step;
            const vec = vecFor(v1, v2, clampDep(evaluator(v1, v2)));
            positions.push(vec.x, vec.y, vec.z);
          }
        }
        for (let j = 0; j < SEGMENTS; j++) {
          for (let i = 0; i < SEGMENTS; i++) {
            const a = j * vertsPerRow + i;
            const b = a + 1;
            const c = a + vertsPerRow;
            const d = c + 1;
            indices.push(a, c, b, b, c, d);
          }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
          color, side: THREE.DoubleSide, transparent: true, opacity: 0.88, shininess: 30,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        surfacesRef.current.push(mesh);

        const originDep = clampDep(evaluator(0, 0));
        addMarker(vecFor(0, 0, originDep), `${t('graph3dOrigin')} (${fn.expr})`, roundCoords(0, 0, originDep));
      } else if (usesV1 || usesV2) {
        // Only one variable appears — draw a line, with the other fixed at 0
        const evalAlong = (t) => usesV1 ? evaluator(t, 0) : evaluator(0, t);
        const points = [];
        for (let i = 0; i <= SEGMENTS; i++) {
          const t = -RANGE + i * step;
          const v1 = usesV1 ? t : 0;
          const v2 = usesV2 ? t : 0;
          const depVal = clampDep(evaluator(v1, v2));
          const vec = vecFor(v1, v2, depVal);
          points.push(vec);
          // Every sampled point along the line is selectable (not just origin/zeros), matching the 2D calculator
          newSpecialPoints.push({ pos: vec.clone(), label: `(${fn.expr})`, ...roundCoords(v1, v2, depVal) });
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        surfacesRef.current.push(line);

        const originDep = clampDep(evalAlong(0));
        addMarker(vecFor(0, 0, originDep), `${t('graph3dOrigin')} (${fn.expr})`, roundCoords(0, 0, originDep));
        const zeros = findZeros1D(evalAlong, -RANGE, RANGE);
        for (const tz of zeros) {
          const v1 = usesV1 ? tz : 0;
          const v2 = usesV2 ? tz : 0;
          addMarker(vecFor(v1, v2, 0), `${t('graph3dZero')} (${fn.expr})`, roundCoords(v1, v2, 0));
        }
        lineDescriptors.push({ fn, dep, freeNames, usesV1, usesV2, evalAlong, clampDep, vecFor, roundCoords });
      } else {
        // Neither variable appears — a single point, with both fixed at 0
        const depVal = clampDep(evaluator(0, 0));
        const geometry = new THREE.SphereGeometry(0.18, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(vecFor(0, 0, depVal));
        scene.add(point);
        surfacesRef.current.push(point);

        newSpecialPoints.push({ pos: point.position.clone(), label: `${t('graph3dPoint')} (${fn.expr})`, ...roundCoords(0, 0, depVal) });
      }
    }

    // Intersections between pairs of line-mode functions that share the same dependent/free variables
    for (let i = 0; i < lineDescriptors.length; i++) {
      for (let j = i + 1; j < lineDescriptors.length; j++) {
        const a = lineDescriptors[i], b = lineDescriptors[j];
        if (a.dep !== b.dep || a.usesV1 !== b.usesV1 || a.usesV2 !== b.usesV2) continue;
        const diff = (tt) => {
          const va = a.evalAlong(tt), vb = b.evalAlong(tt);
          return (va === null || vb === null) ? null : va - vb;
        };
        const roots = findZeros1D(diff, -RANGE, RANGE);
        for (const tt of roots) {
          const depVal = a.clampDep(a.evalAlong(tt));
          const v1 = a.usesV1 ? tt : 0;
          const v2 = a.usesV2 ? tt : 0;
          const pos = a.vecFor(v1, v2, depVal);
          const geometry = new THREE.SphereGeometry(0.15, 12, 12);
          const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const marker = new THREE.Mesh(geometry, material);
          marker.position.copy(pos);
          scene.add(marker);
          surfacesRef.current.push(marker);
          const label = `${t('graph3dIntersection')} (${a.fn.expr}) ∩ (${b.fn.expr})`;
          newSpecialPoints.push({ pos: pos.clone(), label, ...a.roundCoords(v1, v2, depVal) });
        }
      }
    }

    specialPointsRef.current = newSpecialPoints;

    for (const [id, err] of Object.entries(newErrors)) {
      onError(parseInt(id), err);
    }
  }, [functions, variables, onError]);

  return <div ref={containerRef} className="w-full h-full" style={{ cursor: 'grab' }} />;
}