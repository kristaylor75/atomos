import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Activity, Phone, MessageSquare, FileText, CloudLightning } from 'lucide-react';
import { appData } from "@/api/localClient";
import { getWeatherAlerts } from '@/lib/weatherAlerts';
import { isNotificationEnabled } from '@/lib/notificationsPref';
import { useLanguage } from '@/lib/LanguageContext.jsx';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SEEN_KEY = 'notificationBell_seenIds';

function loadSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { return new Set(); }
}

export default function NotificationBell() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [seenIds, setSeenIds] = useState(loadSeenIds);
  const navigate = useNavigate();
  const ref = useRef(null);

  const load = useCallback(async () => {
    let me;
    try {
      me = await appData.auth.me();
    } catch { return; }
    if (!me) return;

    let calls = [], sms = [], notes = [], weatherAlerts = [];
    try {
      [calls, sms, notes, weatherAlerts] = await Promise.all([
        appData.entities.Communication.filter({ type: 'call', recipient_email: me.email, status: 'unread' }, '-created_date', 20),
        appData.entities.Communication.filter({ type: 'sms', recipient_email: me.email, status: 'unread' }, '-created_date', 20),
        appData.entities.Note.filter({ date: todayStr() }, '-created_date', 20),
        getWeatherAlerts(),
      ]);
    } catch {
      setItems([]);
      return;
    }

    const list = [];
    if (isNotificationEnabled('calls')) {
      list.push(...calls.map(c => ({ id: `call-${c.id}`, icon: Phone, color: 'hsl(38 92% 60%)', label: `${t('homeMissedCallFrom')} ${c.sender}`, to: '/calls' })));
    }
    if (isNotificationEnabled('sms')) {
      list.push(...sms.map(c => ({ id: `sms-${c.id}`, icon: MessageSquare, color: 'hsl(280 65% 65%)', label: `${t('homeNewMessageFrom')} ${c.sender}`, to: '/messages' })));
    }
    if (isNotificationEnabled('notes')) {
      list.push(...notes.map(n => ({ id: `note-${n.id}`, icon: FileText, color: 'hsl(217 91% 60%)', label: `${t('homeNoteForToday')}: ${n.title}`, to: '/notes' })));
    }
    if (isNotificationEnabled('weather')) {
      list.push(...weatherAlerts.map(a => ({ id: a.id, icon: CloudLightning, color: 'hsl(0 72% 58%)', label: a.message, to: a.to })));
    }

    if (isNotificationEnabled('battery') && navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        if (battery.level <= 0.2 && !battery.charging) {
          list.push({ id: 'battery-low', icon: Activity, color: 'hsl(0 72% 58%)', label: t('homeBatteryLow'), to: '/system-status' });
        }
      } catch {}
    }

    setItems(list);
  }, [t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    const unsubscribe = appData.entities.Communication.subscribe(load);
    const onPrefChange = () => load();
    window.addEventListener('notificationprefchange', onPrefChange);
    return () => { clearInterval(id); unsubscribe(); window.removeEventListener('notificationprefchange', onPrefChange); };
  }, [load]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goTo = (to) => {
    setOpen(false);
    navigate(to);
  };

  const markAllSeen = () => {
    setSeenIds(prev => {
      const next = new Set(prev);
      items.forEach(item => next.add(item.id));
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const toggleOpen = () => {
    setOpen(o => {
      const next = !o;
      if (next) markAllSeen();
      return next;
    });
  };

  const unseenCount = items.filter(item => !seenIds.has(item.id)).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        title={t('homeNotifications')}
        className="w-9 h-9 rounded-xl flex items-center justify-center relative"
        style={{
          background: 'hsl(220 16% 14%)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '3px 3px 8px rgba(0,0,0,0.5), -1px -1px 4px rgba(255,255,255,0.03)',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <Bell className="w-4 h-4" />
        {unseenCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: 'hsl(0 72% 58%)', color: '#fff' }}
          >
            {unseenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl overflow-hidden z-50"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>
            {t('homeNotifications')}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeAllCaughtUp')}</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => goTo(item.to)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                    style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}