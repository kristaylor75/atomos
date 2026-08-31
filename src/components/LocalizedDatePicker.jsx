import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

function toDateValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function fromDateValue(v) {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Self-contained localized calendar popover. The native <input type="date">
// popup is controlled by the browser's UI locale (not the input's `lang`),
// so we render month names and weekday headers ourselves via Intl, which
// honors the active app language. The popover is portaled to document.body
// with fixed positioning so it isn't clipped by any overflow-hidden ancestor
// (e.g. the .panel wrapper) or trapped behind later stacking layers.
export default function LocalizedDatePicker({ value, onChange }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? fromDateValue(value) : new Date()));
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => { if (value) setView(fromDateValue(value)); }, [value]);

  const computePos = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = 224;
    const h = 264;
    let left = r.left;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (left < 8) left = 8;
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    setPos({ left, top });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onScroll = () => computePos();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = value ? fromDateValue(value) : null;
  const monthLabel = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(view);
  const weekdayFmt = new Intl.DateTimeFormat(lang, { weekday: 'short' });
  // Sunday Jan 3, 2021 — a known Sunday — iterate to build the week header.
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(2021, 0, 3 + i)));

  const year = view.getFullYear();
  const month = view.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const todayKey = toDateValue(new Date());

  const display = value ? new Intl.DateTimeFormat(lang).format(selected) : t('csDateSelect');

  const popover = open && pos ? createPortal((
    <div
      ref={popRef}
      className="p-3 w-[224px] rounded-xl"
      style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 9999, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', boxShadow: '8px 8px 24px rgba(0,0,0,0.6)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="p-1 rounded-lg transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold capitalize" style={{ color: 'hsl(var(--foreground))' }}>{monthLabel}</span>
        <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="p-1 rounded-lg transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const isSel = selected && toDateValue(date) === toDateValue(selected);
          const isToday = toDateValue(date) === todayKey;
          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(toDateValue(date)); setOpen(false); }}
              className="h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-colors"
              style={{
                background: isSel ? 'hsl(var(--primary))' : 'transparent',
                color: isSel ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                border: isToday && !isSel ? '1px solid hsl(var(--primary) / 0.6)' : '1px solid transparent',
                fontWeight: isToday ? 700 : 500,
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs font-semibold transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('csDateClear')}
        </button>
        <button type="button" onClick={() => { onChange(todayKey); setView(new Date()); setOpen(false); }} className="text-xs font-semibold transition-colors" style={{ color: 'hsl(var(--primary))' }}>
          {t('csDateToday')}
        </button>
      </div>
    </div>
  ), document.body) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="neu-input text-xs py-1.5 w-full flex items-center justify-between gap-1"
      >
        <span className="truncate" style={!value ? { color: 'hsl(var(--muted-foreground))' } : undefined}>{display}</span>
        <CalendarIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>
      {popover}
    </div>
  );
}