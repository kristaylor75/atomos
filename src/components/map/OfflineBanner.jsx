import { WifiOff } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function OfflineBanner() {
  const { t } = useLanguage();
  return (
    <div
      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3"
      style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t('mapOffline')}</span>
    </div>
  );
}