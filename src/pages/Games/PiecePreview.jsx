import { pieceColor } from './tetrisDefs';

// Centered preview box for the "Next" piece in Tetris.
export default function PiecePreview({ piece, size = 12 }) {
  if (!piece) return null;
  const mat = piece.mat;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${mat[0].length}, ${size}px)` }}>
      {mat.flat().map((v, i) => (
        <div key={i} style={{
          width: size, height: size,
          background: v ? pieceColor(piece.key) : 'transparent',
          border: v ? '1px solid rgba(255,255,255,0.15)' : 'none',
          borderRadius: 2,
        }} />
      ))}
    </div>
  );
}