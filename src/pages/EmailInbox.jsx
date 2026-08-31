import { useState, useEffect, useCallback } from 'react';
import { Mail, Inbox, Send, Reply, Save } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { cn } from '@/lib/utils';
import StarButton from '@/components/communications/StarButton';
import CategorySelect from '@/components/communications/CategorySelect';
import EmailSearchFilters from '@/components/email/EmailSearchFilters';
import DraftsList from '@/components/email/DraftsList';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function EmailInbox() {
  const { t, lang } = useLanguage();
  const FILTERS = [
    { value: 'all', label: t('csFilterAll') },
    { value: 'work', label: t('csFilterWork') },
    { value: 'personal', label: t('csFilterPersonal') },
    { value: 'archived', label: t('csFilterArchived') },
  ];
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ sender: '', content: '' });
  const [draftId, setDraftId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [filter, setFilter] = useState('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async (user) => {
    const [all, myDrafts] = await Promise.all([
      appData.entities.Communication.filter({ type: 'email' }, '-created_date', 100),
      appData.entities.Draft.filter({ created_by_id: user.id }, '-updated_date', 50),
    ]);
    setItems(all);
    setDrafts(myDrafts);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await appData.auth.me();
      setMe(user);
      await load(user);
    })();
  }, [load]);

  const markRead = async (c) => {
    await appData.entities.Communication.update(c.id, { status: 'read' });
    load(me);
  };

  const handleDelete = async (c) => {
    await appData.entities.Communication.delete(c.id);
    load(me);
  };

  const toggleStar = async (c) => {
    await appData.entities.Communication.update(c.id, { starred: !c.starred });
    load(me);
  };

  const changeCategory = async (c, category) => {
    await appData.entities.Communication.update(c.id, { category: category || null });
    load(me);
  };

  const handleReply = (c) => {
    setForm({ sender: c.sender, content: `Re: ${c.content}\n\n` });
    setDraftId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLog = async (e) => {
    e.preventDefault();
    if (!form.sender.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await appData.functions.invoke('logCommunication', { type: 'email', sender: form.sender, content: form.content });
      if (draftId) await appData.entities.Draft.delete(draftId);
      setForm({ sender: '', content: '' });
      setDraftId(null);
      load(me);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.sender.trim() && !form.content.trim()) return;
    setSavingDraft(true);
    try {
      if (draftId) {
        await appData.entities.Draft.update(draftId, { sender: form.sender, content: form.content });
      } else {
        const created = await appData.entities.Draft.create({ sender: form.sender, content: form.content });
        setDraftId(created.id);
      }
      load(me);
    } finally {
      setSavingDraft(false);
    }
  };

  const editDraft = (d) => {
    setForm({ sender: d.sender || '', content: d.content || '' });
    setDraftId(d.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDraft = async (d) => {
    await appData.entities.Draft.delete(d.id);
    if (draftId === d.id) setDraftId(null);
    load(me);
  };

  const senders = [...new Set(items.map((c) => c.sender).filter(Boolean))];

  const filtered = items.filter((c) => {
    if (filter !== 'all' && c.category !== filter) return false;
    if (starredOnly && !c.starred) return false;
    if (search.trim() && !c.content?.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (senderFilter && c.sender !== senderFilter) return false;
    const ts = new Date(c.timestamp || c.created_date);
    if (dateFrom && ts < new Date(dateFrom)) return false;
    if (dateTo && ts > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  });

  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-6 h-6" style={{ color: 'hsl(217 91% 60%)' }} /> {t('csEmailTitle')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csEmailSubtitle')}</p>
      </div>

      <form onSubmit={handleLog} className="panel p-4 mb-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {draftId ? t('csEmailEditingDraft') : t('csEmailLogEmail')}
        </span>
        <input
          value={form.sender}
          onChange={e => setForm(f => ({ ...f, sender: e.target.value }))}
          placeholder={t('csEmailFromPlaceholder')}
          className="neu-input text-sm"
        />
        <textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder={t('csEmailContentPlaceholder')}
          rows={3}
          className="neu-input text-sm resize-none"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {submitting ? t('csEmailLogging') : t('csEmailLogEmail')}
          </button>
          <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="px-4 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
            <Save className="w-4 h-4" /> {savingDraft ? t('csEmailSaving') : t('csEmailSaveDraft')}
          </button>
        </div>
      </form>

      <DraftsList drafts={drafts} onEdit={editDraft} onDelete={deleteDraft} />

      <EmailSearchFilters
        search={search} onSearchChange={setSearch}
        sender={senderFilter} onSenderChange={setSenderFilter} senders={senders}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="tab-bar flex-1">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={cn('tab-item', filter === f.value && 'active')}>{f.label}</button>
          ))}
        </div>
        <StarButton starred={starredOnly} onClick={() => setStarredOnly((s) => !s)} title={t('csEmailStarredOnly')} />
      </div>

      {loading ? (
        <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csLoading')}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('csEmailNoMatch')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const unread = c.status !== 'read';
            return (
              <div key={c.id} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'hsl(var(--card))', border: unread ? '1px solid hsl(217 91% 60%)' : '1px solid hsl(var(--border))' }}>
                <Mail className="w-4 h-4 mt-1 shrink-0" style={{ color: 'hsl(217 91% 60%)' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate">{c.sender}</span>
                    {unread && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(217 91% 60%)', color: '#fff' }}>{t('csNew')}</span>}
                  </div>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.content}</p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{new Date(c.timestamp || c.created_date).toLocaleString(lang)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CategorySelect value={c.category} onChange={(v) => changeCategory(c, v)} />
                  <StarButton starred={c.starred} onClick={() => toggleStar(c)} />
                  <button onClick={() => handleReply(c)} title={t('csReply')} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Reply className="w-4 h-4" />
                  </button>
                  {unread && (
                    <button onClick={() => markRead(c)} title={t('csMarkRead')} className="p-1.5 rounded-lg text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {t('csRead')}
                    </button>
                  )}
                  <button onClick={() => handleDelete(c)} title={t('csDelete')} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--destructive))' }}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}