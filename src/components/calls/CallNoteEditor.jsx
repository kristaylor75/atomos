import { useState } from 'react';
import { StickyNote, Check } from 'lucide-react';

export default function CallNoteEditor({ call, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(call.notes || '');

  const save = async () => {
    await onSave(call, value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[10px] shrink-0"
        style={{ color: call.notes ? 'hsl(217 91% 60%)' : 'hsl(var(--muted-foreground))' }}
      >
        <StickyNote className="w-3 h-3" /> {call.notes ? 'Note' : 'Add note'}
      </button>
    );
  }

  return (
    <div className="w-full flex items-center gap-2 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="Call summary…"
        className="neu-input text-xs flex-1 py-1"
      />
      <button onClick={save} className="p-1.5 rounded-lg" style={{ color: 'hsl(142 71% 45%)' }}>
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}