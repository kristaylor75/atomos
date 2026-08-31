import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const ICONS = { email: Mail, sms: MessageSquare, call: Phone };
const ROUTES = { email: '/email-inbox', sms: '/messages', call: '/calls' };
const SEEN_KEY = 'commsAlertedIds';

function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
function markSeen(ids) {
  const updated = [...new Set([...getSeenIds(), ...ids])].slice(-200);
  localStorage.setItem(SEEN_KEY, JSON.stringify(updated));
}

export default function CommunicationWidget() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await appData.auth.me();
        const [emails, personal] = await Promise.all([
          appData.entities.Communication.filter({ type: 'email', status: 'unread' }, '-created_date', 20),
          appData.entities.Communication.filter({ recipient_email: user.email, status: 'unread' }, '-created_date', 20),
        ]);
        const combined = [...emails, ...personal].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setItems(combined);

        const seen = getSeenIds();
        const fresh = combined.filter(c => !seen.includes(c.id));
        fresh.forEach(comm => {
          toast({
            title: `${t('homeNewMessageFrom')} ${comm.sender}`,
            description: comm.content,
          });
        });
        if (fresh.length) markSeen(fresh.map(c => c.id));
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('navCatCommunications')}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeNoUnreadMessages')}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 4).map(c => {
            const Icon = ICONS[c.type] || Mail;
            return (
              <li key={c.id}>
                <Link to={ROUTES[c.type] || '/email-inbox'} className="flex items-start gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{c.sender}</p>
                    <p className="text-[11px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{c.content}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 4 && (
        <p className="text-[10px] mt-1.5 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>+{items.length - 4} {t('homeMoreUnread')}</p>
      )}
    </div>
  );
}