// Shared Tetris definitions and helpers (no JSX — pure data/logic).
import { getSkin } from '@/lib/skins';

export const COLS = 10;
export const ROWS = 18;

export const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
};
export const COLORS = { I: '#38bdf8', O: '#fbbf24', T: '#c084fc', S: '#34d399', Z: '#f87171', L: '#fb923c', J: '#60a5fa' };

// On the monochrome CRT skins (Pip-Boy green phosphor, Ham Radio amber, etc.)
// the standard rainbow piece colors clash with the single-tone display, so
// every piece takes that skin's signature color. The grid borders keep
// adjacent same-color cells distinguishable.
const SKIN_PIECE_COLOR = {
  'pip-boy': '#39ff5a',
  'ham-radio': '#ffb347',
  'audio-rack': '#7fff7f',
  'retro-scifi': '#00ffff',
};

// Returns the block color for a piece key, adapted to the active appearance.
export function pieceColor(key) {
  const c = SKIN_PIECE_COLOR[getSkin()];
  if (c) return c;
  return COLORS[key] || '#888';
}

export function rotate(m) {
  const n = m.length;
  const r = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) r[j][n - 1 - i] = m[i][j];
  return r;
}
export function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
export function randomPiece() {
  const keys = Object.keys(SHAPES);
  const k = keys[Math.floor(Math.random() * keys.length)];
  return { key: k, mat: SHAPES[k].map(r => r.slice()), r: 0, c: Math.floor((COLS - SHAPES[k][0].length) / 2) };
}
export function collide(board, piece) {
  for (let i = 0; i < piece.mat.length; i++) for (let j = 0; j < piece.mat[0].length; j++) {
    if (!piece.mat[i][j]) continue;
    const nr = piece.r + i, nc = piece.c + j;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) return true;
  }
  return false;
}
export function merge(board, piece) {
  const nb = board.map(r => r.slice());
  for (let i = 0; i < piece.mat.length; i++) for (let j = 0; j < piece.mat[0].length; j++) {
    if (piece.mat[i][j] && piece.r + i >= 0) nb[piece.r + i][piece.c + j] = piece.key;
  }
  return nb;
}
export function clearLines(board) {
  const kept = board.filter(r => r.some(c => !c));
  const cleared = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  return { board: kept, cleared };
}