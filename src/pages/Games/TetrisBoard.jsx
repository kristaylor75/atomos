import { pieceColor, COLS, ROWS } from './tetrisDefs';

// Renders the playfield with the active piece overlaid. Pure presentational.
export default function TetrisBoard({ board, piece }) {
  const overlay = board.map(r => r.slice());
  if (piece) {
    for (let i = 0; i < piece.mat.length; i++) for (let j = 0; j < piece.mat[0].length; j++) {
      if (piece.mat[i][j] && piece.r + i >= 0 && piece.r + i < ROWS && piece.c + j >= 0 && piece.c + j < COLS) {
        overlay[piece.r + i][piece.c + j] = piece.key;
      }
    }
  }
  const size = Math.max(12, Math.floor(Math.min(72 * (window?.visualViewport?.width || 360) / 100, 180) / COLS));
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${size}px)`, gridTemplateRows: `repeat(${ROWS}, ${size}px)` }}>
      {overlay.flat().map((v, i) => (
        <div key={i} style={{
          background: v ? pieceColor(v) : 'hsl(var(--background))',
          border: '1px solid hsl(var(--border) / 0.25)',
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}