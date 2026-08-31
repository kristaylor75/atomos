import { useState, useCallback, useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getSkin } from '@/lib/skins';
import GameShell from './GameShell';
import { submitStat } from '@/lib/gameScores';
import Scoreboard from './Scoreboard';

// ── Compact chess engine (no external lib) ────────────────────────────────────
// White pieces uppercase (PNBRQK), black lowercase, '' = empty. Rank 0 is the
// 8th rank (top, black back row). Moves reference {fr,fc,tr,tc,special}.

const GLYPH = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: 'Pawn' };
// White side uses the *outline* (hollow) glyphs, black side the *solid* ones.
// Distinguishing by shape (not just color) keeps the two sides readable under
// any appearance/skin — e.g. the Pip-Boy skin force-recolors everything green.
const UNI = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

function initialBoard() {
  return [
    'r','n','b','q','k','b','n','r',
    'p','p','p','p','p','p','p','p',
    '','','','','','','','',
    '','','','','','','','',
    '','','','','','','','',
    '','','','','','','','',
    'P','P','P','P','P','P','P','P',
    'R','N','B','Q','K','B','N','R',
  ];
}
const on = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const isWhite = (p) => p !== '' && p === p.toUpperCase();
const isBlack = (p) => p !== '' && p === p.toLowerCase();
const same = (p, color) => color === 'w' ? isWhite(p) : isBlack(p);

function pseudoMoves(board, r, c, st) {
  const p = board[r * 8 + c];
  if (!p) return [];
  const color = isWhite(p) ? 'w' : 'b';
  const moves = [];
  const push = (tr, tc, special) => moves.push({ fr: r, fc: c, tr, tc, special });
  const enemy = (tr, tc) => same(board[tr * 8 + tc], color === 'w' ? 'b' : 'w');
  const slide = (dirs) => {
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc;
      while (on(tr, tc)) {
        const t = board[tr * 8 + tc];
        if (t) { if (same(t, color)) break; push(tr, tc); break; }
        push(tr, tc); tr += dr; tc += dc;
      }
    }
  };
  const up = color === 'w' ? -1 : 1;
  const pr = r + up;
  if (p.toUpperCase() === 'P') {
    if (on(pr, c) && !board[pr * 8 + c]) {
      if (pr === (color === 'w' ? 0 : 7)) push(pr, c, 'promo');
      else push(pr, c);
      const sRow = color === 'w' ? 6 : 1;
      if (r === sRow && !board[(r + 2 * up) * 8 + c]) push(r + 2 * up, c, 'db');
    }
    for (const dc of [-1, 1]) {
      const tr = pr, tc = c + dc;
      if (on(tr, tc) && enemy(tr, tc)) push(tr, tc, pr === (color === 'w' ? 0 : 7) ? 'promo' : undefined);
      if (st.ep && st.ep.r === tr && st.ep.c === tc) push(tr, tc, 'ep');
    }
  } else if (p.toUpperCase() === 'N') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const tr = r + dr, tc = c + dc;
      if (on(tr, tc) && !same(board[tr * 8 + tc], color)) push(tr, tc);
    }
  } else if (p.toUpperCase() === 'B') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  else if (p.toUpperCase() === 'R') slide([[-1,0],[1,0],[0,-1],[0,1]]);
  else if (p.toUpperCase() === 'Q') slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  else if (p.toUpperCase() === 'K') {
    for (const dr of [-1,0,1]) for (const dc of [-1,0,1]) {
      if (dr || dc) { const tr = r + dr, tc = c + dc; if (on(tr, tc) && !same(board[tr * 8 + tc], color)) push(tr, tc); }
    }
    // castling
    const kr = color === 'w' ? 7 : 0;
    if (r === kr && c === 4) {
      if (st.cr[color === 'w' ? 'K' : 'k'] && !board[kr*8+5] && !board[kr*8+6] && board[kr*8+7]?.toUpperCase() === 'R')
        push(kr, 6, 'ck');
      if (st.cr[color === 'w' ? 'Q' : 'q'] && !board[kr*8+3] && !board[kr*8+2] && !board[kr*8+1] && board[kr*8+0]?.toUpperCase() === 'R')
        push(kr, 2, 'cq');
    }
  }
  return moves;
}

function findKing(board, color) {
  const k = color === 'w' ? 'K' : 'k';
  for (let i = 0; i < 64; i++) if (board[i] === k) return [Math.floor(i / 8), i % 8];
  return null;
}

function squareAttacked(board, r, c, byColor) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || !same(p, byColor)) continue;
    // pawn attacks only (for speed reuse pseudoMoves but skip king/castle)
    const pr = Math.floor(i / 8), pc = i % 8;
    if (p.toUpperCase() === 'P') {
      const dir = byColor === 'w' ? -1 : 1;
      if (pr + dir === r && (pc - 1 === c || pc + 1 === c)) return true;
      continue;
    }
    const ms = pseudoMoves(board, pr, pc, { ep: null, cr: {} });
    for (const m of ms) if (m.special !== 'ck' && m.special !== 'cq' && m.tr === r && m.tc === c) return true;
  }
  return false;
}

function inCheck(board, color) {
  const k = findKing(board, color);
  if (!k) return false;
  return squareAttacked(board, k[0], k[1], color === 'w' ? 'b' : 'w');
}

function applyMove(board, m, st) {
  const nb = board.slice();
  const p = nb[m.fr * 8 + m.fc];
  nb[m.tr * 8 + m.tc] = p;
  nb[m.fr * 8 + m.fc] = '';
  if (m.special === 'ep') nb[m.fr * 8 + m.tc] = '';
  if (m.special === 'promo') nb[m.tr * 8 + m.tc] = isWhite(p) ? 'Q' : 'q';
  if (m.special === 'ck') { nb[m.tr * 8 + 5] = nb[m.tr * 8 + 7]; nb[m.tr * 8 + 7] = ''; }
  if (m.special === 'cq') { nb[m.tr * 8 + 3] = nb[m.tr * 8 + 0]; nb[m.tr * 8 + 0] = ''; }
  const color = isWhite(p) ? 'w' : 'b';
  const ncr = { ...st.cr };
  if (p.toUpperCase() === 'K') { ncr[color === 'w' ? 'K' : 'k'] = false; ncr[color === 'w' ? 'Q' : 'q'] = false; }
  if (m.fr === 7 && m.fc === 0) ncr.Q = false;
  if (m.fr === 7 && m.fc === 7) ncr.K = false;
  if (m.fr === 0 && m.fc === 0) ncr.q = false;
  if (m.fr === 0 && m.fc === 7) ncr.k = false;
  let ep = null;
  if (m.special === 'db') ep = { r: (m.fr + m.tr) / 2, c: m.fc };
  return { board: nb, cr: ncr, ep };
}

function legalMoves(board, color, st) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    if (!same(board[i], color)) continue;
    const r = Math.floor(i / 8), c = i % 8;
    for (const m of pseudoMoves(board, r, c, st)) {
      const { board: nb } = applyMove(board, m, st);
      if (!inCheck(nb, color)) out.push(m);
    }
  }
  return out;
}

function evaluate(board) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i]; if (!p) continue;
    const r = Math.floor(i / 8), c = i % 8;
    const up = p.toUpperCase(), sign = isWhite(p) ? 1 : -1;
    s += sign * (VAL[up] || 0);
    if (up === 'P') s += sign * (isWhite(p) ? (6 - r) : (r - 1)) * 5;            // pawn advancement
    else if (up === 'N' || up === 'B') s += sign * (c >= 2 && c <= 5 && r >= 2 && r <= 5 ? 12 : 0); // centralize
    else if (up === 'Q') s += sign * (c >= 2 && c <= 5 ? 6 : 0);               // queen activity
    else if (up === 'K') s -= sign * (c >= 2 && c <= 5 && r >= 3 && r <= 4 ? 24 : 0); // king safety (don't wander)
  }
  return s;
}

function isCaptureMove(board, m) { return m.special === 'ep' || board[m.tr * 8 + m.tc] !== ''; }

function captureMoves(board, color, st) {
  const out = [];
  for (let i = 0; i < 64; i++) {
    if (!same(board[i], color)) continue;
    const r = Math.floor(i / 8), c = i % 8;
    for (const m of pseudoMoves(board, r, c, st)) {
      if (m.special === 'ck' || m.special === 'cq') continue;
      if (isCaptureMove(board, m)) out.push(m);
    }
  }
  return out;
}

// Capture-only search at the leaf of the main search so the bot avoids the
// most obvious recapture blunders. Cheap (few captures per node) so it never
// freezes the UI, yet it makes Hard tactically sharper than Medium.
function quiesce(board, st, color, alpha, beta, maximizing, ply) {
  const stand = evaluate(board) * (maximizing ? 1 : -1);
  if (ply <= 0) return stand;
  if (maximizing) { if (stand >= beta) return beta; if (stand > alpha) alpha = stand; }
  else { if (stand <= alpha) return alpha; if (stand < beta) beta = stand; }
  const caps = captureMoves(board, color, st);
  if (!caps.length) return stand;
  for (const m of caps) {
    const { board: nb, cr, ep } = applyMove(board, m, st);
    const v = quiesce(nb, { cr, ep }, color === 'w' ? 'b' : 'w', alpha, beta, !maximizing, ply - 1);
    if (maximizing) { if (v >= beta) return beta; if (v > alpha) alpha = v; }
    else { if (v <= alpha) return alpha; if (v < beta) beta = v; }
  }
  return maximizing ? alpha : beta;
}

function minimax(board, st, color, depth, alpha, beta, maximizing, useQ) {
  if (depth === 0) return useQ ? quiesce(board, st, color, alpha, beta, maximizing, 2) : evaluate(board) * (maximizing ? 1 : -1);
  const moves = legalMoves(board, color, st);
  if (moves.length === 0) return inCheck(board, color) ? (maximizing ? -100000 : 100000) : 0;
  let best = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const { board: nb, cr, ep } = applyMove(board, m, st);
    const v = minimax(nb, { cr, ep }, color === 'w' ? 'b' : 'w', depth - 1, alpha, beta, !maximizing, useQ);
    best = maximizing ? Math.max(best, v) : Math.min(best, v);
    if (maximizing) alpha = Math.max(alpha, v); else beta = Math.min(beta, v);
    if (beta <= alpha) break;
  }
  return best;
}

function botMove(board, st, color, difficulty) {
  const moves = legalMoves(board, color, st);
  if (!moves.length) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  const useQ = difficulty === 'hard';          // hard sharpens tactics at leaf nodes (quiescence)
  const depth = 3;                             // depth 4 freezes the UI; deeper eval + quiescence make 3 strong
  const maximizing = color === 'w';
  let best = moves[0], bestScore = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const { board: nb, cr, ep } = applyMove(board, m, st);
    const v = minimax(nb, { cr, ep }, color === 'w' ? 'b' : 'w', depth - 1, -Infinity, Infinity, !maximizing, useQ);
    if (maximizing ? v > bestScore : v < bestScore) { bestScore = v; best = m; }
  }
  return best;
}

// ── Component ──────────────────────────────────────────────────────────────────
const FILES = 'abcdefgh';

// Board square colors per appearance skin — kept dark/mid so the fixed white &
// black piece glyphs stay readable (Pip-Boy recolors the glyphs themselves).
const BOARD = {
  default:         { dark: 'hsl(220 16% 18%)', light: 'hsl(220 16% 26%)' },
  'pip-boy':       { dark: 'hsl(120 35% 10%)', light: 'hsl(120 30% 18%)' },
  'ham-radio':     { dark: 'hsl(35 40% 16%)', light: 'hsl(35 35% 24%)' },
  'graphing-calc': { dark: 'hsl(75 12% 40%)', light: 'hsl(75 8% 50%)' },
  'audio-rack':    { dark: 'hsl(120 18% 16%)', light: 'hsl(120 16% 24%)' },
  'retro-scifi':   { dark: 'hsl(240 40% 16%)', light: 'hsl(200 55% 24%)' },
};

// Piece glyph colors per skin. White side uses the hollow outline glyphs and
// black side the filled glyphs (see UNI), so the two sides stay distinguishable
// by shape even where a skin forces a single color (Pip-Boy). Each pair is
// tuned to read clearly off that skin's board squares and from each other.
const PIECES = {
  default:         { w: 'hsl(0 0% 95%)',   b: 'hsl(0 0% 12%)' },
  'pip-boy':       { w: '#39ff5a',         b: '#39ff5a' },
  'ham-radio':     { w: 'hsl(45 85% 80%)', b: 'hsl(28 60% 36%)' },
  'graphing-calc': { w: 'hsl(60 4% 26%)',  b: 'hsl(60 2% 6%)' },
  'audio-rack':    { w: 'hsl(120 45% 72%)',b: 'hsl(120 15% 38%)' },
  'retro-scifi':   { w: 'hsl(0 0% 92%)',   b: 'hsl(180 80% 55%)' },
};

export default function ChessGame() {
  const { t } = useLanguage();
  // History of game snapshots: index 0 = starting position, last = live/current.
  // viewIdx walks back/forward through past positions; new moves append and
  // jump to the live end. The bot and player can only move while atCurrent.
  const [history, setHistory] = useState(() => [{ board: initialBoard(), st: { cr: { K: true, Q: true, k: true, q: true }, ep: null }, turn: 'w', move: null }]);
  const [viewIdx, setViewIdx] = useState(0);
  const current = history[viewIdx];
  const board = current.board;
  const st = current.st;
  const turn = current.turn;
  const atCurrent = viewIdx === history.length - 1;
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState('bot');
  const [diff, setDiff] = useState('medium');
  const [legal, setLegal] = useState([]);
  const [status, setStatus] = useState('');
  const [botBusy, setBotBusy] = useState(false);
  const boardRef = useRef(null);
  const [wins, setWins] = useState(0);
  const wonRef = useRef(false);

  // active appearance skin — re-renders when the user swaps skins elsewhere
  const [skin, setSkin] = useState(getSkin());
  useEffect(() => {
    const onSkin = () => setSkin(getSkin());
    window.addEventListener('skinchange', onSkin);
    return () => window.removeEventListener('skinchange', onSkin);
  }, []);

  // ── move-history navigation (arrow keys) ───────────────────────────────
  const navBack = () => setViewIdx(i => Math.max(0, i - 1));
  const navFwd = () => setViewIdx(i => Math.min(history.length - 1, i + 1));
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); navBack(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navFwd(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history.length]);
  // stale selection / legal-move dots are cleared while reviewing past moves
  useEffect(() => { if (!atCurrent) { setSel(null); setLegal([]); } }, [atCurrent]);

  // append a move at the current view (truncates nothing newer since only
  // called from the live position) and advance the view to the new live end
  const pushMove = (m) => {
    const cur = history[viewIdx];
    const r = applyMove(cur.board, m, cur.st);
    const newTurn = cur.turn === 'w' ? 'b' : 'w';
    const newHist = history.slice(0, viewIdx + 1).concat([{ board: r.board, st: { cr: r.cr, ep: r.ep }, turn: newTurn, move: { fr: m.fr, fc: m.fc, tr: m.tr, tc: m.tc } }]);
    setHistory(newHist);
    setViewIdx(newHist.length - 1);
    setSel(null); setLegal([]);
  };

  // ── drag-to-move ───────────────────────────────────────────────────────
  const suppressClickRef = useRef(false);
  const dragRef = useRef(null);
  const lastHintRef = useRef(null);
  const ghostNodeRef = useRef(null);
  const [dragging, setDragging] = useState(false);     // ghost + drop highlights shown
  const [dragTargets, setDragTargets] = useState(null); // Set<"r,c"> of legal drop squares
  const [dropHint, setDropHint] = useState(null);        // "r,c" currently hovered
  const [dragFrom, setDragFrom] = useState(null);        // {r,c} source square (hide its glyph)

  const ensureGhost = (piece) => {
    let el = ghostNodeRef.current;
    if (!el) {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;pointer-events:none;will-change:transform;display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(el);
      ghostNodeRef.current = el;
    }
    const white = isWhite(piece);
    el.innerHTML = '<span style="font-family:var(--font-mono);font-size:clamp(28px,9vw,48px);line-height:1;color:' + (white ? '#f8fafc' : '#0a0a0a') + ';text-shadow:' + (white ? '0 2px 6px rgba(0,0,0,.7),0 0 2px rgba(255,255,255,.5)' : '0 2px 6px rgba(0,0,0,.7),0 0 2px rgba(255,255,255,.4)') + ';transform:scale(1.12);filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));">' + UNI[piece] + '</span>';
  };
  const moveGhost = (x, y) => { const el = ghostNodeRef.current; if (el) el.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'; };
  const clearGhost = () => { const el = ghostNodeRef.current; if (el) { el.remove(); ghostNodeRef.current = null; } };

  const onDragMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) {
        d.started = true; lastHintRef.current = null;
        setDragging(true); setDragTargets(d.targets); setDragFrom({ r: d.fromR, c: d.fromC });
        ensureGhost(d.piece); moveGhost(e.clientX, e.clientY);
      } else return;
    }
    moveGhost(e.clientX, e.clientY);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const sq = el && el.closest && el.closest('[data-sq]');
    const key = sq ? (+sq.dataset.r) + ',' + (+sq.dataset.c) : null;
    if (key !== lastHintRef.current) { lastHintRef.current = key; setDropHint(key); }
    e.preventDefault();
  };

  const onDragEnd = (e) => {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragEnd);
    const d = dragRef.current; dragRef.current = null;
    if (d && d.started) {
      suppressClickRef.current = true; // drop the trailing click gesture
      const ev = e || {};
      const el = ev.clientX != null ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
      const sq = el && el.closest && el.closest('[data-sq]');
      if (sq) {
        const tr = +sq.dataset.r, tc = +sq.dataset.c;
        const m = d.legal.find(mv => mv.tr === tr && mv.tc === tc);
        if (m) { pushMove(m); setArrows([]); }
      }
    }
    clearGhost();
    setDragging(false); setDragTargets(null); setDropHint(null); setDragFrom(null); lastHintRef.current = null;
  };

  const startDrag = (r, c, piece, e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (mode === 'bot' && turn !== 'w') return;
    if (status === t('checkmate') || status === t('stalemate')) return;
    if (!atCurrent) return;   // reviewing history: no dragging pieces
    if (!same(piece, turn)) return;
    const lm = legalMoves(board, turn, st).filter(m => m.fr === r && m.fc === c);
    if (!lm.length) return;
    dragRef.current = { fromR: r, fromC: c, piece, legal: lm, targets: new Set(lm.map(m => m.tr + ',' + m.tc)), started: false, startX: e.clientX, startY: e.clientY };
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragEnd);
  };

  useEffect(() => () => { clearGhost(); }, []);

  // ── right-click drag to draw planning arrows ───────────────────────────
  const drawRef = useRef({ active: false, fr: 0, fc: 0, tr: 0, tc: 0, moved: false });
  const [arrows, setArrows] = useState([]);
  const [drawPreview, setDrawPreview] = useState(null);

  const squareAt = (x, y) => { const el = document.elementFromPoint(x, y); const sq = el && el.closest && el.closest('[data-sq]'); return sq ? { r: +sq.dataset.r, c: +sq.dataset.c } : null; };

  const onDrawMove = (e) => {
    const d = drawRef.current; if (!d.active) return;
    const sq = squareAt(e.clientX, e.clientY); if (!sq) return;
    if (sq.r !== d.tr || sq.c !== d.tc) { d.tr = sq.r; d.tc = sq.c; d.moved = true; setDrawPreview({ fr: d.fr, fc: d.fc, tr: sq.r, tc: sq.c }); }
    e.preventDefault();
  };

  const onDrawEnd = () => {
    window.removeEventListener('pointermove', onDrawMove);
    window.removeEventListener('pointerup', onDrawEnd);
    const d = drawRef.current; drawRef.current = { active: false, fr: 0, fc: 0, tr: 0, tc: 0, moved: false };
    if (d.moved) setArrows(a => [...a, { fr: d.fr, fc: d.fc, tr: d.tr, tc: d.tc }]);
    else setArrows([]);   // a plain right-click (no drag) clears all arrows
    setDrawPreview(null);
  };

  const startDraw = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 2) return;   // right button only
    e.preventDefault();
    const sq = squareAt(e.clientX, e.clientY); if (!sq) return;
    drawRef.current = { active: true, fr: sq.r, fc: sq.c, tr: sq.r, tc: sq.c, moved: false };
    setDrawPreview({ fr: sq.r, fc: sq.c, tr: sq.r, tc: sq.c });
    window.addEventListener('pointermove', onDrawMove, { passive: false });
    window.addEventListener('pointerup', onDrawEnd);
  };

  const recompute = useCallback((b, s, color, live) => {
    const lm = legalMoves(b, color, s);
    if (!lm.length) {
      const mate = inCheck(b, color);
      if (mate && color === 'b' && live && !wonRef.current) {
        wonRef.current = true;
        setWins(w => { const nw = w + 1; submitStat('chess', 'wins', nw, 'high'); return nw; });
      }
      setStatus(mate ? t('checkmate') : t('stalemate'));
    } else if (inCheck(b, color)) setStatus(t('check'));
    else setStatus('');
  }, [t]);

  useEffect(() => { recompute(board, st, turn, atCurrent); }, [board, st, turn, atCurrent, recompute]);

  // Bot responds on its turn
  useEffect(() => {
    if (!atCurrent) return;   // bot never moves while reviewing history
    if (mode !== 'bot' || turn !== 'b' || status === t('checkmate') || status === t('stalemate')) return;
    setBotBusy(true);
    const id = setTimeout(() => {
      const m = botMove(board, st, 'b', diff);
      if (m) pushMove(m);
      setBotBusy(false);
    }, 250);
    return () => clearTimeout(id);
  }, [atCurrent, turn, mode, board, st, diff, status, t]);

  const click = (r, c) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    setArrows([]);   // any left-click clears planning arrows
    if (mode === 'bot' && turn === 'b') return;
    if (status === t('checkmate') || status === t('stalemate')) return;
    if (!atCurrent) return;   // reviewing history: no selection or moves
    const p = board[r * 8 + c];
    if (sel) {
      const m = legal.find(mv => mv.tr === r && mv.tc === c);
      if (m) { pushMove(m); return; }
      if (same(p, turn)) { pickPiece(r, c); return; }
      setSel(null); setLegal([]); return;
    }
    if (same(p, turn)) pickPiece(r, c);
  };

  const pickPiece = (r, c) => {
    setSel({ r, c });
    setLegal(legalMoves(board, turn, st).filter(m => m.fr === r && m.fc === c));
  };

  const newGame = () => {
    setHistory([{ board: initialBoard(), st: { cr: { K: true, Q: true, k: true, q: true }, ep: null }, turn: 'w', move: null }]);
    setViewIdx(0);
    setSel(null); setLegal([]); setStatus(''); setArrows([]); setDrawPreview(null); wonRef.current = false;
  };

  const flip = sel ? (turn === 'w' ? t('whitesMove') : t('blacksMove')) : null;
  const Sq = ({ r, c }) => {
    const dark = (r + c) % 2 === 1;
    const p = board[r * 8 + c];
    const key = r + ',' + c;
    const isSel = sel && sel.r === r && sel.c === c;
    const isMove = legal.some(m => m.tr === r && m.tc === c);
    const isCap = isMove && p;
    const isFrom = dragFrom && dragFrom.r === r && dragFrom.c === c;     // source piece hidden while dragging
    const dDrop = dragging && dragTargets && dragTargets.has(key);       // legal drop target during a drag
    const dHover = dragging && dropHint === key;                        // square under the pointer
    const dCap = dDrop && p;
    const lastMove = current.move;
    const isLast = lastMove && ((r === lastMove.fr && c === lastMove.fc) || (r === lastMove.tr && c === lastMove.tc));
    const sqBg = (BOARD[skin] || BOARD.default)[dark ? 'dark' : 'light'];
    return (
      <button
        data-sq="1" data-r={r} data-c={c}
        onClick={() => click(r, c)}
        onMouseDown={(e) => e.preventDefault()}   // keep the board from grabbing focus and scrolling the page into view on each move
        className="relative flex items-center justify-center select-none"
        style={{
          width: '100%', aspectRatio: '1/1',
          background: isLast ? `color-mix(in srgb, ${sqBg} 70%, hsl(var(--primary)) 30%)` : sqBg,
          fontFamily: 'var(--font-mono)',
          transition: 'box-shadow .12s ease',
          boxShadow: isSel ? 'inset 0 0 0 3px hsl(var(--primary))'
            : dHover ? 'inset 0 0 0 3px hsl(var(--primary) / 0.9)'
            : isLast ? 'inset 0 0 0 2px hsl(var(--primary) / 0.5)' : 'none',
        }}
      >
        {p && (
          <span
            className={`chess-piece ${isWhite(p) ? 'chess-w' : 'chess-b'}`}
            draggable={false}
            onPointerDown={(e) => startDrag(r, c, p, e)}
            style={{
              fontSize: isFrom ? '0.01px' : 'clamp(20px, 7vw, 36px)',
              color: (PIECES[skin] || PIECES.default)[isWhite(p) ? 'w' : 'b'],
              textShadow: isWhite(p)
                ? '0 1px 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.5)'
                : '0 1px 2px rgba(255,255,255,0.45), 0 0 2px rgba(255,255,255,0.35)',
              lineHeight: 1,
              transition: 'font-size .12s ease, transform .12s ease',
              transform: isFrom ? 'scale(0.6)' : 'none',
              touchAction: 'none',
              userSelect: 'none',
              cursor: atCurrent ? 'grab' : 'default',
              }}>{UNI[p]}</span>
        )}
        {(isMove || dDrop) && (
          <span style={{
            position: 'absolute', width: (isCap || dCap) ? '86%' : '28%', aspectRatio: '1/1',
            borderRadius: '50%',
            background: (isCap || dCap) ? 'transparent' : 'hsl(var(--primary) / 0.45)',
            border: (isCap || dCap) ? '3px solid hsl(var(--primary))' : 'none',
            boxSizing: 'border-box', pointerEvents: 'none',
            transition: 'transform .1s ease',
            transform: dHover ? 'scale(1.1)' : 'none',
          }} />
        )}
      </button>
    );
  };

  return (
    <GameShell icon={Crown} title={t('chessTitle')}
      controls={
        <div className="flex gap-1.5">
          <button onClick={newGame} className="calc-btn px-3 py-1.5 text-xs" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 'auto' }}>{t('newGame')}</button>
        </div>
      }>
      <div className="panel p-3 mb-3">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['bot', 'local'].map(m => (
            <button key={m} onClick={() => { setMode(m); newGame(); }}
              className="tab-item flex-1"
              style={{
                background: mode === m ? 'hsl(var(--card))' : 'transparent',
                color: mode === m ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                boxShadow: mode === m ? '2px 2px 6px var(--neu-dark)' : 'none',
              }}>
              {m === 'bot' ? t('vsComputer') : t('passPlay')}
            </button>
          ))}
        </div>
        {mode === 'bot' && (
          <div className="flex gap-1.5 mb-1">
            <span className="text-[11px] opacity-60 self-center mr-1">{t('difficulty')}</span>
            {['easy', 'medium', 'hard'].map(d => (
              <button key={d} onClick={() => { setDiff(d); newGame(); }}
                className="calc-btn px-2 py-1 text-[11px]" style={{
                  width: 'auto',
                  background: diff === d ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  color: diff === d ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                }}>{t(d)}</button>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-2" onContextMenu={(e) => e.preventDefault()}>
        <div className="relative mx-auto" style={{ maxWidth: 460 }} onPointerDown={startDraw}>
          <div ref={boardRef} className="grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
            {Array.from({ length: 64 }, (_, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              return <Sq key={i} r={r} c={c} />;
            })}
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 8 8" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <marker id="chessArrow" markerWidth="0.6" markerHeight="0.6" refX="0.6" refY="0.3" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L0.6,0.3 L0,0.6 L0.16,0.3 Z" fill="hsl(var(--primary))" />
              </marker>
            </defs>
            {(drawPreview ? [...arrows, drawPreview] : arrows).map((a, i) => {
              const isPrev = i === arrows.length && !!drawPreview;
              return <line key={i} x1={a.fc + 0.5} y1={a.fr + 0.5} x2={a.tc + 0.5} y2={a.tr + 0.5}
                stroke="hsl(var(--primary))" strokeWidth="0.12" strokeLinecap="round"
                strokeOpacity={isPrev ? 0.5 : 0.72} markerEnd="url(#chessArrow)" />;
            })}
          </svg>
        </div>
      </div>

      <div className="mt-3 panel px-4 py-3 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest">
          {status || (atCurrent ? (botBusy ? '…' : (mode === 'bot' ? (turn === 'w' ? t('yourMove') : t('vsComputer')) : flip)) : '')}
        </span>
        <span className="font-mono text-xs opacity-60">{mode === 'bot' ? t('vsComputer') : t('passPlay')} · {t(diff)}</span>
      </div>
      {history.length > 1 && (
        <div className="mt-1.5 panel px-3 py-2 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-widest">
          <button onClick={navBack} disabled={viewIdx === 0} className="calc-btn px-3 py-1.5 text-xs" style={{ width: 'auto', opacity: viewIdx === 0 ? 0.3 : 1 }}>◀</button>
          <span style={{ color: atCurrent ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))' }}>{viewIdx} / {history.length - 1}</span>
          <button onClick={navFwd} disabled={viewIdx === history.length - 1} className="calc-btn px-3 py-1.5 text-xs" style={{ width: 'auto', opacity: viewIdx === history.length - 1 ? 0.3 : 1 }}>▶</button>
        </div>
      )}
      <Scoreboard gameKey="chess" stats={[{ key: 'wins', labelKey: 'wins', fmt: v => v }]} />
    </GameShell>
  );
}