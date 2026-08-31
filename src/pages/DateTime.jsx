import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { addHistoryEntry } from '@/lib/history';
import InlineHistory from '@/components/InlineHistory';
import { TIMEZONES } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { differenceInYears, differenceInMonths, differenceInWeeks, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { getDateFormat } from '@/lib/dateFormatPref';

function DateInput({ value, onChange, className }) {
  const { lang } = useLanguage();
  return (
    <input
      type="date"
      lang={lang}
      value={value}
      onChange={onChange}
      className={cn('neu-input', className)}
      style={{ colorScheme: 'dark' }}
    />
  );
}

const TAB_KEYS = [
  { id: 'age', key: 'dtTabAge' },
  { id: 'diff', key: 'dtTabDiff' },
  { id: 'timezone', key: 'dtTabTimezone' },
];

export default function DateTime() {
  const [tab, setTab] = useState('age');
  const [dateFormat, setDateFormatState] = useState(getDateFormat);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Re-read date format when settings modal writes to localStorage
  useEffect(() => {
    const sync = () => setDateFormatState(getDateFormat());
    window.addEventListener('storage', sync);
    window.addEventListener('dateformatchange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dateformatchange', sync);
    };
  }, []);

  return (
    <div className="p-5 max-w-4xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('dtTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('dtSubtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0">
          <div className="tab-bar mb-5">
            {TAB_KEYS.map(tab_ => (
              <button
                key={tab_.id}
                onClick={() => setTab(tab_.id)}
                className={cn('tab-item', tab === tab_.id && 'active')}
              >
                {t(tab_.key)}
              </button>
            ))}
          </div>

          {tab === 'age' && <AgeCalculator navigate={navigate} t={t} dateFormat={dateFormat} />}
          {tab === 'diff' && <DateDifference navigate={navigate} t={t} dateFormat={dateFormat} />}
          {tab === 'timezone' && <TimeZoneConverter t={t} dateFormat={dateFormat} />}
        </div>

        <div className="lg:w-64 shrink-0">
          <InlineHistory tool="datetime" />
        </div>
      </div>
    </div>
  );
}

function AgeCalculator({ navigate, t, dateFormat }) {
  const [birthdate, setBirthdate] = useState('');
  const [asOf, setAsOf] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [result, setResult] = useState(null);

  const fmtDate = (iso) => { try { return format(parseISO(iso), dateFormat); } catch { return iso; } };

  const calculate = () => {
    if (!birthdate || !asOf) return;
    const birth = parseISO(birthdate);
    const ref = parseISO(asOf);
    if (birth > ref) { setResult({ error: 'Birthdate must be before the reference date.' }); return; }
    const years = differenceInYears(ref, birth);
    const months = differenceInMonths(ref, birth) % 12;
    const days = differenceInDays(ref, new Date(birth.getFullYear() + years, birth.getMonth() + months, birth.getDate()));
    const totalDays = differenceInDays(ref, birth);
    const totalMonths = differenceInMonths(ref, birth);
    const totalWeeks = differenceInWeeks(ref, birth);
    const totalHours = differenceInHours(ref, birth);
    const r = { years, months, days, totalDays, totalMonths, totalWeeks, totalHours };
    setResult(r);
    addHistoryEntry({
      tool: 'datetime',
      subtype: 'age',
      birthDateFmt: fmtDate(birthdate),
      asOfFmt: fmtDate(asOf),
      years, months, days,
    });
  };

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{t('dtTabAge')}</h3>
        <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{dateFormat.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtAgeDOB')}</label>
          <DateInput value={birthdate} onChange={e => setBirthdate(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtAgeAsOf')}</label>
          <DateInput value={asOf} onChange={e => setAsOf(e.target.value)} />
        </div>
      </div>
      <button onClick={calculate} className="btn-primary">
        {t('dtAgeCalculate')}
      </button>

      {result && !result.error && (
        <div className="space-y-3 pt-2">
          <div className="rounded-xl p-4 text-center" style={{ background: 'hsl(var(--primary) / 0.07)', border: '1px solid hsl(var(--primary) / 0.2)', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.25)' }}>
            <p className="text-4xl font-bold text-primary">{result.years}</p>
            <p className="text-muted-foreground text-sm mt-1">{t('dtAgeYearsOld')}</p>
            <p className="text-foreground font-medium mt-2">{result.months} {t('dtAgeMonthsDays')}, {result.days} {t('dtAgeDays')}</p>
            {birthdate && <p className="text-xs text-muted-foreground mt-2">{fmtDate(birthdate)} → {fmtDate(asOf)}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { labelKey: 'dtAgeTotalMonths', value: result.totalMonths, fromUnit: 'month' },
              { labelKey: 'dtAgeTotalWeeks', value: result.totalWeeks, fromUnit: 'week' },
              { labelKey: 'dtAgeTotalDays', value: result.totalDays, fromUnit: 'day' },
              { labelKey: 'dtAgeTotalHours', value: result.totalHours, fromUnit: 'hour' },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => navigate(`/converter?category=time&value=${item.value}&from=${item.fromUnit}`)}
                className="rounded-xl p-3 text-center cursor-pointer transition-all group"
                style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--secondary))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                title="Convert in Unit Converter"
              >
                <p className="text-lg font-semibold text-foreground">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t(item.labelKey)}</p>
                <p className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-0.5 flex items-center justify-center gap-1 transition-opacity">
                  <ArrowLeftRight className="w-2.5 h-2.5" /> {t('dtConvert')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {result?.error && <p className="text-destructive text-sm">{result.error}</p>}
    </div>
  );
}

function DateDifference({ navigate, t, dateFormat }) {
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [result, setResult] = useState(null);

  const fmtDate = (iso) => { try { return format(parseISO(iso), dateFormat); } catch { return iso; } };

  const calculate = () => {
    if (!date1 || !date2) return;
    const d1 = parseISO(date1);
    const d2 = parseISO(date2);
    const [earlier, later] = d1 < d2 ? [d1, d2] : [d2, d1];
    const years = differenceInYears(later, earlier);
    const months = differenceInMonths(later, earlier);
    const weeks = differenceInWeeks(later, earlier);
    const days = differenceInDays(later, earlier);
    const hours = differenceInHours(later, earlier);
    const minutes = differenceInMinutes(later, earlier);
    const seconds = differenceInSeconds(later, earlier);
    const r = { years, months, weeks, days, hours, minutes, seconds };
    setResult(r);
    addHistoryEntry({
      tool: 'datetime',
      subtype: 'diff',
      date1Fmt: fmtDate(date1),
      date2Fmt: fmtDate(date2),
      days, years, months,
    });
  };

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{t('dtDiffTitle')}</h3>
        <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{dateFormat.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtDiffStart')}</label>
          <DateInput value={date1} onChange={e => setDate1(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtDiffEnd')}</label>
          <DateInput value={date2} onChange={e => setDate2(e.target.value)} />
        </div>
      </div>
      <button onClick={calculate} className="btn-primary">
        {t('dtDiffCalculate')}
      </button>

      {result && (
        <div className="space-y-3 pt-2">
          {date1 && date2 && (
            <p className="text-xs text-muted-foreground text-center">{fmtDate(date1)} → {fmtDate(date2)}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { labelKey: 'dtDiffYears', value: result.years, fromUnit: 'year' },
              { labelKey: 'dtDiffMonths', value: result.months, fromUnit: 'month' },
              { labelKey: 'dtDiffWeeks', value: result.weeks, fromUnit: 'week' },
              { labelKey: 'dtDiffDays', value: result.days, fromUnit: 'day' },
              { labelKey: 'dtDiffHours', value: result.hours, fromUnit: 'hour' },
              { labelKey: 'dtDiffMinutes', value: result.minutes, fromUnit: 'minute' },
            ].map(item => (
              <div
                key={item.label}
                onClick={() => navigate(`/converter?category=time&value=${item.value}&from=${item.fromUnit}`)}
                className="rounded-xl p-3 text-center cursor-pointer transition-all group"
                style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'; e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--secondary))'; e.currentTarget.style.borderColor = 'hsl(var(--border))'; }}
                title="Convert in Unit Converter"
              >
                <p className="text-xl font-bold text-foreground">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t(item.labelKey)}</p>
                <p className="text-[10px] text-primary opacity-0 group-hover:opacity-100 mt-0.5 flex items-center justify-center gap-1 transition-opacity">
                  <ArrowLeftRight className="w-2.5 h-2.5" /> {t('dtConvert')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeInput({ value, onChange, timeFormat }) {
  const [h, m] = value ? value.split(':').map(Number) : [0, 0];
  const is12 = timeFormat === '12h';
  const ampmLabels = { AM: 'a.m.', PM: 'p.m.' };
  const ampm = h >= 12 ? ampmLabels.PM : ampmLabels.AM;
  const displayH = is12 ? (h % 12 || 12) : h;

  const update = (newH, newM) => {
    const hh = String(newH).padStart(2, '0');
    const mm = String(newM).padStart(2, '0');
    onChange(`${hh}:${mm}`);
  };

  const handleHour = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (is12) {
      val = Math.max(1, Math.min(12, val));
      const newH = ampm === 'PM' ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val);
      update(newH, m);
    } else {
      val = Math.max(0, Math.min(23, val));
      update(val, m);
    }
  };

  const handleMinute = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    val = Math.max(0, Math.min(59, val));
    update(h, val);
  };

  const toggleAmPm = () => {
    const newH = h >= 12 ? h - 12 : h + 12;
    update(newH, m);
  };

  return (
    <div className="neu-input flex items-center justify-center gap-1 px-3 py-2.5">
      <input
        type="number"
        value={String(displayH).padStart(2, '0')}
        onChange={handleHour}
        min={is12 ? 1 : 0}
        max={is12 ? 12 : 23}
        className="w-8 bg-transparent text-center text-sm font-medium text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-muted-foreground font-bold">:</span>
      <input
        type="number"
        value={String(m).padStart(2, '0')}
        onChange={handleMinute}
        min={0}
        max={59}
        className="w-8 bg-transparent text-center text-sm font-medium text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {is12 && (
        <button
          type="button"
          onClick={toggleAmPm}
          className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded transition-colors"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
        >
          {ampm}
        </button>
      )}
    </div>
  );
}

function TimeZoneConverter({ t, dateFormat }) {
  const { lang } = useLanguage();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [sourceZone, setSourceZone] = useState('UTC');
  const [targetZones, setTargetZones] = useState(['America/New_York', 'Europe/London', 'Asia/Tokyo']);

  // Localize a timezone value to the current language using Intl
  const localizeZone = (tzValue) => {
    try {
      const fmt = new Intl.DateTimeFormat(lang, { timeZone: tzValue, timeZoneName: 'long' });
      const parts = fmt.formatToParts(new Date());
      const tzName = parts.find(p => p.type === 'timeZoneName')?.value || tzValue;
      return tzName;
    } catch {
      return TIMEZONES.find(tz => tz.value === tzValue)?.label || tzValue;
    }
  };
  const [results, setResults] = useState([]);
  const [timeFormat, setTimeFormatState] = useState(() => localStorage.getItem('omnicale_time_fmt') || '12h');

  useEffect(() => {
    const sync = () => setTimeFormatState(localStorage.getItem('omnicale_time_fmt') || '12h');
    window.addEventListener('storage', sync);
    window.addEventListener('timeformatchange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('timeformatchange', sync);
    };
  }, []);

  const fmtDate = (iso) => { try { return format(parseISO(iso), dateFormat); } catch { return iso; } };
  const fmtTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit', hour12: timeFormat === '12h' }).format(d);
  };

  const fmtResult = (sourceDate, tz) => {
    const hour12 = timeFormat === '12h';
    return new Intl.DateTimeFormat(lang, {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12,
    }).format(sourceDate);
  };

  const convert = () => {
    const dtString = `${date}T${time}:00`;
    const sourceDate = new Date(dtString);
    const res = targetZones.map(tz => {
      return { tz, label: localizeZone(tz), sourceDate };
    });
    setResults(res);
    addHistoryEntry({
      tool: 'datetime',
      subtype: 'timezone',
      dateFmt: fmtDate(date),
      time,
      sourceZone,
      targetCount: targetZones.length,
    });
  };

  const addZone = (tz) => {
    if (!targetZones.includes(tz)) setTargetZones(prev => [...prev, tz]);
  };
  const removeZone = (tz) => setTargetZones(prev => prev.filter(z => z !== tz));

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{t('dtTZTitle')}</h3>
        <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>{dateFormat.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtTZDate')}</label>
          <DateInput value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtTZTime')}</label>
          <TimeInput value={time} onChange={setTime} timeFormat={timeFormat} />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtTZSource')}</label>
          <select value={sourceZone} onChange={e => setSourceZone(e.target.value)} className="neu-input cursor-pointer">
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{localizeZone(tz.value)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('dtTZTargets')}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {targetZones.map(tz => (
            <span key={tz} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(217 80% 70%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              {localizeZone(tz)}
              <button onClick={() => removeZone(tz)} className="text-muted-foreground hover:text-destructive">×</button>
            </span>
          ))}
        </div>
        <select
          onChange={e => { if (e.target.value) { addZone(e.target.value); e.target.value = ''; }}}
          className="neu-input cursor-pointer"
          defaultValue=""
        >
          <option value="">{t('dtTZAdd')}</option>
          {TIMEZONES.filter(tz => !targetZones.includes(tz.value)).map(tz => (
            <option key={tz.value} value={tz.value}>{localizeZone(tz.value)}</option>
          ))}
        </select>
      </div>

      <button onClick={convert} className="btn-primary">
        {t('dtTZConvert')}
      </button>

      {results.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground text-center">{fmtDate(date)} {fmtTime(time)} ({sourceZone})</p>
          {results.map(r => (
            <div key={r.tz} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.6)', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.25)' }}>
              <div>
                <p className="text-xs text-muted-foreground">{r.label}</p>
              </div>
              <p className="font-mono text-sm font-medium text-foreground">{fmtResult(r.sourceDate, r.tz)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}