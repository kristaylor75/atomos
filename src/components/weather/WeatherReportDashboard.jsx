import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getHistory } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const STORM_CODES = new Set([65, 66, 67, 75, 82, 86, 95, 96, 99]);

function groupByDay(entries, lang) {
  const byDay = {};
  entries.forEach((e) => {
    const day = new Date(e.timestamp).toLocaleDateString(lang || undefined, { month: 'short', day: 'numeric' });
    if (!byDay[day]) byDay[day] = { day, tempSum: 0, tempCount: 0, storms: 0 };
    if (typeof e.temperature === 'number') {
      byDay[day].tempSum += e.temperature;
      byDay[day].tempCount += 1;
    }
    if (STORM_CODES.has(e.weather_code)) byDay[day].storms += 1;
  });
  return Object.values(byDay).map((d) => ({
    day: d.day,
    avgTemp: d.tempCount ? Math.round((d.tempSum / d.tempCount) * 10) / 10 : null,
    storms: d.storms,
  }));
}

export default function WeatherReportDashboard() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = () => {
      const entries = getHistory().filter((e) => e.tool === 'weather').reverse();
      setData(groupByDay(entries, lang));
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [lang]);

  if (data.length < 2) {
    return (
      <div className="panel p-4 mt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('weatherHistoryReports')}
        </span>
        <p className="text-xs text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('weatherHistoryNotEnough')}
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-4 mt-3">
      <span className="text-[10px] font-bold uppercase tracking-widest block mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {t('weatherHistoryReports')}
      </span>

      <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{t('weatherTempTrend')}</p>
      <div style={{ width: '100%', height: 160 }} className="mb-4">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Line type="monotone" dataKey="avgTemp" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={t('weatherAvgTemp')} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>{t('weatherStormFreq')}</p>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Bar dataKey="storms" fill="hsl(var(--destructive))" name={t('weatherStormEvents')} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}