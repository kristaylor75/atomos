import { useState, useEffect, useRef, useCallback } from 'react';
import { Grid2x2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { haptics } from '@/lib/haptics';
import GameShell from './GameShell';
import TetrisBoard from './TetrisBoard';
import {
  COLS, ROWS, rotate, emptyBoard, randomPiece, collide, merge, clearLines,
} from './tetrisDefs';
import PiecePreview from './PiecePreview';
import { submitStat } from '@/lib/gameScores';
import Scoreboard from './Scoreboard';

export default function TetrisGame() {
  const { t } = useLanguage();
  const [board, setBoard] = useState(emptyBoard);
  const [piece, setPiece] = useState(randomPiece);
  const [next, setNext] = useState(randomPiece);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [over, setOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const overRef = useRef(false);
  const pausedRef = useRef(false);
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { overRef.current = over; }, [over]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { levelRef.current = level; }, [level]);

  const reset = useCallback(() => {
    setBoard(emptyBoard()); setPiece(randomPiece()); setNext(randomPiece());
    setScore(0); setLines(0); setLevel(1); setOver(false); setPaused(false);
  }, []);

  const spawnNext = useCallback(() => {
    const np = next;
    setPiece(np); setNext(randomPiece());
    if (collide(boardRef.current, np)) {
      setOver(true); haptics.tap();
      submitStat('blocks', 'score', scoreRef.current, 'high');
      submitStat('blocks', 'lines', linesRef.current, 'high');
      submitStat('blocks', 'level', levelRef.current, 'high');
    }
  }, [next]);

  const lock = useCallback(() => {
    const merged = merge(boardRef.current, pieceRef.current);
    const { board: nb, cleared } = clearLines(merged);
    setBoard(nb);
    if (cleared) {
      setLines(l => { const nl = l + cleared; setLevel(Math.floor(nl / 10) + 1); return nl; });
      setScore(s => s + [0, 100, 300, 500, 800][cleared] * level);
      haptics.click();
    }
    spawnNext();
  }, [level, spawnNext]);

  const move = useCallback((dc, dr) => {
    if (overRef.current || pausedRef.current) return;
    setPiece(p => {
      const np = { ...p, c: p.c + dc, r: p.r + dr };
      return collide(boardRef.current, np) ? p : np;
    });
  }, []);

  const rotatePiece = useCallback(() => {
    if (overRef.current || pausedRef.current) return;
    setPiece(p => {
      const np = { ...p, mat: rotate(p.mat) };
      if (!collide(boardRef.current, np)) return np;
      for (const dc of [-1, 1, -2, 2]) {
        const nk = { ...np, c: np.c + dc };
        if (!collide(boardRef.current, nk)) return nk;
      }
      return p;
    });
  }, []);

  const softDrop = useCallback(() => move(0, 1), [move]);
  const hardDrop = useCallback(() => {
    if (overRef.current || pausedRef.current) return;
    setPiece(p => {
      let np = { ...p };
      while (!collide(boardRef.current, { ...np, r: np.r + 1 })) np = { ...np, r: np.r + 1 };
      setScore(s => s + 2);
      setTimeout(lock, 0);
      return np;
    });
  }, [lock]);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { move(-1, 0); e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { move(1, 0); e.preventDefault(); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { softDrop(); e.preventDefault(); }
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') { rotatePiece(); e.preventDefault(); }
      else if (k === ' ') { e.preventDefault(); hardDrop(); }
      else if (k === 'p' || k === 'P') setPaused(p => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, softDrop, rotatePiece, hardDrop]);

  useEffect(() => {
    if (over || paused) return;
    const id = setInterval(() => {
      if (overRef.current || pausedRef.current) return;
      setPiece(p => {
        const np = { ...p, r: p.r + 1 };
        if (collide(boardRef.current, np)) { setTimeout(lock, 0); return p; }
        return np;
      });
    }, Math.max(120, 600 - (level - 1) * 60));
    return () => clearInterval(id);
  }, [over, paused, level, lock]);

  const btn = (label, fn, muted = false) => (
    <button onClick={fn} className="calc-btn h-12 px-3 text-sm font-bold" style={{
      background: muted ? 'hsl(var(--muted))' : 'hsl(var(--secondary))',
      color: muted ? 'hsl(var(--muted-foreground))' : 'hsl(var(--secondary-foreground))', width: 'auto',
    }}>{label}</button>
  );

  return (
    <GameShell icon={Grid2x2} title={t('tetrisTitle')}
      controls={
        <button onClick={reset} className="calc-btn px-3 py-1.5 text-xs"
          style={{ width: 'auto', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{t('newGame')}</button>
      }>
      <div className="panel p-3 mb-3 flex items-center justify-around">
        <div className="text-center"><div className="text-[10px] uppercase opacity-60">{t('score')}</div><div className="font-mono text-xl">{score}</div></div>
        <div className="text-center"><div className="text-[10px] uppercase opacity-60">{t('lines')}</div><div className="font-mono text-xl">{lines}</div></div>
        <div className="text-center"><div className="text-[10px] uppercase opacity-60">{t('level')}</div><div className="font-mono text-xl">{level}</div></div>
      </div>

      <div className="panel p-2 flex gap-3 justify-center items-start">
        <TetrisBoard board={board} piece={piece} />
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase opacity-60">{t('next')}</div>
          <div className="panel p-2"><PiecePreview piece={next} size={12} /></div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {btn('◀', () => move(-1, 0))}
        {btn('↻', rotatePiece)}
        {btn('▶', () => move(1, 0))}
        {btn('▼', softDrop)}
        {btn('⤓', hardDrop)}
        {btn(paused ? t('resume') : t('pause'), () => setPaused(p => !p), true)}
      </div>
      <div className="mt-3 panel px-4 py-3 text-center text-[11px] opacity-60">{t('tetrisHint')}</div>

      {over && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="panel p-6 text-center">
            <div className="font-mono text-2xl uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--destructive))' }}>{t('gameOver')}</div>
            <div className="font-mono mb-4">{t('score')}: {score}</div>
            <button onClick={reset} className="calc-btn px-4 py-2 text-sm font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 'auto' }}>{t('newGame')}</button>
          </div>
        </div>
      )}
      <Scoreboard gameKey="blocks" stats={[
        { key: 'score', labelKey: 'bestScore', fmt: v => v.toLocaleString() },
        { key: 'lines', labelKey: 'mostLines', fmt: v => v },
        { key: 'level', labelKey: 'highestLevel', fmt: v => v },
      ]} />
    </GameShell>
  );
}