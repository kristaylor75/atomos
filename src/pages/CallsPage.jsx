import { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneOff, History, CalendarClock, X } from 'lucide-react';
// import { appData } from "@/api/localClient";
import { toast } from '@/components/ui/use-toast';
import CallNoteEditor from '@/components/calls/CallNoteEditor';
import ScheduleCallForm from '@/components/calls/ScheduleCallForm';
import { useLanguage } from '@/lib/LanguageContext.jsx';

function formatDuration(sec) {
  const total = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(total / 60), s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CallsPage() {
  const { t, lang } = useLanguage();
  const [me, setMe] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactEmail, setContactEmail] = useState('');
  const [idInput, setIdInput] = useState('');
  const [error, setError] = useState('');
  const [calling, setCalling] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const load = useCallback(async (user) => {
    const all = await appData.entities.Communication.filter({ type: 'call' }, '-created_date', 100);
    const mine = all.filter(c => c.recipient_email === user.email || c.sender_email === user.email);
    setIncoming(mine.filter(c => c.recipient_email === user.email && c.status !== 'read' && (c.call_status || 'ringing') === 'ringing'));
    setHistory(mine.filter(c => c.call_status !== 'scheduled'));
    setUpcoming(mine.filter(c => c.call_status === 'scheduled').sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
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
    const unsubscribe = appData.entities.Communication.subscribe((event) => {
      if (event.type === 'create' && event.data.type === 'call' && event.data.recipient_email === me.email && event.data.call_status !== 'scheduled') {
        toast({ title: `Incoming call from ${event.data.sender}`, description: 'Answer or decline below.' });
      }
      load(me);
    });
    return unsubscribe;
  }, [me, load]);

  const activeCall = history.find(c => c.call_status === 'active' && (c.sender_email === me?.email || c.recipient_email === me?.email));

  useEffect(() => {
    if (!activeCall && upcoming.length === 0) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeCall?.id, upcoming.length]);

  const resolveTarget = () => {
    if (idInput.trim()) {
      const match = directory.find((u) => u.contact_id === idInput.trim());
      if (!match) return { error: t('csErrorNoUser') };
      return { target: match.email };
    }
    if (contactEmail) return { target: contactEmail };
    return { error: t('csErrorEnterIdOrContact') };
  };

  const placeCall = async (e) => {
    e.preventDefault();
    setError('');
    const { target, error: err } = resolveTarget();
    if (err) { setError(err); return; }

    setCalling(true);
    try {
      await appData.functions.invoke('logCommunication', {
        type: 'call',
        sender: me.full_name,
        sender_email: me.email,
        recipient_email: target,
        content: 'Incoming call',
      });
      setIdInput('');
      load(me);
    } finally {
      setCalling(false);
    }
  };

  const answerCall = async (c) => {
    await appData.entities.Communication.update(c.id, { status: 'read', call_status: 'active', call_started_at: new Date().toISOString() });
    load(me);
  };

  const declineCall = async (c) => {
    await appData.entities.Communication.update(c.id, { status: 'read', call_status: 'declined' });
    load(me);
  };

  const hangUp = async (c) => {
    const duration = Math.round((Date.now() - new Date(c.call_started_at).getTime()) / 1000);
    await appData.entities.Communication.update(c.id, { call_status: 'completed', duration_seconds: duration });
    load(me);
  };

  const saveNote = async (c, notes) => {
    await appData.entities.Communication.update(c.id, { notes });
    load(me);
  };

  const handleSchedule = async ({ contactEmail: ce, idInput: ii, scheduledAt }) => {
    let target = '';
    if (ii.trim()) {
      const match = directory.find((u) => u.contact_id === ii.trim());
      if (!match) return { error: t('csErrorNoUser') };
      target = match.email;
    } else if (ce) {
      target = ce;
    } else {
      return { error: t('csErrorEnterIdOrContact') };
    }
    await appData.entities.Communication.create({
      type: 'call',
      sender: me.full_name,
      sender_email: me.email,
      recipient_email: target,
      content: 'Scheduled call reminder',
      call_status: 'scheduled',
      scheduled_at: new Date(scheduledAt).toISOString(),
    });
    load(me);
    return {};
  };

  const startScheduledCall = async (c) => {
    await appData.functions.invoke('logCommunication', {
      type: 'call',
      sender: me.full_name,
      sender_email: me.email,
      recipient_email: c.recipient_email,
      content: 'Incoming call',
    });
    await appData.entities.Communication.delete(c.id);
    load(me);
  };

  const cancelScheduled = async (c) => {
    await appData.entities.Communication.delete(c.id);
    load(me);
  };

  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Phone className="w-6 h-6" style={{ color: 'hsl(38 92% 60%)' }} /> {t('csCallTitle')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csCallSubtitle')}</p>
      </div>

      <form onSubmit={placeCall} className="panel p-4 mb-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csPlaceCall')}</span>
        <select value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setIdInput(''); }} className="neu-input text-sm">
          <option value="">{t('csSelectContact')}</option>
          {contacts.map((c) => <option key={c.id} value={c.email}>{c.display_name}</option>)}
        </select>
        <input value={idInput} onChange={(e) => { setIdInput(e.target.value); setContactEmail(''); }} placeholder={t('csOrEnterId')} className="neu-input text-sm" />
        {error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
        <button type="submit" disabled={calling} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
          <PhoneCall className="w-4 h-4" /> {calling ? t('csCalling') : t('csCallBtn')}
        </button>
      </form>

      <ScheduleCallForm contacts={contacts} onSubmit={handleSchedule} />

      {upcoming.length > 0 && (
        <div className="panel p-4 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <CalendarClock className="w-3.5 h-3.5" /> {t('csUpcomingCalls')}
          </span>
          <div className="space-y-2">
            {upcoming.map((c) => {
              const due = new Date(c.scheduled_at) <= new Date();
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: due ? 'hsl(var(--destructive) / 0.12)' : 'hsl(var(--card))', border: due ? '1px solid hsl(var(--destructive) / 0.4)' : '1px solid hsl(var(--border))' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.recipient_email}</p>
                    <p className="text-[10px] font-mono" style={{ color: due ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>
                      {due ? t('csDueNow') : new Date(c.scheduled_at).toLocaleString(lang)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startScheduledCall(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'hsl(142 71% 45%)', color: '#fff' }}>{t('csStartCall')}</button>
                    <button onClick={() => cancelScheduled(c)} title="Cancel" className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeCall && (
        <div className="panel p-4 mb-4" style={{ border: '1px solid hsl(142 71% 45%)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <PhoneCall className="w-4 h-4 shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {activeCall.sender_email === me.email ? activeCall.recipient_email : activeCall.sender}
                </p>
                <p className="text-xs font-mono" style={{ color: 'hsl(142 71% 55%)' }}>
                  {formatDuration((Date.now() - new Date(activeCall.call_started_at).getTime()) / 1000)}
                </p>
              </div>
            </div>
            <button onClick={() => hangUp(activeCall)} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0" style={{ background: 'hsl(var(--destructive))', color: '#fff' }}>
              <PhoneOff className="w-3.5 h-3.5" /> {t('csHangUp')}
            </button>
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <div className="panel p-4 mb-4" style={{ border: '1px solid hsl(38 92% 60%)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: 'hsl(38 92% 60%)' }}>{t('csIncomingCalls')}</span>
          <div className="space-y-2">
            {incoming.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: 'hsl(var(--card))' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <PhoneIncoming className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 92% 60%)' }} />
                  <span className="text-sm font-semibold truncate">{c.sender}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => answerCall(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'hsl(142 71% 45%)', color: '#fff' }}>{t('csAnswer')}</button>
                  <button onClick={() => declineCall(c)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'hsl(var(--destructive))', color: '#fff' }}>{t('csDecline')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel p-4">
        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <History className="w-3.5 h-3.5" /> {t('csCallHistory')}
        </span>
        {loading ? (
          <p className="text-center text-sm py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csLoading')}</p>
        ) : history.length === 0 ? (
          <p className="text-center text-sm py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('csNoCallsYet')}</p>
        ) : (
          <div className="space-y-1.5">
            {history.map(c => {
              const outgoing = c.sender_email === me.email;
              const missedOrDeclined = c.call_status === 'declined';
              let statusLabel;
              if (c.call_status === 'completed') statusLabel = formatDuration(c.duration_seconds);
              else if (missedOrDeclined) statusLabel = outgoing ? t('csDeclined') : t('csMissed');
              else if (c.call_status === 'active') statusLabel = t('csInProgress');
              else statusLabel = outgoing ? t('csCallingStatus') : t('csRinging');
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: missedOrDeclined ? 'hsl(var(--destructive) / 0.12)' : 'hsl(var(--muted) / 0.4)', border: missedOrDeclined ? '1px solid hsl(var(--destructive) / 0.4)' : '1px solid transparent' }}>
                  {outgoing ? <PhoneOutgoing className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(217 91% 60%)' }} /> : <PhoneIncoming className="w-3.5 h-3.5 shrink-0" style={{ color: missedOrDeclined ? 'hsl(var(--destructive))' : 'hsl(38 92% 60%)' }} />}
                  <span className="text-xs font-semibold truncate flex-1">{outgoing ? c.recipient_email : c.sender}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: missedOrDeclined ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))', background: 'hsl(var(--card))' }}>{statusLabel}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(c.timestamp || c.created_date).toLocaleString(lang)}</span>
                  <CallNoteEditor call={c} onSave={saveNote} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}