import { useState } from 'react';
import { Check, Globe, Calendar, Clock, Hash, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { DATE_FORMATS, getDateFormat, setDateFormat, getTimeFormat, setTimeFormat } from '@/lib/dateFormatPref';
import { NOTIFICATION_TYPES, getNotificationPrefs, setNotificationPref } from '@/lib/notificationsPref';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', label: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'da', label: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'nb', label: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  { code: 'he', label: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour', example: '2:30 PM' },
  { value: '24h', label: '24-hour', example: '14:30' },
];

const NUMBER_FORMATS = [
  { value: 'comma', label: 'Comma separator', example: '1,234,567.89' },
  { value: 'period', label: 'Period separator', example: '1.234.567,89' },
  { value: 'space', label: 'Space separator', example: '1 234 567.89' },
];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: 'hsl(var(--primary) / 0.12)',
          border: '1px solid hsl(var(--primary) / 0.2)',
          boxShadow: '0 0 10px hsl(var(--primary) / 0.08)',
        }}
      >
        <Icon className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
      </div>
      <div>
        <h2 className="font-semibold text-sm text-foreground">{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{description}</p>
      </div>
    </div>
  );
}

function OptionRow({ selected, onClick, label, sublabel, right, border }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 text-left transition-all"
      style={{ borderTop: border ? '1px solid hsl(var(--border) / 0.6)' : undefined }}
      onMouseEnter={e => !selected && (e.currentTarget.style.background = 'hsl(var(--accent))')}
      onMouseLeave={e => !selected && (e.currentTarget.style.background = selected ? 'hsl(var(--primary) / 0.08)' : 'transparent')}
    >
      <div
        className="absolute inset-0 rounded pointer-events-none transition-all"
        style={{ background: selected ? 'hsl(var(--primary) / 0.07)' : 'transparent' }}
      />
      <div className="flex-1 min-w-0 relative">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{sublabel}</p>}
      </div>
      {right && (
        <span className="text-xs font-mono shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{right}</span>
      )}
      {selected ? (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'hsl(var(--primary))',
            boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
          }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      ) : (
        <div
          className="w-5 h-5 rounded-full shrink-0"
          style={{ border: '1px solid hsl(var(--border))' }}
        />
      )}
    </button>
  );
}

export default function Settings() {
  const { lang, switchLanguage, t } = useLanguage();
  const [dateFormat, setDateFormatState] = useState(getDateFormat);
  const [timeFormat, setTimeFormatState] = useState(getTimeFormat);
  const [numberFormat, setNumberFormat] = useState(() => localStorage.getItem('omnicale_num_fmt') || 'comma');
  const [notifPrefs, setNotifPrefs] = useState(getNotificationPrefs);

  const handleNotifToggle = (id, enabled) => {
    setNotifPrefs(prev => ({ ...prev, [id]: enabled }));
    setNotificationPref(id, enabled);
  };

  const handleDateFormat = (val) => { setDateFormatState(val); setDateFormat(val); };
  const handleTimeFormat = (val) => { setTimeFormatState(val); setTimeFormat(val); };
  const handleNumberFormat = (val) => { setNumberFormat(val); localStorage.setItem('omnicale_num_fmt', val); };

  return (
    <div className="p-5 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Customize your OmniCalc experience
        </p>
      </div>

      <div className="space-y-6">

        {/* Language */}
        <section>
          <SectionHeader icon={Globe} title="Language" description="Choose your preferred display language" />
          <div className="panel overflow-hidden">
            {LANGUAGES.map((language, i) => (
              <button
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left transition-all relative"
                style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.6)' : undefined }}
                onMouseEnter={e => lang !== language.code && (e.currentTarget.style.background = 'hsl(var(--accent))')}
                onMouseLeave={e => lang !== language.code && (e.currentTarget.style.background = lang === language.code ? 'hsl(var(--primary) / 0.07)' : 'transparent')}
              >
                {lang === language.code && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'hsl(var(--primary) / 0.07)' }} />
                )}
                <span className="text-xl leading-none relative">{language.flag}</span>
                <div className="flex-1 min-w-0 relative">
                  <p className="text-sm font-medium text-foreground">{language.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{language.native}</p>
                </div>
                {lang === language.code ? (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 relative"
                    style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 8px hsl(var(--primary) / 0.4)' }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full shrink-0" style={{ border: '1px solid hsl(var(--border))' }} />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Date Format */}
        <section>
          <SectionHeader icon={Calendar} title="Date Format" description="How dates are displayed throughout the app" />
          <div className="panel overflow-hidden">
            {DATE_FORMATS.map((fmt, i) => (
              <OptionRow
                key={fmt.value}
                selected={dateFormat === fmt.value}
                onClick={() => handleDateFormat(fmt.value)}
                label={fmt.label}
                right={fmt.example}
                border={i > 0}
              />
            ))}
          </div>
        </section>

        {/* Time Format */}
        <section>
          <SectionHeader icon={Clock} title="Time Format" description="12-hour or 24-hour clock display" />
          <div className="panel overflow-hidden">
            {TIME_FORMATS.map((fmt, i) => (
              <OptionRow
                key={fmt.value}
                selected={timeFormat === fmt.value}
                onClick={() => handleTimeFormat(fmt.value)}
                label={fmt.label}
                right={fmt.example}
                border={i > 0}
              />
            ))}
          </div>
        </section>

        {/* Number Format */}
        <section>
          <SectionHeader icon={Hash} title="Number Format" description="How large numbers are formatted in results" />
          <div className="panel overflow-hidden">
            {NUMBER_FORMATS.map((fmt, i) => (
              <OptionRow
                key={fmt.value}
                selected={numberFormat === fmt.value}
                onClick={() => handleNumberFormat(fmt.value)}
                label={fmt.label}
                right={fmt.example}
                border={i > 0}
              />
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader icon={Bell} title="Notifications" description="Choose which alerts appear in your notifications" />
          <div className="panel overflow-hidden">
            {NOTIFICATION_TYPES.map((type, i) => (
              <div
                key={type.id}
                className="w-full flex items-center gap-4 px-5 py-3.5 transition-all"
                style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.6)' : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{type.description}</p>
                </div>
                <button
                  onClick={() => handleNotifToggle(type.id, !notifPrefs[type.id])}
                  className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
                  style={{ background: notifPrefs[type.id] ? 'hsl(var(--primary))' : 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                  aria-pressed={!!notifPrefs[type.id]}
                >
                  <span
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: notifPrefs[type.id] ? 'calc(100% - 1.25rem)' : '0.125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}