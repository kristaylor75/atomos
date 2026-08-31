import SystemStatusWidget from '@/components/home/SystemStatusWidget';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function SystemStatus() {
  const { t } = useLanguage();
  return (
    <div className="p-5 max-w-2xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('sysStatusTitle')}</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('sysStatusSubtitle')}</p>
      </div>
      <SystemStatusWidget />
    </div>
  );
}