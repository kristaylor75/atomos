import { FileEdit, Trash2 } from 'lucide-react';

export default function DraftsList({ drafts, onEdit, onDelete }) {
  if (drafts.length === 0) return null;
  return (
    <div className="panel p-3 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <FileEdit className="w-3.5 h-3.5" /> Drafts ({drafts.length})
      </span>
      <div className="space-y-1.5">
        {drafts.map((d) => (
          <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{d.sender || '(no sender)'}</p>
              <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{d.content}</p>
            </div>
            <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg shrink-0" style={{ color: 'hsl(217 91% 60%)' }} title="Continue editing">
              <FileEdit className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(d)} className="p-1.5 rounded-lg shrink-0" style={{ color: 'hsl(var(--destructive))' }} title="Delete draft">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}