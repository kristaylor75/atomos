import { useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniDateTimeWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const days = start && end ? differenceInCalendarDays(new Date(end), new Date(start)) : null;

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {t('navDateTime')}
        </span>
        <button onClick={() => navigate('/datetime')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[10px] opacity-60 mb-1.5">{t('dtDiffTitle')}</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="neu-input text-xs" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="neu-input text-xs" />
      </div>
      {days !== null && !isNaN(days) && (
        <p className="text-sm font-mono font-bold mt-2 text-center text-foreground">{Math.abs(days)} {t('dtDiffDays')}</p>
      )}
    </div>
  );
}