import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Phone, MessageSquare, Trash2, IdCard, Search } from 'lucide-react';
import { appData } from '@/api/localClient';
import ContactTagsInput from '@/components/contacts/ContactTagsInput';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function Contacts() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myId, setMyId] = useState('');
  const [directory, setDirectory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [tagsInput, setTagsInput] = useState([]);
  const [notesInput, setNotesInput] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [editNotes, setEditNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const user = await appData.auth.me();
      const res = await appData.functions.invoke('listAppUsers', {});
      const users = res.data.users || [];
      setDirectory(users);

      const meEntry = users.find((u) => u.id === user.id || u.email === user.email || u.username === user.username) || users.find((u) => u.is_me) || user;
      const resolvedContactId = meEntry?.contact_id || user?.contact_id || '';
      setMyId(resolvedContactId);

      const myContacts = await appData.entities.Contact.filter({ created_by_id: user.id }, '-created_date', 200);
      setContacts(myContacts);
    } catch (error) {
      console.error('Contacts load failed:', error);
      const fallbackUser = await appData.auth.me().catch(() => null);
      setMyId(fallbackUser?.contact_id || '');
      setDirectory([]);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const normalizedInput = String(idInput || '').trim().toUpperCase();
    if (!normalizedInput) return;
    const match = directory.find((u) => String(u.contact_id || '').toUpperCase() === normalizedInput);
    if (!match) { setError(t('csErrorNoUser')); return; }
    if (match.is_me) { setError(t('csErrorOwnId')); return; }
    if (contacts.some((c) => c.contact_id === match.contact_id)) { setError(t('csErrorAlreadyContact')); return; }
    setAdding(true);
    try {
      const currentUser = await appData.auth.me();
      await appData.entities.Contact.create({
        contact_id: match.contact_id,
        email: match.email,
        display_name: nameInput.trim() || match.full_name || match.email,
        tags: tagsInput,
        notes: notesInput.trim(),
        created_by_id: currentUser.id,
      });
      setIdInput('');
      setNameInput('');
      setTagsInput([]);
      setNotesInput('');
      load();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (c) => {
    await appData.entities.Contact.delete(c.id);
    load();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditTags(c.tags || []);
    setEditNotes(c.notes || '');
  };

  const saveEdit = async (c) => {
    await appData.entities.Contact.update(c.id, { tags: editTags, notes: editNotes });
    setEditingId(null);
    load();
  };

  const q = search.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => {
    if (!q) return true;
    return (
      c.display_name?.toLowerCase().includes(q) ||
      c.contact_id?.includes(q) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6" style={{ color: 'hsl(340 75% 58%)' }} /> {t('csContactsTitle')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csContactsSubtitle')}</p>
      </div>

      <div className="panel p-4 mb-4 flex items-center gap-3">
        <IdCard className="w-5 h-5 shrink-0" style={{ color: 'hsl(217 91% 60%)' }} />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csYourId')}</span>
          <span className="text-lg font-mono font-bold tracking-widest">{loading ? '…' : myId}</span>
        </div>
      </div>

      <form onSubmit={handleAdd} className="panel p-4 mb-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csAddContact')}</span>
        <input value={idInput} onChange={(e) => setIdInput(e.target.value)} placeholder={t('csIdPlaceholder')} className="neu-input text-sm" />
        <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('csNamePlaceholder')} className="neu-input text-sm" />
        <ContactTagsInput tags={tagsInput} onChange={setTagsInput} />
        <textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder={t('csNotesPlaceholder')} rows={2} className="neu-input text-sm resize-none" />
        {error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
        <button type="submit" disabled={adding} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          <UserPlus className="w-4 h-4" /> {adding ? t('csAdding') : t('csAddContactBtn')}
        </button>
      </form>

      {!loading && contacts.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('csSearchContacts')}
            className="neu-input text-sm pl-9"
          />
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csLoading')}</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('csNoContactsYet')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContacts.map((c) => (
            <div key={c.id} className="rounded-xl px-4 py-3" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{c.display_name}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>ID: {c.contact_id}</p>
                  {!!(c.tags || []).length && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(340 75% 58% / 0.2)', color: 'hsl(340 75% 58%)' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {c.notes && editingId !== c.id && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => navigate(`/calls?to=${encodeURIComponent(c.email)}`)} title="Call" className="p-1.5 rounded-lg" style={{ color: 'hsl(38 92% 60%)' }}>
                    <Phone className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate(`/messages?to=${encodeURIComponent(c.email)}`)} title="Message" className="p-1.5 rounded-lg" style={{ color: 'hsl(280 65% 65%)' }}>
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => (editingId === c.id ? setEditingId(null) : startEdit(c))} title="Edit tags & notes" className="p-1.5 rounded-lg text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {editingId === c.id ? t('csCancel') : t('csEdit')}
                  </button>
                  <button onClick={() => handleDelete(c)} title={t('csDelete')} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--destructive))' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {editingId === c.id && (
                <div className="mt-3 space-y-2">
                  <ContactTagsInput tags={editTags} onChange={setEditTags} />
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder={t('csNotesPlaceholder')} rows={2} className="neu-input text-sm resize-none" />
                  <button onClick={() => saveEdit(c)} className="btn-primary text-sm py-2">{t('csSave')}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}