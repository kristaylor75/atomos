import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { appData } from "@/api/localClient";
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function TodayNotesWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const all = await appData.entities.Note.filter({ date: todayKey });
        setNotes(all);

        // Alert once per day when reminders are due, so it reads as a notification, not just a list.
        if (all.length > 0) {
          const shownKey = `todayNotesAlertShown_${todayKey}`;
          if (!localStorage.getItem(shownKey)) {
            localStorage.setItem(shownKey, '1');
            toast({
              title: `${all.length} ${t('homeRemindersDueToday')}`,
              description: all.map(n => n.title).join(', '),
            });
          }
        }
      } catch {
        // Silently skip this refresh — a transient network error shouldn't crash a background widget.
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70">{t('homeTodayNotes')}</span>
        <button onClick={() => navigate('/notes')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeNoRemindersToday')}</p>
      ) : (
        <ul className="space-y-2">
          {notes.map(n => (
            <li key={n.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <CalendarCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(38 92% 60%)' }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">{n.title}</p>
                {n.content && <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{n.content}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}