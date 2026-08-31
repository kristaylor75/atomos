import { Star } from 'lucide-react';

export default function StarButton({ starred, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title || (starred ? 'Unstar' : 'Star')}
      className="p-1.5 rounded-lg shrink-0"
      style={{ color: starred ? 'hsl(38 92% 60%)' : 'hsl(var(--muted-foreground))' }}
    >
      <Star className="w-4 h-4" fill={starred ? 'currentColor' : 'none'} />
    </button>
  );
}