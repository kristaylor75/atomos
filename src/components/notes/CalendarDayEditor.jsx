import { useState, useEffect } from 'react';
import { Save, Trash2, X } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function CalendarDayEditor({ date, note, onClose, onSaved, onDeleted }) {
  const { t, lang } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note, date]);

  // Locale-aware date string for the selected day (Intl covers every language
  // without needing per-language date-fns locale imports).
  const dateLabel = new Intl.DateTimeFormat(lang, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    const dateKey = date.toISOString().slice(0, 10);
    const fallbackTitle = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    const payload = { title: title.trim() || fallbackTitle, content, date: dateKey };
    if (note) {
      await appData.entities.Note.update(note.id, payload);
    } else {
      await appData.entities.Note.create(payload);
    }
    setSaving(false);
    onSaved?.();
  };

  const handleDelete = async () => {
    if (!note) return;
    await appData.entities.Note.delete(note.id);
    onDeleted?.();
  };

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{dateLabel}</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
          <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('noteCalTitlePlaceholder')} className="neu-input text-sm" />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t('noteCalContentPlaceholder')} rows={5} className="neu-input text-sm resize-none" />
      <div className="flex items-center justify-between">
        {note ? (
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)', background: 'hsl(var(--destructive) / 0.06)' }}>
            <Trash2 className="w-3.5 h-3.5" /> {t('noteDelete')}
          </button>
        ) : <span />}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-4 py-2 text-sm flex items-center gap-2" style={{ width: 'auto' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? t('noteSaving') : t('noteSave')}
        </button>
      </div>
    </div>
  );
}