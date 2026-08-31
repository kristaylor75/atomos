import { useState, useEffect, useRef, useCallback } from 'react';
import { Skull, Crosshair } from 'lucide-react';
import StartOverlay from './StartOverlay';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { haptics } from '@/lib/haptics';
import { submitStat } from '@/lib/gameScores';
import GameShell from './GameShell';
import Scoreboard from './Scoreboard';
import { getSkin } from '@/lib/skins';
const gunImageUrl = '/gunsprite.png';

// ── 2.5D raycasting dungeon crawler with textured walls/sprites ───────────────
// Three procedural floors with chasing enemies, ammo + health pickups, and a
// victory when the exit of the deepest floor is reached. Walls, the exit
// portal, enemies, and pickups are all drawn with procedural textures.

// Endless mode: each floor's scale + difficulty scales with its 0-indexed number.
const CONFIG = (n) => {
  const step = Math.floor(n / 2);
  const cols = Math.min(28, 14 + step * 2);
  const rows = Math.min(22, 12 + step * 2);
  const monsters = Math.min(16, 2 + n);
  const health = Math.min(4, 1 + Math.floor(n / 3));
  const pillars = Math.min(40, Math.max(4, Math.floor(cols * rows / 28)));
  const espeed = Math.min(1.6, 0.7 + n * 0.08);
  return { cols, rows, monsters, health, pillars, espeed };
};

// ── texture helpers ───────────────────────────────────────────────────────────
const pack = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

function buildWallTex() {
  const W = 32, H = 32, t = new Uint32Array(W * H);
  const R = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t[y * W + x] = c; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bw = 8, bh = 8, row = Math.floor(y / bh), off = (row % 2) * 4;
    const bx = (x + off) % bw, by = y % bh, col = Math.floor((x + off) / bw);
    if (bx === 0 || by === 0) { t[y * W + x] = pack(46, 42, 48); continue; }
    const n = ((x * 7 + y * 13) % 6) - 3;
    t[y * W + x] = pack(clamp(118 + ((row * 7 + col * 13) % 30) + n), clamp(66 + ((row * 11 + col * 5) % 20) + n), clamp(58 + ((row * 3 + col * 9) % 15) + n));
  }
  // mossy streak at the bottom rows
  R(0, 26, 31, 31, pack(70, 90, 60));
  R(0, 24, 5, 25, pack(60, 82, 54));
  R(24, 22, 31, 24, pack(60, 82, 54));
  return t;
}

function buildExitTex() {
  const W = 32, H = 32, t = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x < 3 || x > 28 || y < 3 || y > 28) { t[y * W + x] = pack(18, 52, 20); continue; }
    const bar = (x % 6) < 2;
    if (bar) {
      const g = 170 + (y > 10 && y < 22 ? 85 : 40);
      t[y * W + x] = pack(60, g, 110);
    } else t[y * W + x] = pack(14, 64, 20);
  }
  return t;
}

function buildEnemyTex() {
  const W = 20, H = 28, t = new Uint32Array(W * H);
  const P = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) t[y * W + x] = c; };
  const R = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P(x, y, c); };
  // ── post-apocalyptic mutant: sickly green skin, tumors, exposed bone, tattered rags ──
  const SKIN = pack(108, 124, 74), SKIN_HI = pack(142, 156, 94), SKIN_SH = pack(70, 86, 48);
  const TUMOR = pack(154, 164, 98), PUSTULE = pack(206, 182, 74), NECRO = pack(88, 66, 92);
  const BONE = pack(218, 210, 188), BONE_SH = pack(168, 160, 144);
  const CLOTH = pack(92, 60, 34), CLOTH_SH = pack(60, 38, 22);
  const EYE = pack(224, 246, 96), EYE_D = pack(40, 50, 22), MOUTH = pack(40, 30, 26);
  const BLOOD = pack(114, 30, 28), TEETH = pack(222, 214, 196);
  // rounded lumpy bald head
  P(6, 2, SKIN); P(7, 2, SKIN); P(12, 2, SKIN); P(13, 2, SKIN);
  R(5, 3, 14, 11, SKIN);
  R(6, 3, 9, 5, SKIN_HI);                     // pale highlight
  R(11, 3, 13, 5, TUMOR); P(12, 4, PUSTULE);   // forehead tumor + weeping pustule
  R(5, 8, 6, 10, NECRO);                       // necrotic cheek patch
  // eyes: one big glowing mutant eye, a scar eye, and a tiny third eye
  R(8, 5, 11, 7, EYE_D); R(9, 6, 10, 7, EYE);
  R(12, 6, 13, 7, EYE_D);
  R(6, 6, 7, 7, EYE_D); P(6, 6, EYE);
  // jagged mouth with broken teeth + dripping blood
  R(8, 9, 13, 10, MOUTH);
  P(9, 9, TEETH); P(11, 9, TEETH); P(13, 9, TEETH);
  P(10, 11, BLOOD); P(11, 11, BLOOD);
  // neck + hunched shoulders
  R(8, 11, 11, 12, SKIN_SH);
  R(3, 12, 16, 13, SKIN_SH);
  // tattered vest torso
  R(3, 13, 16, 20, CLOTH);
  R(3, 13, 16, 14, CLOTH_SH);                  // hem shading
  // exposed chest tumor + ribs
  R(8, 15, 11, 17, TUMOR); P(9, 16, PUSTULE);
  P(5, 17, BONE); P(5, 18, BONE); P(14, 17, BONE); P(14, 18, BONE);
  // hanging cloth strips
  P(4, 20, CLOTH); P(4, 22, CLOTH); P(15, 21, CLOTH); P(16, 23, CLOTH);
  // left arm: knobby green limb + hand
  R(1, 13, 3, 21, SKIN); R(1, 21, 3, 23, SKIN_HI);
  P(2, 17, SKIN_SH);
  // right arm: elongated bony mutant limb + claw
  R(17, 13, 19, 24, BONE);
  P(18, 17, BONE_SH); P(18, 21, BONE_SH);
  P(16, 25, BONE_SH); P(18, 25, BONE_SH);
  // stumpy uneven legs
  R(6, 20, 9, 27, SKIN_SH);
  R(11, 20, 14, 26, SKIN);
  P(7, 24, BLOOD);
  return { t, W, H };
}

function buildAmmoTex() {
  const W = 16, H = 16, t = new Uint32Array(W * H);
  const P = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) t[y * W + x] = c; };
  const R = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P(x, y, c); };
  R(2, 2, 13, 13, pack(58, 54, 50));     // box border
  R(3, 3, 12, 12, pack(38, 36, 34));     // interior
  R(5, 4, 6, 11, pack(245, 200, 40));    // bullet 1
  R(9, 4, 10, 11, pack(245, 200, 40));   // bullet 2
  R(5, 4, 6, 5, pack(255, 230, 120));    // tips
  R(9, 4, 10, 5, pack(255, 230, 120));
  R(5, 11, 6, 12, pack(160, 120, 20));   // base
  R(9, 11, 10, 12, pack(160, 120, 20));
  return { t, W, H };
}

function buildHealthTex() {
  const W = 16, H = 16, t = new Uint32Array(W * H);
  const P = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) t[y * W + x] = c; };
  const R = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P(x, y, c); };
  R(5, 0, 10, 15, pack(210, 40, 40));    // vertical bar
  R(0, 5, 15, 10, pack(210, 40, 40));    // horizontal bar
  R(6, 1, 9, 14, pack(255, 90, 90));     // highlight
  R(1, 6, 14, 9, pack(255, 90, 90));
  return { t, W, H };
}

const wallTex = buildWallTex();
const exitTex = buildExitTex();
const enemyTex = buildEnemyTex();
const ammoTex = buildAmmoTex();
const healthTex = buildHealthTex();

function buildFloorTex() {
  const W = 32, H = 32, t = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const tile = (Math.floor(x / 16) + Math.floor(y / 16)) % 2;
    const mx = x % 16, my = y % 16;
    const n = (x * 5 + y * 7) % 4;
    let r, g, b;
    if (mx === 0 || my === 0) { r = 28; g = 26; b = 24; }
    else { r = (tile ? 58 : 48) + n - 2; g = (tile ? 52 : 44) + n - 2; b = (tile ? 48 : 42) + n - 1; }
    t[y * W + x] = pack(clamp(r), clamp(g), clamp(b));
  }
  return t;
}

// Barrel axis passes through the screen center (W/2, H/2) from the bottom-right
// grip pivot. Solving pivot→center direction = (sin a, -cos a):
// pivot ≈ (201, 140), center = (120, 75) → a ≈ -0.90 rad.
const GUN_ANGLE = -0.90;
const GUN_PIVOT_X = 0.72, GUN_PIVOT_Y = 0.80;
const GUN_MUZZLE = 68; // barrel tip distance from pivot (local -y) — muzzle stays lower-right, barrel aims through crosshair
function buildGunCanvas() {
  const S = 160;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d');
  x.translate(S * GUN_PIVOT_X, S * GUN_PIVOT_Y);
  x.rotate(GUN_ANGLE);

  const METAL = '#b8c0c8';
  const METAL_HI = '#dfe6ea';
  const METAL_SH = '#7f8890';
  const BLACK = '#111820';
  const BLACK_HI = '#1a2731';
  const BLACK_SH = '#080d12';
  const GRAY = '#a4aeb8';
  const ACCENT = '#f0a236';
  const RED = '#f54d4d';

  const drawBevelRect = (w, h, x0, y0, fill, shadow, edge) => {
    x.fillStyle = fill; x.fillRect(x0, y0, w, h);
    x.fillStyle = edge; x.fillRect(x0, y0, w, 2);
    x.fillStyle = shadow; x.fillRect(x0, y0 + h - 2, w, 2);
  };

  // stock and lower receiver
  x.fillStyle = BLACK;
  x.beginPath();
  x.moveTo(-58, 8);
  x.lineTo(-35, 6);
  x.lineTo(-26, 20);
  x.lineTo(-55, 34);
  x.lineTo(-64, 20);
  x.closePath();
  x.fill();

  x.fillStyle = METAL;
  x.fillRect(-34, -8, 44, 26);
  x.fillStyle = BLACK_HI;
  x.fillRect(-34, 9, 44, 5);
  x.fillStyle = BLACK_SH;
  x.fillRect(-34, -6, 8, 20);

  // upper receiver / rail block
  x.fillStyle = METAL_HI;
  x.fillRect(-8, -34, 60, 18);
  x.fillStyle = BLACK_HI;
  x.fillRect(-8, -34, 60, 4);
  x.fillStyle = METAL_SH;
  x.fillRect(30, -29, 8, 8);

  // optics / scope housing
  x.fillStyle = BLACK;
  x.fillRect(10, -42, 24, 13);
  x.fillStyle = METAL;
  x.fillRect(14, -39, 15, 7);
  x.fillStyle = RED;
  x.beginPath(); x.arc(21, -35, 4, 0, Math.PI * 2); x.fill();
  x.fillStyle = BLACK_SH;
  x.beginPath(); x.arc(21, -35, 2, 0, Math.PI * 2); x.fill();

  // barrel and muzzle brake
  x.fillStyle = BLACK_HI;
  x.fillRect(42, -11, 64, 12);
  x.fillStyle = BLACK;
  x.fillRect(34, -16, 14, 22);
  x.fillStyle = METAL_SH;
  x.fillRect(104, -14, 20, 16);
  x.fillStyle = BLACK_SH;
  x.fillRect(88, -10, 15, 8);
  x.fillStyle = ACCENT;
  x.fillRect(78, -8, 10, 4);

  // handguard / rail section
  x.fillStyle = METAL;
  x.fillRect(-18, -18, 58, 20);
  x.fillStyle = BLACK_HI;
  x.fillRect(-18, -18, 58, 4);
  x.fillStyle = BLACK_SH;
  for (let i = 0; i < 5; i++) x.fillRect(-12 + i * 12, -18, 5, 3);
  x.fillStyle = METAL_HI;
  x.fillRect(-18, -8, 58, 2);

  // lower body / trigger housing
  x.fillStyle = METAL;
  x.fillRect(-8, 6, 52, 22);
  x.fillStyle = BLACK_HI;
  x.fillRect(-8, 6, 52, 5);
  x.fillStyle = BLACK_SH;
  x.fillRect(6, 12, 16, 6);
  x.fillStyle = ACCENT;
  x.fillRect(-2, 13, 6, 2);
  x.fillStyle = BLACK_SH;
  x.fillRect(16, 12, 28, 6);

  // magwell and magazine
  x.fillStyle = BLACK_SH;
  x.beginPath();
  x.moveTo(-4, 18);
  x.lineTo(16, 18);
  x.lineTo(18, 48);
  x.lineTo(-8, 52);
  x.lineTo(-12, 28);
  x.closePath();
  x.fill();
  x.fillStyle = METAL_SH;
  x.fillRect(-6, 18, 18, 3);
  x.fillStyle = GRAY;
  x.fillRect(-2, 22, 12, 22);
  x.fillStyle = BLACK_HI;
  x.fillRect(-3, 24, 2, 18);
  x.fillRect(9, 24, 2, 18);

  // grip and rear housing
  x.fillStyle = BLACK;
  x.beginPath();
  x.moveTo(10, 22);
  x.lineTo(26, 22);
  x.lineTo(32, 48);
  x.lineTo(18, 53);
  x.closePath();
  x.fill();
  x.fillStyle = METAL_SH;
  x.fillRect(14, 24, 10, 20);

  // forward and rear rails
  x.fillStyle = METAL_HI;
  x.fillRect(-42, -12, 14, 3);
  x.fillRect(-42, 0, 14, 3);
  x.fillRect(-59, 2, 18, 3);

  // subtle panel detail for modern tactical silhouette
  x.strokeStyle = BLACK_SH;
  x.lineWidth = 2;
  x.beginPath(); x.moveTo(-30, 2); x.lineTo(20, 2); x.stroke();
  x.beginPath(); x.moveTo(6, -20); x.lineTo(6, 8); x.stroke();

  return c;
}

const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
const floorTex = buildFloorTex();
// Local-first FPS view-model: keep a modern tactical rifle sprite available even
// without any external Base44/CDN asset, while still allowing the active skin tint
// to recolor the weapon to match the selected appearance preset.

const gunCanvas = (typeof document !== 'undefined') ? buildGunCanvas() : null;

let gunSprite = null;
if (typeof document !== 'undefined') {
  const img = new Image();
  img.src = gunImageUrl;
  img.onload = () => { gunSprite = img; };
  // Falls back to gunCanvas if image fails to load
}
const gunTintCache = new Map();

function getTintedGunSprite(tint) {
  if (!gunSprite && !gunCanvas) return null;
  const sprite = gunSprite || gunCanvas;
  if (!sprite || sprite.width === 0) return sprite;
  
  let c = gunTintCache.get(String(tint || 'none'));
  if (c) return c;
  
  c = document.createElement('canvas');
  c.width = sprite.width;
  c.height = sprite.height;
  const cx = c.getContext('2d');
  cx.drawImage(sprite, 0, 0);
  
  // Remove black background by making it transparent
  const imgData = cx.getImageData(0, 0, c.width, c.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r < 30 && g < 30 && b < 30) {
      data[i + 3] = 0; // Make black pixels transparent
    }
  }
  cx.putImageData(imgData, 0, 0);
  
  // Apply tint ONLY to existing non-transparent pixels
  if (tint) {
    cx.globalCompositeOperation = 'source-atop'; // Only affects existing pixels
    cx.globalAlpha = 0.6;
    cx.fillStyle = tint;
    cx.fillRect(0, 0, c.width, c.height);
    cx.globalAlpha = 1;
  }
  
  gunTintCache.set(String(tint || 'none'), c);
  return c;
}

// monochrome/CRT skins use a single signature color for the gun + HUD
const SKIN_TINT = { 'default': null, 'graphing-calc': null, 'pip-boy': '#39ff5a', 'ham-radio': '#ffae3d', 'retro-scifi': '#5cf0ff', 'audio-rack': '#9affb0' };
const DIFFS = { easy: { speed: 0.6, hp: 1 }, medium: { speed: 1.0, hp: 2 }, hard: { speed: 1.35, hp: 3 } };
// per-skin tint applied to the whole 3D scene (walls, floor, sprites, ceiling)
const SCENE_TINT = {
  _id: { r: 1, g: 1, b: 1 },
  'pip-boy': { r: 0.28, g: 1, b: 0.28 },
  'ham-radio': { r: 1, g: 0.6, b: 0.15 },
  'retro-scifi': { r: 0.28, g: 0.85, b: 1 },
  'audio-rack': { r: 0.5, g: 1, b: 0.6 },
};

// ── map building ─────────────────────────────────────────────────────────────
const isWall = (g, r, c) => g[r]?.[c] === '1';           // passability (movement)
const isOpaque = (g, r, c) => { const v = g[r]?.[c]; return v === '1' || v === 'E'; };  // blocks ray/render
const tileCh = (g, r, c) => g[r]?.[c] || '1';

function connected(grid, sr, sc, er, ec, rows, cols) {
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const q = [[sr, sc]]; seen[sr][sc] = true;
  while (q.length) {
    const [r, c] = q.shift();
    if (r === er && c === ec) return true;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc] || grid[nr][nc] === '1') continue;
      seen[nr][nc] = true; q.push([nr, nc]);
    }
  }
  return false;
}

function buildFloor(n, ehp = 2) {
  const C = CONFIG(n);
  const cols = C.cols, rows = C.rows;
  const hp = Math.min(6, ehp + Math.floor(n / 3)); // enemies gain HP on deeper floors
  const grid = Array.from({ length: rows }, () => Array(cols).fill('0'));
  for (let c = 0; c < cols; c++) { grid[0][c] = '1'; grid[rows - 1][c] = '1'; }
  for (let r = 0; r < rows; r++) { grid[r][0] = '1'; grid[r][cols - 1] = '1'; }
  const isPlayer = (r, c) => r <= 2 && c <= 2;
  const isExit = (r, c) => r >= rows - 3 && c >= cols - 3;
  const pillars = [];
  let placed = 0, guard = 0;
  while (placed < C.pillars && guard++ < 300) {
    const r = 1 + Math.floor(Math.random() * (rows - 2));
    const c = 1 + Math.floor(Math.random() * (cols - 2));
    if (grid[r][c] !== '0' || isPlayer(r, c) || isExit(r, c)) continue;
    grid[r][c] = '1'; pillars.push([r, c]); placed++;
  }
  grid[1][1] = 'P';
  grid[rows - 2][cols - 2] = 'E';

  // guarantee the exit is reachable from the spawn: remove pillars until it is
  let safety = 0;
  while (!connected(grid, 1, 1, rows - 2, cols - 2, rows, cols) && pillars.length && safety++ < 60) {
    const [r, c] = pillars.splice(Math.floor(Math.random() * pillars.length), 1)[0];
    grid[r][c] = '0';
  }
  if (!connected(grid, 1, 1, rows - 2, cols - 2, rows, cols)) {
    for (const [r, c] of pillars) grid[r][c] = '0';
  }

  const open = [];
  for (let r = 1; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) if (grid[r][c] === '0') open.push([r, c]);
  const used = new Set();
  const take = () => {
    let t, g = 0;
    do { t = open[Math.floor(Math.random() * open.length)]; } while (used.has(t[0] + '_' + t[1]) && g++ < 200);
    used.add(t[0] + '_' + t[1]);
    return t;
  };
  const monsters = [], pickups = [];
  for (let i = 0; i < C.monsters; i++) {
    let t, g2 = 0;
    do { t = take(); } while (Math.abs(t[0] - 1) + Math.abs(t[1] - 1) < 4 && g2++ < 60);
    monsters.push({ x: t[1] + 0.5, y: t[0] + 0.5, alive: true, cool: 0.5, hp, spawn: 0 });
  }
  // enough ammo to kill every enemy on this floor (1 dmg/shot, +5/pack) + 1 buffer
  const ammoCount = Math.min(20, Math.ceil(C.monsters * hp / 5) + 1);
  for (let i = 0; i < ammoCount; i++) { const t = take(); pickups.push({ x: t[1] + 0.5, y: t[0] + 0.5, kind: 'A' }); }
  for (let i = 0; i < C.health; i++) { const t = take(); pickups.push({ x: t[1] + 0.5, y: t[0] + 0.5, kind: 'H' }); }
  return { grid, monsters, pickups, spawn: { x: 1.5, y: 1.5, a: -Math.PI / 4 }, espeed: C.espeed };
}

export default function DoomGame() {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState('');
  const [, setHealth] = useState(100);
  const [, setAmmo] = useState(10);
  const [kills, setKills] = useState(0);
  const [floor, setFloor] = useState(0);
  const [time, setTime] = useState(0);
  const [diff, setDiff] = useState('medium');

  const gridRef = useRef(null);
  const playerRef = useRef({ x: 1.5, y: 1.5, a: -Math.PI / 4 });
  const monstersRef = useRef([]);
  const pickupsRef = useRef([]);
  const espeedRef = useRef(0.7);
  const floorRef = useRef(0);
  const ammoRef = useRef(10);
  const healthRef = useRef(100);
  const killsRef = useRef(0);
  const overRef = useRef('');
  const startRef = useRef(0);
  const keysRef = useRef({});
  const rafRef = useRef(0);
  const flashRef = useRef(0);
  const dispHealthRef = useRef(100);
  const ghostHealthRef = useRef(100);
  const shakeRef = useRef(0);
  const diffRef = useRef('medium');
  const lastARef = useRef(-Math.PI / 4);
  const rollRef = useRef(0);

  // live HUD timer
  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => setTime(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running, over]);

  const startGame = useCallback(() => {
    const d = DIFFS[diffRef.current];
    const f = buildFloor(0, d.hp);
    gridRef.current = f.grid; monstersRef.current = f.monsters; pickupsRef.current = f.pickups;
    playerRef.current = { ...f.spawn }; espeedRef.current = f.espeed * d.speed;
    floorRef.current = 0; startRef.current = performance.now();
    ammoRef.current = 10; healthRef.current = 100; dispHealthRef.current = 100; ghostHealthRef.current = 100; killsRef.current = 0; overRef.current = ''; shakeRef.current = 0; lastARef.current = f.spawn.a; rollRef.current = 0;
    setFloor(0); setAmmo(10); setHealth(100); setKills(0); setOver(''); setTime(0);
    setRunning(true);
  }, []);

  const loadFloor = useCallback((n) => {
    const f = buildFloor(n, DIFFS[diffRef.current].hp);
    gridRef.current = f.grid; monstersRef.current = f.monsters; pickupsRef.current = f.pickups;
    playerRef.current = { ...f.spawn }; espeedRef.current = f.espeed * DIFFS[diffRef.current].speed;
    floorRef.current = n; setFloor(n); lastARef.current = f.spawn.a; rollRef.current = 0;
  }, []);

  const setDifficulty = useCallback((d) => {
    diffRef.current = d; setDiff(d);
    startGame();
  }, [startGame]);

  const end = useCallback((result) => {
    if (overRef.current) return;
    overRef.current = result; setOver(result); setRunning(false); haptics.tap();
    if (canvasRef.current) canvasRef.current.style.transform = '';
    submitStat('dungeon', 'kills', killsRef.current, 'high');
    submitStat('dungeon', 'floor', floorRef.current + 1, 'high');
    if (result === 'victory') {
      const secs = Math.max(1, Math.round((performance.now() - startRef.current) / 1000));
      submitStat('dungeon', 'clear', secs, 'low');
    }
  }, []);

  const shoot = useCallback(() => {
    if (overRef.current) return;
    if (ammoRef.current <= 0) { haptics.tap(); return; }
    ammoRef.current -= 1; setAmmo(ammoRef.current); haptics.tap();
    flashRef.current = performance.now();
    // Hit the alive enemy directly under the center crosshair, provided no
    // wall is between it and the muzzle. In camera space the crosshair is the
    // forward axis, so an enemy is "under" it when its lateral offset is small.
    const p = playerRef.current, g = gridRef.current;
    const ca = Math.cos(p.a), sa = Math.sin(p.a);
    let wallD = 9;
    for (let t = 0.2; t < 9; t += 0.1) {
      if (isOpaque(g, Math.floor(p.y + sa * t), Math.floor(p.x + ca * t))) { wallD = t; break; }
    }
    let best = null, bestDepth = 9;
    for (const m of monstersRef.current) {
      if (!m.alive) continue;
      const dx = m.x - p.x, dy = m.y - p.y;
      const depth = dx * ca + dy * sa;            // forward (perp) distance
      if (depth <= 0.2 || depth >= wallD || depth > 8) continue;
      const side = -dx * sa + dy * ca;             // lateral offset from aim ray
      if (Math.abs(side) > 0.5) continue;          // not under the crosshair
      if (depth < bestDepth) { bestDepth = depth; best = m; }
    }
    if (best) {
      best.hp -= 1;
      if (best.hp <= 0) { best.alive = false; killsRef.current += 1; setKills(k => k + 1); haptics.click(); }
      else haptics.tap();
    }
  }, []);

  const fireHeldRef = useRef(null);
  useEffect(() => () => { if (fireHeldRef.current) clearInterval(fireHeldRef.current); }, []);
  const startFire = (e) => { e.preventDefault(); shoot(); if (!fireHeldRef.current) fireHeldRef.current = setInterval(shoot, 110); };
  const stopFire = () => { if (fireHeldRef.current) { clearInterval(fireHeldRef.current); fireHeldRef.current = null; } };

  // keyboard
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === ' ' && running) { e.preventDefault(); shoot(); }
      if (k === 'arrowup') keysRef.current['w'] = true;
      if (k === 'arrowdown') keysRef.current['s'] = true;
      if (k === 'arrowleft') keysRef.current['a'] = true;
      if (k === 'arrowright') keysRef.current['d'] = true;
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [shoot, running]);

  // ── render loop (textured raycaster) ────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 240, H = 150;
    canvas.width = W; canvas.height = H;
    const imageData = ctx.createImageData(W, H);
    const buf = new Uint32Array(imageData.data.buffer);
    const zbuf = new Float32Array(W);
    // floor-casting: perpendicular distance + shade for each lower-half row
    const floorStart = (H / 2 | 0) + 1;
    const rowD = new Float32Array(H), rowShade = new Float32Array(H);
    for (let y = floorStart; y < H; y++) {
      const d = (H / 2) / (y - H / 2);
      rowD[y] = d;
      rowShade[y] = Math.max(0.32, Math.min(1, 1 - d / 9));
    }
    let last = performance.now();

    const dda = (g, rx, ry, ra) => {
      const dx = Math.cos(ra), dy = Math.sin(ra);
      let mapX = Math.floor(rx), mapY = Math.floor(ry);
      const deltaX = Math.abs(1 / dx), deltaY = Math.abs(1 / dy);
      let sideX, sideY, stepX, stepY;
      if (dx < 0) { stepX = -1; sideX = (rx - mapX) * deltaX; } else { stepX = 1; sideX = (mapX + 1 - rx) * deltaX; }
      if (dy < 0) { stepY = -1; sideY = (ry - mapY) * deltaY; } else { stepY = 1; sideY = (mapY + 1 - ry) * deltaY; }
      let side = 0, hit = 0, guard = 0;
      while (!hit && guard++ < 64) {
        if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
        else { sideY += deltaY; mapY += stepY; side = 1; }
        if (isOpaque(g, mapY, mapX)) hit = 1;
      }
      const perp = side === 0 ? (sideX - deltaX) : (sideY - deltaY);
      return { perp: perp < 0.001 ? 0.001 : perp, side, mapX, mapY };
    };

    const fov = 0.66;

    const drawSprite = (sx, sy, tex, tw, th, scale, fade = 1, rise = 1) => {
      const p = playerRef.current;
      const sc = SCENE_TINT[getSkin()] || SCENE_TINT._id;
      const dx = sx - p.x, dy = sy - p.y;
      // Camera-space projection: project the sprite delta onto the player's
      // forward axis (perp depth, used for sizing + z-buffer) and side axis
      // (screen-x). This keeps sprites anchored to their world position as
      // the camera rotates/moves; angle-based mapping drifts because it uses
      // a linear angle→column map with euclidean depth.
      const depth = dx * Math.cos(p.a) + dy * Math.sin(p.a);   // forward (perp)
      if (depth <= 0.2 || depth > 12) return;
      const side = -dx * Math.sin(p.a) + dy * Math.cos(p.a);   // screen-right
      const theta = Math.atan2(side, depth);
      const screenX = ((0.5 + theta / fov) * W) | 0;            // matches the wall column for this angle
      const sh = (H / depth) * scale;
      const sw = sh * (tw / th);
      const left = Math.floor(screenX - sw / 2), right = Math.floor(screenX + sw / 2);
      const riseOff = (1 - (rise < 0 ? 0 : rise > 1 ? 1 : rise)) * sh * 0.5; // spawn: rise up from the floor
      const top = Math.floor((H - sh) / 2 + riseOff), bottom = Math.floor(top + sh);
      const shade = Math.max(0.25, Math.min(1, 1 - depth / 12));
      for (let x = left; x < right; x++) {
        if (x < 0 || x >= W || depth >= zbuf[x]) continue; // a wall is closer here
        const texX = Math.floor(((x - left) / sw) * tw);
        if (texX < 0 || texX >= tw) continue;
        for (let y = top; y < bottom; y++) {
          if (y < 0 || y >= H) continue;
          const texY = Math.floor(((y - top) / sh) * th);
          if (texY < 0 || texY >= th) continue;
          const c = tex[texY * tw + texX];
          if ((c >>> 24) === 0) continue; // transparent
          const dim = shade * fade;
          const r = (c & 0xff) * dim * sc.r | 0, g = ((c >> 8) & 0xff) * dim * sc.g | 0, b = ((c >> 16) & 0xff) * dim * sc.b | 0;
          buf[y * W + x] = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
        }
      }
    };

    const frame = (now) => {
    if (overRef.current) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const g = gridRef.current, p = playerRef.current;
    const sc = SCENE_TINT[getSkin()] || SCENE_TINT._id;
    // smooth health-bar depletion toward actual health
    dispHealthRef.current += (healthRef.current - dispHealthRef.current) * Math.min(1, dt * 8);
    // recently-lost health ghost: snaps up on heal, drains smoothly after damage
    if (healthRef.current >= ghostHealthRef.current) ghostHealthRef.current = healthRef.current;
    else ghostHealthRef.current += (healthRef.current - ghostHealthRef.current) * Math.min(1, dt * 3);
      const speed = 3 * dt, rspeed = 2.2 * dt;
      const k = keysRef.current;
      const nx = (c) => p.x + Math.cos(p.a) * c, ny = (c) => p.y + Math.sin(p.a) * c;
      if (k['w'] || k['arrowup']) { const tx = nx(speed); if (!isWall(g, Math.floor(p.y), Math.floor(tx))) p.x = tx; const ty = ny(speed); if (!isWall(g, Math.floor(ty), Math.floor(p.x))) p.y = ty; }
      if (k['s'] || k['arrowdown']) { const tx = nx(-speed); if (!isWall(g, Math.floor(p.y), Math.floor(tx))) p.x = tx; const ty = ny(-speed); if (!isWall(g, Math.floor(ty), Math.floor(p.x))) p.y = ty; }
      if (k['a'] || k['arrowleft']) p.a -= rspeed;
      if (k['d'] || k['arrowright']) p.a += rspeed;

      // weapon roll: lean the rifle toward the direction you turn (FPS sway)
      const turnRate = p.a - lastARef.current;
      lastARef.current = p.a;
      const targetRoll = Math.max(-0.4, Math.min(0.4, turnRate * 4));
      rollRef.current += (targetRoll - rollRef.current) * Math.min(1, dt * 8);

      // monsters chase + deal damage on contact
      const espeed = espeedRef.current;
      for (const m of monstersRef.current) {
        if (!m.alive) continue;
        if (m.spawn < 1) m.spawn = Math.min(1, m.spawn + dt * 2);
        const dx = p.x - m.x, dy = p.y - m.y; const d = Math.hypot(dx, dy);
        if (d > 0.2) { const mv = espeed * dt; const tx = m.x + (dx / d) * mv, ty = m.y + (dy / d) * mv; if (!isWall(g, Math.floor(ty), Math.floor(tx))) { m.x = tx; m.y = ty; } }
        if (d < 0.45) {
          m.cool -= dt;
          if (m.cool <= 0) {
            m.cool = 0.9;
            healthRef.current = Math.max(0, healthRef.current - 8); setHealth(healthRef.current); haptics.tap();
            shakeRef.current = performance.now();
            if (healthRef.current <= 0) { end('died'); return; }
          }
        }
      }

      // pickups (walk over)
      if (pickupsRef.current.length) {
        const still = [];
        for (const it of pickupsRef.current) {
          if (Math.hypot(it.x - p.x, it.y - p.y) < 0.5) {
            if (it.kind === 'A') { ammoRef.current += 5; setAmmo(ammoRef.current); haptics.click(); }
            else { healthRef.current = Math.min(100, healthRef.current + 25); setHealth(healthRef.current); haptics.click(); }
          } else still.push(it);
        }
        pickupsRef.current = still;
      }

      // ── render ──
      const ceilC = pack((22 * sc.r) | 0, (24 * sc.g) | 0, (32 * sc.b) | 0);
      buf.fill(ceilC, 0, floorStart * W);
      // textured floor (perpendicular floor casting)
      {
        const rayX = new Float32Array(W), rayY = new Float32Array(W), invCos = new Float32Array(W);
        for (let x = 0; x < W; x++) {
          const theta = -fov / 2 + (x / W) * fov;
          const ra = p.a + theta;
          rayX[x] = Math.cos(ra); rayY[x] = Math.sin(ra);
          invCos[x] = 1 / Math.cos(theta);
        }
        const PX = p.x, PY = p.y;
        for (let y = floorStart; y < H; y++) {
          const d = rowD[y], sh = rowShade[y], rowOff = y * W;
          for (let x = 0; x < W; x++) {
            const f = d * invCos[x];
            const fx = PX + rayX[x] * f, fy = PY + rayY[x] * f;
            const tx = ((fx - Math.floor(fx)) * 32 | 0) & 31;
            const tya = ((fy - Math.floor(fy)) * 32 | 0) & 31;
            const c = floorTex[tya * 32 + tx];
            const rr = (c & 255) * sh * sc.r | 0, gg = ((c >> 8) & 255) * sh * sc.g | 0, bb = ((c >> 16) & 255) * sh * sc.b | 0;
            buf[rowOff + x] = (0xff000000 | (bb << 16) | (gg << 8) | rr) >>> 0;
          }
        }
      }
      for (let x = 0; x < W; x++) {
        const ra = p.a - fov / 2 + (x / W) * fov;
        const r = dda(g, p.x, p.y, ra);
        zbuf[x] = r.perp;
        const ch = tileCh(g, r.mapY, r.mapX);
        const lineH = Math.min(H * 3, H / r.perp);
        const worldTop = (H - lineH) / 2;
        const startY = Math.max(0, Math.floor(worldTop));
        const endY = Math.min(H, Math.ceil(worldTop + lineH));
        const wallX = (r.side === 0) ? (p.y + r.perp * Math.sin(ra)) : (p.x + r.perp * Math.cos(ra));
        const texX = (Math.floor((wallX - Math.floor(wallX)) * 32)) & 31;
        const tex = ch === 'E' ? exitTex : wallTex;
        const colShade = Math.max(0.18, Math.min(1, 1 - r.perp / 9));
        const sideShade = r.side === 0 ? colShade : colShade * 0.78;
        if (ch === 'E') { // exit portal: brighter, always lit
          const pulse = 0.85 + 0.15 * Math.sin(now * 0.006);
          for (let y = startY; y < endY; y++) {
            const texY = (Math.floor((y - worldTop) / lineH * 32)) & 31;
            const c = tex[texY * 32 + texX];
            const r2 = (c & 0xff) * 1.35 * pulse * sc.r | 0, g2 = ((c >> 8) & 0xff) * 1.35 * pulse * sc.g | 0, b2 = ((c >> 16) & 0xff) * 1.35 * pulse * sc.b | 0;
            buf[y * W + x] = (0xff000000 | (Math.min(255, b2) << 16) | (Math.min(255, g2) << 8) | Math.min(255, r2)) >>> 0;
          }
          continue;
        }
        for (let y = startY; y < endY; y++) {
          const texY = (Math.floor((y - worldTop) / lineH * 32)) & 31;
          const c = tex[texY * 32 + texX];
          const r2 = (c & 0xff) * sideShade * sc.r | 0, g2 = ((c >> 8) & 0xff) * sideShade * sc.g | 0, b2 = ((c >> 16) & 0xff) * sideShade * sc.b | 0;
          buf[y * W + x] = (0xff000000 | (b2 << 16) | (g2 << 8) | r2) >>> 0;
        }
      }

      // ── sprites (enemies + pickups), z-buffered ──
      const ents = [];
      for (const m of monstersRef.current) if (m.alive) ents.push({ x: m.x, y: m.y, tex: enemyTex.t, tw: enemyTex.W, th: enemyTex.H, scale: easeOutBack(m.spawn), d: 0, fade: m.spawn, rise: m.spawn });
      for (const it of pickupsRef.current) {
        const a = it.kind === 'A' ? ammoTex : healthTex;
        ents.push({ x: it.x, y: it.y, tex: a.t, tw: a.W, th: a.H, scale: 0.55, d: 0 });
      }
      for (const e of ents) e.d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      ents.sort((a, b) => b.d - a.d);
      for (const e of ents) drawSprite(e.x, e.y, e.tex, e.tw, e.th, e.scale, e.fade || 1, e.rise);

      ctx.putImageData(imageData, 0, 0);
      // crosshair
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(W / 2 - 1, H / 2 - 1, 2, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(W / 2 - 4, H / 2, 8, 1);
      ctx.fillRect(W / 2, H / 2 - 4, 1, 8);
      // ── in-canvas HUD: ammo + health bar (bottom-left), tinted to the active skin ──
      const tint = SKIN_TINT[getSkin()];
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(4, H - 27, 86, 23);
      ctx.fillStyle = tint || (ammoRef.current > 0 ? '#cfe6ff' : '#ff9a7a');
      ctx.font = '8px monospace';
      ctx.textBaseline = 'top';
      // bullet icon (language-agnostic) — brass body + pointed tip, pointing right
      const bx = 8, by = H - 23;
      ctx.fillRect(bx, by - 1, 7, 4);                                  // cartridge body
      ctx.beginPath();
      ctx.moveTo(bx + 7, by - 2);
      ctx.lineTo(bx + 11, by + 1);
      ctx.lineTo(bx + 7, by + 4);
      ctx.closePath();
      ctx.fill();                                                       // brass tip
      ctx.fillText(String(ammoRef.current), bx + 14, H - 25);
      const hf = Math.max(0, Math.min(1, dispHealthRef.current / 100));
      ctx.fillStyle = tint ? 'rgba(10,30,10,0.9)' : 'rgba(30,10,10,0.9)';
      ctx.fillRect(8, H - 13, 78, 6);
      // trailing "recently lost" chunk that recedes a beat after damage
      const gf = Math.max(0, Math.min(1, ghostHealthRef.current / 100));
      ctx.fillStyle = tint ? 'rgba(70,160,70,0.55)' : 'rgba(255,140,140,0.5)';
      ctx.fillRect(8, H - 13, 78 * gf, 6);
      ctx.fillStyle = tint || (healthRef.current > 30 ? '#e84545' : '#f59e0b');
      ctx.fillRect(8, H - 13, 78 * hf, 6);
      // ── gun view-model (bottom-right) + muzzle flash ──
      const sprite = gunSprite || gunCanvas;
      if (sprite) {
        const roll = rollRef.current;
        const bobX = Math.sin(now * 0.006) * 1.4;
        const bobY = Math.cos(now * 0.012) * 1.1;
        if (gunSprite) {
          // generated FPS rifle: anchored bottom-right, barrel aimed at the
          // screen-center crosshair. Drawn bigger and tinted per active skin.
          const sw = 170;
          const sh = sw * (gunSprite.height / gunSprite.width);
          const gx = W - sw - 2 + bobX * 0.3, gy = H - sh + 22 + bobY * 0.4;
          const ox = gx + sw * 0.5, oy = gy + sh * 0.74;
          ctx.save();
          ctx.translate(ox, oy); ctx.rotate(roll * 0.4); ctx.translate(-ox, -oy);
          ctx.drawImage(getTintedGunSprite(tint), gx, gy, sw, sh);
          ctx.restore();
          if (now - flashRef.current < 90) {
            // muzzle flash anchored to the birdcage muzzle of the drawn sprite
            // (≈ image fraction 0.52/0.51), rotated with the same weapon-roll + bob
            const lx = gx + sw * 0.52, ly = gy + sh * 0.51;
            const a = roll * 0.4, ca = Math.cos(a), sa = Math.sin(a);
            const mx = ox + (lx - ox) * ca - (ly - oy) * sa;
            const my = oy + (lx - ox) * sa + (ly - oy) * ca;
            const flashC = tint || 'rgba(255,210,80,0.95)';
            ctx.fillStyle = flashC;
            ctx.beginPath(); ctx.arc(mx, my, 11 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,250,230,0.9)';
            ctx.beginPath(); ctx.arc(mx, my, 5 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          const FSCALE = 1.3;
          const gw = gunCanvas.width * FSCALE, gh = gunCanvas.height * FSCALE;
          const gx = W - gw + 6 + bobX * 0.3, gy = H - gh + 22 + bobY * 0.4;
          const px = gx + gw * GUN_PIVOT_X, py = gy + gh * GUN_PIVOT_Y;
          ctx.save();
          ctx.translate(px, py); ctx.rotate(roll); ctx.translate(-px, -py);
          ctx.drawImage(gunCanvas, gx, gy, gw, gh);
          ctx.restore();
          if (now - flashRef.current < 90) {
            // muzzle baked into gunCanvas at local fraction ≈0.387/0.536; rotate it
            // with the same roll (GUN_ANGLE is already baked into the sprite) about the pivot
            const lx = gx + gw * 0.387, ly = gy + gh * 0.536;
            const a = roll, ca = Math.cos(a), sa = Math.sin(a);
            const mx = px + (lx - px) * ca - (ly - py) * sa;
            const my = py + (lx - px) * sa + (ly - py) * ca;
            ctx.fillStyle = tint || 'rgba(255,210,80,0.95)';
            ctx.beginPath(); ctx.arc(mx, my, 10 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,250,230,0.9)';
            ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      // ── damage feedback: screen shake + red edge flash ──
      {
        const st = now - shakeRef.current;
        if (st < 380) {
          const f = easeOutQuart(1 - st / 380);
          canvas.style.transform = `translate(${((Math.random() * 2 - 1) * f * 6) | 0}px, ${((Math.random() * 2 - 1) * f * 6) | 0}px)`;
          ctx.fillStyle = `rgba(255,60,60,${f * 0.55})`;
          ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H - 3, W, 3);
          ctx.fillRect(0, 0, 3, H); ctx.fillRect(W - 3, 0, 3, H);
        } else {
          canvas.style.transform = '';
        }
      }

      // exit / next floor
      const ct = tileCh(g, Math.floor(p.y), Math.floor(p.x));
      if (ct === 'E') {
        loadFloor(floorRef.current + 1);
        last = now;
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, shoot, end, loadFloor]);

  const resultText = over === 'victory' ? t('victory') : over === 'died' ? t('youDied') : '';

  return (
    <GameShell icon={Skull} title={t('doomTitle')}
      controls={
        <button onClick={startGame} className="calc-btn px-3 py-1.5 text-xs"
          style={{ width: 'auto', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{t('newGame')}</button>
      }>
      <div className="panel p-2 mb-3 flex items-center gap-1.5">
        <span className="text-[10px] uppercase opacity-60 px-1">{t('difficulty')}</span>
        {['easy', 'medium', 'hard'].map((d) => (
          <button key={d} onClick={() => setDifficulty(d)} className="calc-btn px-2 py-1 text-[11px] flex-1" style={{
            width: 'auto',
            background: diff === d ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
            color: diff === d ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
          }}>{t(d)}</button>
        ))}
      </div>
      <div className="panel p-3 mb-3 flex items-center justify-around text-center">
        <div><div className="text-[10px] uppercase opacity-60">{t('kills')}</div><div className="font-mono text-xl">{kills}</div></div>
        <div><div className="text-[10px] uppercase opacity-60">{t('floor')}</div><div className="font-mono text-xl">{floor + 1}</div></div>
      </div>

      <div className="panel p-2 flex justify-center relative">
        {!running && !over && <StartOverlay onStart={startGame} label={t('play')} />}
        <canvas
          ref={canvasRef}
          width={240} height={150}
          className="rounded-lg"
          style={{ width: 'min(92vw, 480px)', height: 'auto', aspectRatio: '240/150', imageRendering: 'pixelated', background: '#000', cursor: 'crosshair', touchAction: 'none' }}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 max-w-[360px] mx-auto">
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <button onPointerDown={(e) => { e.preventDefault(); keysRef.current['w'] = true; }} onPointerUp={() => keysRef.current['w'] = false} onPointerLeave={() => keysRef.current['w'] = false} onPointerCancel={() => keysRef.current['w'] = false} className="calc-btn h-11 w-11 text-lg" style={{ touchAction: 'none' }}>▲</button>
          <div />
          <button onPointerDown={(e) => { e.preventDefault(); keysRef.current['a'] = true; }} onPointerUp={() => keysRef.current['a'] = false} onPointerLeave={() => keysRef.current['a'] = false} onPointerCancel={() => keysRef.current['a'] = false} className="calc-btn h-11 w-11 text-lg" style={{ touchAction: 'none' }}>◀</button>
          <button onPointerDown={(e) => { e.preventDefault(); keysRef.current['s'] = true; }} onPointerUp={() => keysRef.current['s'] = false} onPointerLeave={() => keysRef.current['s'] = false} onPointerCancel={() => keysRef.current['s'] = false} className="calc-btn h-11 w-11 text-lg" style={{ touchAction: 'none' }}>▼</button>
          <button onPointerDown={(e) => { e.preventDefault(); keysRef.current['d'] = true; }} onPointerUp={() => keysRef.current['d'] = false} onPointerLeave={() => keysRef.current['d'] = false} onPointerCancel={() => keysRef.current['d'] = false} className="calc-btn h-11 w-11 text-lg" style={{ touchAction: 'none' }}>▶</button>
        </div>
        <button onPointerDown={startFire} onPointerUp={stopFire} onPointerLeave={stopFire} onPointerCancel={stopFire} className="calc-btn" style={{ width: '5rem', height: '5rem', background: 'hsl(var(--destructive))', color: '#fff', borderRadius: '50%', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Crosshair style={{ width: 30, height: 30 }} /></button>
      </div>
      <div className="mt-3 panel px-4 py-3 text-center text-[11px] opacity-60">{t('doomHint')}</div>

      <Scoreboard gameKey="dungeon" stats={[
        { key: 'kills', labelKey: 'bestScore', fmt: v => v },
        { key: 'floor', labelKey: 'deepestFloor', fmt: v => v },
      ]} />

      {over && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="panel p-6 text-center">
            <div className="font-mono text-2xl uppercase tracking-widest mb-2" style={{ color: over === 'victory' ? 'hsl(120 60% 50%)' : 'hsl(var(--destructive))' }}>{resultText}</div>
            <div className="font-mono mb-4">{t('kills')}: {kills} · {t('floor')}: {floor + 1}</div>
            <button onClick={startGame} className="calc-btn px-4 py-2 text-sm font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 'auto' }}>{t('newGame')}</button>
          </div>
        </div>
      )}
    </GameShell>
  );
}