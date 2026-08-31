import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Send, ArrowLeft } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function GroupChat() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [convId, setConvId] = useState('');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async (id, user) => {
    const conv = await appData.entities.Conversation.get(id);
    if (!conv || !(conv.participant_emails || []).includes(user.email)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setConversation(conv);
    const msgs = await appData.entities.Communication.filter({ conversation_id: id }, 'created_date', 300);
    setMessages(msgs);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) { setNotFound(true); setLoading(false); return; }
      setConvId(id);
      const user = await appData.auth.me();
      setMe(user);
      await load(id, user);
    })();
  }, [load]);

  useEffect(() => {
    if (!convId || !me) return;
    const unsubscribe = appData.entities.Communication.subscribe(() => load(convId, me));
    return unsubscribe;
  }, [convId, me, load]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !me || !conversation) return;
    setSending(true);
    try {
      await appData.functions.invoke('logCommunication', {
        type: 'sms',
        sender: me.full_name,
        sender_email: me.email,
        conversation_id: conversation.id,
        content,
      });
      setContent('');
      load(convId, me);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 max-w-3xl mx-auto w-full">
        <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csLoading')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-5 max-w-3xl mx-auto w-full">
        <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csGroupChatNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-3xl mx-auto w-full flex flex-col" style={{ height: '100%' }}>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate('/messages')} className="p-1.5 rounded-lg shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2 truncate">
            <Users className="w-5 h-5 shrink-0" style={{ color: 'hsl(280 65% 65%)' }} /> {conversation.title || t('csGroupChatDefault')}
          </h1>
          <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{(conversation.participant_emails || []).join(', ')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csNoMessagesYet')}</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_email === me.email;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] rounded-xl px-3 py-2" style={{ background: mine ? 'hsl(280 65% 65% / 0.2)' : 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  {!mine && <p className="text-[10px] font-bold mb-0.5" style={{ color: 'hsl(280 65% 65%)' }}>{m.sender}</p>}
                  <p className="text-sm">{m.content}</p>
                  <p className="text-[9px] font-mono mt-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{new Date(m.timestamp || m.created_date).toLocaleString(lang)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('csMsgPlaceholder')} className="neu-input text-sm flex-1" />
        <button type="submit" disabled={sending} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50" style={{ background: 'hsl(var(--primary))', color: '#fff' }}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}