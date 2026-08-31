import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import CalendarDayEditor from './CalendarDayEditor';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function NotesCalendar({ notes, onChange }) {
  const { t, lang } = useLanguage();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthLabel = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(month);
  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(d);
    });
  }, [lang]);

  const notesByDate = useMemo(() => {
    const map = {};
    notes.filter(n => n.date).forEach(n => { map[n.date] = n; });
    return map;
  }, [notes]);

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedNote = selectedKey ? notesByDate[selectedKey] : null;

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
            <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
          <span className="font-semibold text-foreground text-sm">{monthLabel}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
            <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdayLabels.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold uppercase opacity-50 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const hasNote = !!notesByDate[key];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative text-xs font-medium transition-all"
                style={{
                  background: isSelected ? 'hsl(var(--primary))' : isToday ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                  color: isSelected ? '#fff' : inMonth ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.4)',
                  border: isToday && !isSelected ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid transparent',
                }}
              >
                {format(day, 'd')}
                {hasNote && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: isSelected ? '#fff' : 'hsl(38 92% 60%)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <CalendarDayEditor
          date={selectedDate}
          note={selectedNote}
          onClose={() => setSelectedDate(null)}
          onSaved={onChange}
          onDeleted={onChange}
        />
      ) : (
        <div className="panel p-6 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('notesSelectDayHint')}</p>
        </div>
      )}
    </div>
  );
}