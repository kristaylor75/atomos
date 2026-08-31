import { Cloud } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { WMO_ICONS } from '@/lib/weatherCodes';

export default function WeatherForecast({ daily }) {
  const { t, lang } = useLanguage();
  if (!daily) return null;

  return (
    <div className="panel p-4 mt-3">
      <span className="text-[10px] font-bold uppercase tracking-widest block mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {t('weatherForecastTitle')}
      </span>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {daily.time.map((d, i) => {
          const Icon = WMO_ICONS[daily.weather_code[i]] || Cloud;
          const dayLabel = i === 0 ? t('weatherDayToday') : new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(d));
          return (
            <div key={d} className="flex flex-col items-center gap-1 py-2 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <span className="text-[9px] font-mono uppercase opacity-70">{dayLabel}</span>
              <Icon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-xs font-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>{Math.round(daily.temperature_2m_max[i])}°</span>
              <span className="text-[10px] font-mono opacity-50">{Math.round(daily.temperature_2m_min[i])}°</span>
              {daily.precipitation_probability_max?.[i] != null && (
                <span className="text-[9px] font-mono" style={{ color: 'hsl(var(--primary))' }}>{daily.precipitation_probability_max[i]}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}