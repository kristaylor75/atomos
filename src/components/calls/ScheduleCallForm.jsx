import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function ScheduleCallForm({ contacts, onSubmit }) {
  const { t, lang } = useLanguage();
  const [contactEmail, setContactEmail] = useState('');
  const [idInput, setIdInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!scheduledAt) { setError(t('csSchedulePickDate')); return; }
    setSaving(true);
    const result = await onSubmit({ contactEmail, idInput, scheduledAt });
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setContactEmail('');
    setIdInput('');
    setScheduledAt('');
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-4 mb-4 space-y-3">
      <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
        <CalendarClock className="w-3.5 h-3.5" /> {t('csScheduleTitle')}
      </span>
      <select value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); setIdInput(''); }} className="neu-input text-sm">
        <option value="">{t('csSelectContact')}</option>
        {contacts.map((c) => <option key={c.id} value={c.email}>{c.display_name}</option>)}
      </select>
      <input value={idInput} onChange={(e) => { setIdInput(e.target.value); setContactEmail(''); }} placeholder={t('csOrEnterId')} className="neu-input text-sm" />
      <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} lang={lang} className="neu-input text-sm" />
      {error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? t('csScheduling') : t('csScheduleBtn')}</button>
    </form>
  );
}