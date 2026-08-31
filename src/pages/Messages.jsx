import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { cn } from '@/lib/utils';
import GroupsTab from '@/components/messages/GroupsTab';
import VoiceInputButton from '@/components/VoiceInputButton.jsx';
import QuickReplies from '@/components/messages/QuickReplies';
import MessageThreadList from '@/components/messages/MessageThreadList';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function Messages() {
  const { t } = useLanguage();
  const [me, setMe] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tab, setTab] = useState('threads');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [idInput, setIdInput] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (user) => {
    const [inbox, outbox] = await Promise.all([
      appData.entities.Communication.filter({ type: 'sms', recipient_email: user.email }, '-created_date', 100),
      appData.entities.Communication.filter({ type: 'sms', created_by_id: user.id }, '-created_date', 100),
    ]);
    setReceived(inbox);
    setSent(outbox);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const to = urlParams.get('to');
      if (to) setContactEmail(to);

      const user = await appData.auth.me();
      setMe(user);
      const res = await appData.functions.invoke('listAppUsers', {});
      setDirectory(res.data.users || []);
      const myContacts = await appData.entities.Contact.filter({ created_by_id: user.id }, '-created_date', 200);
      setContacts(myContacts);
      await load(user);
    })();
  }, [load]);

  useEffect(() => {
    if (!me) return;
    const unsubscribe = appData.entities.Communication.subscribe(() => load(me));
    return unsubscribe;
  }, [me, load]);

  const toggleRead = async (c) => {
    await appData.entities.Communication.update(c.id, { status: c.status === 'read' ? 'unread' : 'read' });
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

  const handleReply = (msg) => {
    const counterpart = (msg.sender_email && msg.sender_email !== me.email) ? msg.sender_email : msg.recipient_email;
    setContactEmail(counterpart);
    setIdInput('');
    setContent(`Re: ${msg.content}\n\n`);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) return;

    let targetEmail = '';
    if (idInput.trim()) {
      const match = directory.find((u) => u.contact_id === idInput.trim());
      if (!match) { setError(t('csErrorNoUser')); return; }
      targetEmail = match.email;
    } else if (contactEmail) {
      targetEmail = contactEmail;
    } else {
      setError(t('csErrorEnterIdOrContact'));
      return;
    }

    setSending(true);
    try {
      await appData.functions.invoke('logCommunication', {
        type: 'sms',
        sender: me.full_name,
        sender_email: me.email,
        recipient_email: targetEmail,
        content,
      });
      setContent('');
      setIdInput('');
      load(me);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6" style={{ color: 'hsl(280 65% 65%)' }} /> {t('csMsgTitle')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csMsgSubtitle')}</p>
      </div>

      <form onSubmit={handleSend} className="panel p-4 mb-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csMsgNew')}</span>
        <select value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setIdInput(''); }} className="neu-input text-sm">
          <option value="">{t('csSelectContact')}</option>
          {me && <option value={me.email}>{t('csMeNotes')}</option>}
          {contacts.map((c) => <option key={c.id} value={c.email}>{c.display_name}</option>)}
        </select>
        <input value={idInput} onChange={(e) => { setIdInput(e.target.value); setContactEmail(''); }} placeholder={t('csOrEnterId')} className="neu-input text-sm" />
        <div className="relative">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('csMsgPlaceholder')} rows={2} className="neu-input text-sm resize-none pr-9" />
          <div className="absolute top-2 right-2">
            <VoiceInputButton onResult={(t) => setContent((prev) => (prev ? `${prev} ${t}` : t))} title="Speak your message" />
          </div>
        </div>
        <QuickReplies onSelect={(text) => setContent((prev) => (prev ? `${prev} ${text}` : text))} />
        {error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
        <button type="submit" disabled={sending} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? t('csSending') : t('csSend')}
        </button>
      </form>

      <div className="tab-bar mb-4">
        <button onClick={() => setTab('threads')} className={cn('tab-item', tab === 'threads' && 'active')}>{t('csTabThreads')}</button>
        <button onClick={() => setTab('groups')} className={cn('tab-item', tab === 'groups' && 'active')}>{t('csTabGroups')}</button>
      </div>

      {tab === 'groups' ? (
        <GroupsTab me={me} contacts={contacts} />
      ) : loading ? (
        <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csLoading')}</p>
      ) : (
        <MessageThreadList
          me={me}
          received={received}
          sent={sent}
          contacts={contacts}
          onToggleRead={toggleRead}
          onDelete={handleDelete}
          onToggleStar={toggleStar}
          onCategoryChange={changeCategory}
          onReply={handleReply}
        />
      )}
    </div>
  );
}