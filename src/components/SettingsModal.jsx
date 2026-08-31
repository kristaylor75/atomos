import { useState, useEffect } from 'react';
import { X, Check, Globe, Calendar, Clock, Hash, Palette, ChevronDown, DollarSign, Zap, Bell, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { useAuth } from '@/lib/AuthContext';
import { DATE_FORMATS, getDateFormat, setDateFormat } from '@/lib/dateFormatPref';
import SkinTab from '@/components/SkinTab';
import CurrencyCustomizer from '@/components/CurrencyCustomizer';
import { getEnabledCurrencies, setEnabledCurrencies } from '@/lib/currencyPrefs';
import { NOTIFICATION_TYPES, getNotificationPrefs, setNotificationPref } from '@/lib/notificationsPref';
import QuickAccessCustomizer from '@/components/QuickAccessCustomizer';

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

function CollapsibleSection({ icon: Icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 mb-2 px-1 group"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{title}</span>
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ color: 'hsl(var(--muted-foreground))', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      {open && children}
    </div>
  );
}

export default function SettingsModal({ open, onClose, defaultTab = 'preferences' }) {
  const { lang, switchLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const [dateFormat, setDateFormatState] = useState(getDateFormat);
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem('omnicale_time_fmt') || '12h');
  const [numberFormat, setNumberFormat] = useState(() => localStorage.getItem('omnicale_num_fmt') || 'comma');
  const [enabledCurrencies, setEnabledCurrenciesState] = useState(() => getEnabledCurrencies());
  const [notifPrefs, setNotifPrefs] = useState(getNotificationPrefs);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleNotifToggle = (id, enabled) => {
    setNotifPrefs(prev => ({ ...prev, [id]: enabled }));
    setNotificationPref(id, enabled);
  };

  useEffect(() => { if (open) setActiveTab(defaultTab); }, [open, defaultTab]);

  if (!open) return null;

  const handleDateFormat = (val) => { setDateFormatState(val); setDateFormat(val); };
  const handleTimeFormat = (val) => { setTimeFormat(val); localStorage.setItem('omnicale_time_fmt', val); window.dispatchEvent(new Event('timeformatchange')); };
  const handleNumberFormat = (val) => { setNumberFormat(val); localStorage.setItem('omnicale_num_fmt', val); };
  const handleCurrencyChange = (list) => { setEnabledCurrenciesState(list); setEnabledCurrencies(list); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(220 16% 12%)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '8px 8px 24px rgba(0,0,0,0.7), -2px -2px 8px rgba(255,255,255,0.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-foreground text-sm">{t('navSettings')}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
            onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
            onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-1">
          {[
            { id: 'preferences', label: t('settingsTabPreferences') },
            { id: 'appearance', label: t('settingsTabAppearance'), icon: Palette },
            { id: 'quickaccess', label: t('settingsTabQuickAccess'), icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                color: activeTab === tab.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {tab.icon && <tab.icon className="w-3 h-3" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {activeTab === 'appearance' && <SkinTab />}
          {activeTab === 'quickaccess' && <QuickAccessCustomizer />}
          {activeTab === 'preferences' && <>

            <CollapsibleSection icon={LogOut} title={t('accountTitle')}>
              <button
                onClick={() => { onClose(); logout(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'hsl(var(--destructive) / 0.12)',
                  border: '1px solid hsl(var(--destructive) / 0.5)',
                  color: 'hsl(var(--destructive))',
                }}
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </CollapsibleSection>

            <CollapsibleSection icon={Globe} title={t('navLanguage')}>
              <div className="panel overflow-hidden">
                {LANGUAGES.map((language, i) => (
                  <button
                    key={language.code}
                    onClick={() => switchLanguage(language.code)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all relative"
                    style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined, background: lang === language.code ? 'hsl(var(--primary) / 0.08)' : 'transparent' }}
                  >
                    <span className="text-base leading-none">{language.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{language.label}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{language.native}</p>
                    </div>
                    {lang === language.code && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary))' }}>
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection icon={Calendar} title={t('settingsDateFormat')}>
              <div className="panel overflow-hidden">
                {DATE_FORMATS.map((fmt, i) => (
                  <button
                    key={fmt.value}
                    onClick={() => handleDateFormat(fmt.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all text-sm"
                    style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined, background: dateFormat === fmt.value ? 'hsl(var(--primary) / 0.08)' : 'transparent', color: dateFormat === fmt.value ? 'hsl(217 80% 70%)' : 'hsl(var(--foreground))' }}
                  >
                    <span>{fmt.label}</span>
                    <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt.example}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection icon={Clock} title={t('settingsTimeFormat')}>
              <div className="panel overflow-hidden">
                {TIME_FORMATS.map((fmt, i) => (
                  <button
                    key={fmt.value}
                    onClick={() => handleTimeFormat(fmt.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all text-sm"
                    style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined, background: timeFormat === fmt.value ? 'hsl(var(--primary) / 0.08)' : 'transparent', color: timeFormat === fmt.value ? 'hsl(217 80% 70%)' : 'hsl(var(--foreground))' }}
                  >
                    <span>{fmt.label}</span>
                    <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt.example}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection icon={Hash} title={t('settingsNumberFormat')}>
              <div className="panel overflow-hidden">
                {NUMBER_FORMATS.map((fmt, i) => (
                  <button
                    key={fmt.value}
                    onClick={() => handleNumberFormat(fmt.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all text-sm"
                    style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined, background: numberFormat === fmt.value ? 'hsl(var(--primary) / 0.08)' : 'transparent', color: numberFormat === fmt.value ? 'hsl(217 80% 70%)' : 'hsl(var(--foreground))' }}
                  >
                    <span>{fmt.label}</span>
                    <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{fmt.example}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection icon={Bell} title={t('notifTitle')} defaultOpen={false}>
              <div className="panel overflow-hidden">
                {NOTIFICATION_TYPES.map((type, i) => (
                  <div
                    key={type.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5"
                    style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t(type.labelKey)}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t(type.descriptionKey)}</p>
                    </div>
                    <button
                      onClick={() => handleNotifToggle(type.id, !notifPrefs[type.id])}
                      className="relative w-10 h-5.5 rounded-full shrink-0 transition-colors"
                      style={{ background: notifPrefs[type.id] ? 'hsl(var(--primary))' : 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', height: '1.375rem' }}
                      aria-pressed={!!notifPrefs[type.id]}
                    >
                      <span
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white transition-all"
                        style={{ left: notifPrefs[type.id] ? 'calc(100% - 1.125rem)' : '0.125rem', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection icon={DollarSign} title={t('cat_currency')} defaultOpen={false}>
              <div className="panel p-4">
                <CurrencyCustomizer enabled={enabledCurrencies} onChange={handleCurrencyChange} />
              </div>
            </CollapsibleSection>

          </>}
        </div>
      </div>
    </div>
  );
}