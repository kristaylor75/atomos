import { useState, useEffect, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getHistory } from '@/lib/history';
import { getToolTimeStats, formatToolDuration } from '@/lib/toolTime';
import { useLanguage } from '@/lib/LanguageContext.jsx';

// Display label for each tool id (route id used by the time tracker).
const TOOL_LABEL_KEYS = {
  calculator: 'navCalculator',
  converter: 'navConverter',
  geometry: 'navGeometry',
  graphing: 'navGraphing',
  datetime: 'navDateTime',
  textconverter: 'textConverterTitle',
  generator: 'navGenerator',
  weather: 'navWeather',
  radio: 'navRadio',
  notes: 'navNotes',
  map: 'navMap',
  email: 'navEmail',
  messages: 'navSms',
  calls: 'navCalls',
  contacts: 'navContacts',
  groupchat: 'navSms',
  chess: 'chessTitle',
  minesweeper: 'minesTitle',
  snake: 'snakeTitle',
  tetris: 'tetrisTitle',
  doom: 'doomTitle',
  system: 'navSystemStatus',
  home: 'navHome',
};

const LOCALE_MAP = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-PT', zh: 'zh-CN' };

export default function UsageAnalyticsWidget() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState(() => getToolTimeStats(7));
  const [hasHistory, setHasHistory] = useState(() => getHistory().length > 0);

  useEffect(() => {
    const refresh = () => { setStats(getToolTimeStats(7)); setHasHistory(getHistory().length > 0); };
    const interval = setInterval(refresh, 4000);
    window.addEventListener('tooltimechange', refresh);
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tooltimechange', refresh);
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Top tools by cumulative time spent (not raw usage count).
  const topTools = useMemo(
    () => Object.entries(stats.byTool).sort((a, b) => b[1] - a[1]).slice(0, 4),
    [stats]
  );

  // 7-day trend: total time spent across all tools, per day.
  const dailyTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ key: d.toDateString(), label: d.toLocaleDateString(LOCALE_MAP[lang] || 'en-US', { weekday: 'short' }), ms: 0 });
    }
    stats.byDay.forEach((b, idx) => { if (days[idx]) days[idx].ms = b.ms; });
    return days;
  }, [stats, lang]);

  const hasActivity = topTools.length > 0 || hasHistory;

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4" style={{ color: 'hsl(217 91% 60%)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeUsageAnalytics')}</span>
      </div>

      {!hasActivity ? (
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeNoActivity')}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {topTools.length === 0 ? (
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('homeNoActivity')}</p>
            ) : topTools.map(([tool, ms]) => (
              <div key={tool} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>{TOOL_LABEL_KEYS[tool] ? t(TOOL_LABEL_KEYS[tool]) : tool}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary))', color: '#fff' }}>{formatToolDuration(ms)}</span>
              </div>
            ))}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{t('homeLast7Days')}</p>
          <div style={{ width: '100%', height: 100 }}>
            <ResponsiveContainer>
              <BarChart data={dailyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} formatter={(v) => [formatToolDuration(v), t('homeUsageAnalytics')]} />
                <Bar dataKey="ms" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}