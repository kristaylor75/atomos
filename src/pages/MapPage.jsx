import MapEditor from '@/components/MapEditor';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MapPage() {
  const { t } = useLanguage();
  return (
    <div className="p-5 max-w-3xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('mapTitle')}</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapSubtitle')}</p>
      </div>
      <MapEditor />
    </div>
  );
}