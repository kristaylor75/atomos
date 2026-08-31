import { useState, useEffect, useCallback, useRef } from 'react';
// import { appData } from "@/api/localClient";
import { addHistoryEntry } from '@/lib/history';
import { Plus, Search, Trash2, Save, FileText, X, CalendarDays, List } from 'lucide-react';
import InlineHistory from '@/components/InlineHistory';
import NotesCalendar from '@/components/notes/NotesCalendar';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function Notes() {
  const { t, lang } = useLanguage();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState('list');
  const autosaveTimer = useRef(null);
  const isFirstNoteRender = useRef(true);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await appData.entities.Note.list('-updated_date', 200);
      setNotes(data);
    } catch {
      setLoadError(t('notesLoadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const filtered = notes.filter(n => n.mode !== 'document' && !n.date).filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { isFirstNoteRender.current = true; setSelectedNote({ isNew: true }); setEditTitle(''); setEditContent(''); };
  const openNote = (note) => { isFirstNoteRender.current = true; setSelectedNote(note); setEditTitle(note.title || ''); setEditContent(note.content || ''); };
  const closeEditor = () => setSelectedNote(null);

  const saveNote = async () => {
    if (!editTitle.trim() && !editContent.trim()) return;
    setSaving(true);
    const title = editTitle.trim() || t('notesUntitled');
    if (selectedNote?.isNew) {
      const created = await appData.entities.Note.create({ title, content: editContent, mode: 'note' });
      addHistoryEntry({ tool: 'notes', input: title, result: editContent.slice(0, 80) || '(empty)' });
      setNotes(prev => [created, ...prev]);
      setSelectedNote(created);
    } else {
      const updated = await appData.entities.Note.update(selectedNote.id, { title, content: editContent });
      addHistoryEntry({ tool: 'notes', input: title, result: editContent.slice(0, 80) || '(empty)' });
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
    }
    setSaving(false);
  };

  // Autosave a moment after the user stops typing
  useEffect(() => {
    if (!selectedNote) return;
    if (isFirstNoteRender.current) { isFirstNoteRender.current = false; return; }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(saveNote, 1500);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editContent]);

  const deleteNote = async (id, e) => {
    e?.stopPropagation();
    await appData.entities.Note.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const cardStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.8)', boxShadow: '3px 3px 8px rgba(0,0,0,0.3), -1px -1px 3px rgba(255,255,255,0.03)' };

  return (
    <div className="p-5 max-w-5xl mx-auto w-full">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('notesTitle')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('notesSubtitle')}</p>
        </div>
        {!selectedNote && (
          <div className="tab-bar" style={{ width: 'fit-content' }}>
            <button onClick={() => setView('list')} className={`tab-item px-4 py-2 text-xs font-semibold flex items-center gap-1.5 ${view === 'list' ? 'active' : ''}`}>
              <List className="w-3.5 h-3.5" /> {t('notesViewNotes')}
            </button>
            <button onClick={() => setView('calendar')} className={`tab-item px-4 py-2 text-xs font-semibold flex items-center gap-1.5 ${view === 'calendar' ? 'active' : ''}`}>
              <CalendarDays className="w-3.5 h-3.5" /> {t('notesViewCalendar')}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          {view === 'calendar' && !selectedNote ? (
            <NotesCalendar notes={notes} onChange={loadNotes} />
          ) : selectedNote ? (
            <div className="panel p-5 space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={closeEditor} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                  <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder={t('noteTitlePlaceholder')} className="flex-1 bg-transparent text-xl font-semibold text-foreground outline-none border-b border-transparent focus:border-primary transition-colors pb-1" />
                <button onClick={saveNote} disabled={saving} className="btn-primary w-auto px-4 py-2 text-sm flex items-center gap-2" style={{ width: 'auto' }}>
                  <Save className="w-3.5 h-3.5" /> {saving ? t('noteSaving') : t('noteSave')}
                </button>
              </div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder={t('noteContentPlaceholder')} rows={18} className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none font-body" style={{ minHeight: '300px' }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('notesSearch')} className="neu-input pl-9" />
                </div>
                <button onClick={openNew} className="btn-primary w-auto px-4 flex items-center gap-2 text-sm" style={{ width: 'auto' }}>
                  <Plus className="w-4 h-4" /> {t('notesNew')}
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : loadError ? (
                <div className="panel p-10 text-center">
                  <p className="text-sm mb-3" style={{ color: 'hsl(var(--destructive))' }}>{loadError}</p>
                  <button onClick={loadNotes} className="btn-primary w-auto px-4 py-2 text-sm" style={{ width: 'auto' }}>{t('notesRetry')}</button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="panel p-10 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{search ? t('notesEmptySearch') : t('notesEmpty')}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {filtered.map(note => (
                    <div key={note.id} onClick={() => openNote(note)} className="rounded-2xl p-4 cursor-pointer transition-all group relative" style={cardStyle}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.8)'}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">{note.title || t('notesUntitled')}</h3>
                        <button onClick={e => deleteNote(note.id, e)} className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs mt-1.5 line-clamp-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{note.content || t('notesNoContent')}</p>
                      <p className="text-[10px] mt-2" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>{note.updated_date ? new Date(note.updated_date).toLocaleDateString(lang) : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="lg:w-64 shrink-0">
          <InlineHistory tool="notes" />
        </div>
      </div>
    </div>
  );
}