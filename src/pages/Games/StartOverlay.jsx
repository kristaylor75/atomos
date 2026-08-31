import { Play } from 'lucide-react';

// Centered "Press Play" gate shown over a game viewport before the first run.
// Clicking anywhere on the overlay calls onStart.
export default function StartOverlay({ onStart, label = 'PLAY' }) {
  return (
    <div
      onClick={onStart}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer select-none z-10"
      style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 'inherit' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'hsl(var(--primary))',
          boxShadow: '0 0 24px hsl(var(--primary) / 0.5), 3px 3px 12px rgba(0,0,0,0.7)',
        }}
      >
        <Play style={{ width: 30, height: 30, color: '#fff', marginLeft: 4 }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#fff' }}>{label}</span>
    </div>
  );
}