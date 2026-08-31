import { useState, useEffect } from 'react';
import { FileText, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appData } from "@/api/localClient";
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniNotesWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');

  const load = async () => setNotes(await appData.entities.Note.list('-created_date', 3));
  useEffect(() => { load(); }, []);

  const addNote = async () => {
    if (!title.trim()) return;
    await appData.entities.Note.create({ title: title.trim() });
    setTitle('');
    load();
  };

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> {t('navNotes')}
        </span>
        <button onClick={() => navigate('/notes')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-2 mb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
          placeholder={t('notesTitle')}
          className="neu-input flex-1 text-sm"
        />
        <button onClick={addNote} className="calc-btn w-9 flex items-center justify-center" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {notes.length > 0 && (
        <ul className="space-y-1">
          {notes.map((n) => (
            <li key={n.id} className="text-xs truncate px-2 py-1 rounded-lg text-foreground" style={{ background: 'hsl(var(--secondary) / 0.4)' }}>{n.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}