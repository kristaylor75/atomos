import { useState, useEffect, useCallback, useRef } from 'react';
import { Bomb } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import GameShell from './GameShell';
import { submitStat, getStats } from '@/lib/gameScores';
import Scoreboard from './Scoreboard';

const PRESETS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 25 },
  hard: { rows: 14, cols: 14, mines: 45 },
};
const NUM_COLORS = ['', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#fb923c', '#f43f5e'];

function makeBoard(rows, cols, mines, safeR, safeC) {
  const cells = Array.from({ length: rows * cols }, () => ({ mine: false, adj: 0, revealed: false, flagged: false }));
  // place mines avoiding the first-tapped 3x3 so the first click is always safe
  let placed = 0;
  while (placed < mines) {
    const i = Math.floor(Math.random() * rows * cols);
    const r = Math.floor(i / cols), c = i % cols;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    if (cells[i].mine) continue;
    cells[i].mine = true; placed++;
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (cells[r * cols + c].mine) continue;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && cells[rr * cols + cc].mine) n++;
    }
    cells[r * cols + c].adj = n;
  }
  return cells;
}

export default function MinesweeperGame() {
  const { t } = useLanguage();
  const [diff, setDiff] = useState('easy');
  const cfg = PRESETS[diff];
  const [cells, setCells] = useState(null);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState('');
  const [flags, setFlags] = useState(0);
  const [time, setTime] = useState(0);
  const pressTimer = useRef(null);
  const [scoreKey, setScoreKey] = useState(0);
  const timeRef = useRef(0);
  const winsRef = useRef(getStats('minefield').wins || 0);

  useEffect(() => {
    if (!started || over) return;
    const id = setInterval(() => setTime(s => { timeRef.current = s + 1; return s + 1; }), 1000);
    return () => clearInterval(id);
  }, [started, over]);

  const reset = useCallback((d = diff) => {
    setCells(null); setStarted(false); setOver(''); setFlags(0); setTime(0); timeRef.current = 0; setDiff(d); setScoreKey(k => k + 1);
  }, [diff]);

  const reveal = (r, c) => {
    if (over) return;
    let board = cells;
    if (!board) board = makeBoard(cfg.rows, cfg.cols, cfg.mines, r, c);
    const cell = board[r * cfg.cols + c];
    if (cell.revealed || cell.flagged) return;
    if (!started) setStarted(true);
    const nb = board.slice().map(x => ({ ...x }));
    const flood = (rr, cc) => {
      const idx = rr * cfg.cols + cc;
      const cl = nb[idx];
      if (!cl || cl.revealed || cl.flagged || cl.mine) return;
      cl.revealed = true;
      if (cl.adj === 0) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = rr + dr, nc = cc + dc;
          if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) flood(nr, nc);
        }
      }
    };
    if (cell.mine) {
      nb.forEach(x => { if (x.mine) x.revealed = true; });
      setOver('boom'); setCells(nb); return;
    }
    flood(r, c);
    setCells(nb);
    const safe = nb.filter(x => !x.mine && x.revealed).length;
    if (safe === cfg.rows * cfg.cols - cfg.mines) {
      setOver('cleared');
      submitStat('minefield', 'time_' + diff, timeRef.current, 'low');
      winsRef.current += 1; submitStat('minefield', 'wins', winsRef.current, 'high');
    }
  };

  const toggleFlag = (r, c) => {
    if (over || !cells) return;
    const nb = cells.slice().map(x => ({ ...x }));
    const cl = nb[r * cfg.cols + c];
    if (cl.revealed) return;
    cl.flagged = !cl.flagged;
    setCells(nb);
    setFlags(nb.filter(x => x.flagged).length);
  };

  const onDown = (r, c) => {
    pressTimer.current = setTimeout(() => toggleFlag(r, c), 400);
  };
  const onUp = (r, c) => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; reveal(r, c); }
  };
  const onLeave = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const onContext = (e, r, c) => { e.preventDefault(); toggleFlag(r, c); };

  const cellSize = Math.min(40, Math.floor(320 / cfg.cols));

  return (
    <GameShell icon={Bomb} title={t('minesTitle')}
      controls={
        <button onClick={() => reset()} className="calc-btn px-3 py-1.5 text-xs"
          style={{ width: 'auto', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{t('newGame')}</button>
      }>
      <div className="panel p-3 mb-3 flex flex-wrap items-center gap-1.5">
        {['easy', 'medium', 'hard'].map(d => (
          <button key={d} onClick={() => reset(d)} className="calc-btn px-2 py-1 text-[11px]" style={{
            width: 'auto',
            background: diff === d ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
            color: diff === d ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
          }}>{t(d)}</button>
        ))}
        <span className="font-mono text-xs opacity-70 ml-auto">💣 {cfg.mines - flags}</span>
        <span className="font-mono text-xs opacity-70 ml-2">⏱ {time}s</span>
      </div>

      <div className="panel p-2 flex justify-center">
        <div className="grid" key={scoreKey + diff} style={{ gridTemplateColumns: `repeat(${cfg.cols}, ${cellSize}px)` }}>
          {Array.from({ length: cfg.rows * cfg.cols }, (_, i) => {
            const r = Math.floor(i / cfg.cols), c = i % cfg.cols;
            const cl = cells ? cells[i] : null;
            return (
              <div key={i}
                onMouseDown={() => onDown(r, c)} onMouseUp={() => onUp(r, c)} onMouseLeave={onLeave}
                onContextMenu={(e) => onContext(e, r, c)}
                className="flex items-center justify-center font-mono font-bold select-none"
                style={{
                  width: cellSize, height: cellSize, fontSize: cellSize * 0.55,
                  background: !cl || !cl.revealed ? 'hsl(var(--muted))' : cl.mine ? 'hsl(0 72% 35%)' : 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: cl && cl.revealed && !cl.mine ? NUM_COLORS[cl.adj] : '#fff',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}>
                {cl && cl.flagged && !cl.revealed && '🚩'}
                {cl && cl.revealed && cl.mine && '💥'}
                {cl && cl.revealed && !cl.mine && cl.adj > 0 && cl.adj}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 panel px-4 py-3 text-center">
        {over === 'boom' && <span className="font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--destructive))' }}>{t('boom')}</span>}
        {over === 'cleared' && <span className="font-mono uppercase tracking-widest" style={{ color: 'hsl(120 60% 50%)' }}>{t('cleared')}</span>}
        {!over && <span className="text-[11px] opacity-60">{t('revealHint')}</span>}
      </div>
      <Scoreboard gameKey="minefield" stats={[
        { key: 'time_easy', labelKey: 'easy', fmt: v => v + 's' },
        { key: 'time_medium', labelKey: 'medium', fmt: v => v + 's' },
        { key: 'time_hard', labelKey: 'hard', fmt: v => v + 's' },
        { key: 'wins', labelKey: 'gamesWon', fmt: v => v },
      ]} />
    </GameShell>
  );
}