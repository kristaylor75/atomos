import { useState, useEffect, useRef, useCallback } from 'react';
import { Waves } from 'lucide-react';
import StartOverlay from './StartOverlay';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { haptics } from '@/lib/haptics';
import GameShell from './GameShell';
import { submitStat } from '@/lib/gameScores';
import Scoreboard from './Scoreboard';
import { getSkin } from '@/lib/skins';

const SIZE = 15;

export default function SnakeGame() {
  const { t } = useLanguage();
  const [grid, setGrid] = useState(() => Array(SIZE * SIZE).fill(0));
  const [snake, setSnake] = useState([{ r: 7, c: 7 }]);
  const [dir, setDir] = useState({ r: 0, c: 1 });
  const [food, setFood] = useState({ r: 7, c: 11 });
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const dirRef = useRef(dir);
  const nextRef = useRef(dir);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const overRef = useRef(false);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { overRef.current = over; }, [over]);

  const placeFood = useCallback((body) => {
    const occupied = new Set(body.map(s => s.r * SIZE + s.c));
    let f;
    do { f = { r: Math.floor(Math.random() * SIZE), c: Math.floor(Math.random() * SIZE) }; }
    while (occupied.has(f.r * SIZE + f.c));
    return f;
  }, []);

  const reset = useCallback(() => {
    const s = [{ r: 7, c: 7 }];
    setSnake(s); snakeRef.current = s;
    setDir({ r: 0, c: 1 }); nextRef.current = { r: 0, c: 1 };
    setFood(placeFood(s)); foodRef.current = placeFood(s);
    setScore(0); scoreRef.current = 0; setOver(false); overRef.current = false;
    setRunning(true);
  }, [placeFood]);

  const turn = useCallback((dr, dc) => {
    const cur = dirRef.current;
    if (cur.r + dr === 0 && cur.c + dc === 0) return; // no reverse
    nextRef.current = { r: dr, c: dc };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') turn(-1, 0);
      else if (k === 'ArrowDown' || k === 's' || k === 'S') turn(1, 0);
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(0, -1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(0, 1);
      else if (k === ' ') { e.preventDefault(); if (!running || over) reset(); }
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn, reset, running, over]);

  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => {
      setDir(nextRef.current); dirRef.current = nextRef.current;
      const d = nextRef.current;
      const head = snakeRef.current[0];
      const nh = { r: head.r + d.r, c: head.c + d.c };
      if (nh.r < 0 || nh.r >= SIZE || nh.c < 0 || nh.c >= SIZE || snakeRef.current.some(s => s.r === nh.r && s.c === nh.c)) {
        setOver(true); overRef.current = true; setRunning(false); haptics.tap();
        submitStat('snake', 'score', scoreRef.current, 'high');
        return;
      }
      const ate = nh.r === foodRef.current.r && nh.c === foodRef.current.c;
      const newSnake = [nh, ...(ate ? snakeRef.current : snakeRef.current.slice(0, -1))];
      setSnake(newSnake); snakeRef.current = newSnake;
      if (ate) { setScore(s => { scoreRef.current = s + 1; return s + 1; }); haptics.click(); setFood(placeFood(newSnake)); foodRef.current = placeFood(newSnake); }
    }, 140);
    return () => clearInterval(id);
  }, [running, over, score, placeFood]);

  const draw = grid.map((_, i) => {
    const r = Math.floor(i / SIZE), c = i % SIZE;
    const isHead = snake[0].r === r && snake[0].c === c;
    const isBody = snake.some((s, idx) => idx && s.r === r && s.c === c);
    const isFood = food.r === r && food.c === c;
    return (
      <div key={i} style={{
        background: isHead ? 'hsl(var(--primary))' : isBody ? 'hsl(var(--primary) / 0.6)' : isFood ? (getSkin() === 'pip-boy' ? '#ffffff' : 'hsl(0 72% 58%)') : 'hsl(var(--background))',
        border: '1px solid hsl(var(--border) / 0.4)', borderRadius: 2,
      }} />
    );
  });

  const dpad = (dr, dc, label) => (
    <button onClick={() => turn(dr, dc)} className="calc-btn w-12 h-12 text-lg font-bold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>{label}</button>
  );

  return (
    <GameShell icon={Waves} title={t('snakeTitle')}
      controls={
        <button onClick={reset} className="calc-btn px-3 py-1.5 text-xs"
          style={{ width: 'auto', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{t('newGame')}</button>
      }>
      <div className="panel p-3 mb-3 flex items-center justify-center gap-6">
        <div className="text-center"><div className="text-[10px] uppercase opacity-60">{t('score')}</div><div className="font-mono text-xl">{score}</div></div>
      </div>
      <div className="panel p-2 flex justify-center relative">
        {!running && !over && <StartOverlay onStart={reset} label={t('play')} />}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, width: 'min(92vw, 360px)', aspectRatio: '1/1' }}>{draw}</div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div>{dpad(-1, 0, '▲')}</div>
        <div className="flex gap-1.5">{dpad(0, -1, '◀')}{dpad(0, 1, '▶')}</div>
        <div>{dpad(1, 0, '▼')}</div>
      </div>
      <div className="mt-3 panel px-4 py-3 text-center text-[11px] opacity-60">{t('snakeHint')}</div>
      {over && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="panel p-6 text-center">
            <div className="font-mono text-2xl uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--destructive))' }}>{t('gameOver')}</div>
            <div className="font-mono mb-4">{t('score')}: {score}</div>
            <button onClick={reset} className="calc-btn px-4 py-2 text-sm font-semibold" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 'auto' }}>{t('newGame')}</button>
          </div>
        </div>
      )}
      <Scoreboard gameKey="snake" stats={[{ key: 'score', labelKey: 'bestScore', fmt: v => v }]} />
    </GameShell>
  );
}