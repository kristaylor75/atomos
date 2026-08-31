import { Download } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function ExportWaypoints({ waypoints }) {
  const { t } = useLanguage();
  if (!waypoints.length) return null;

  const handleExport = () => {
    const data = waypoints.map(({ label, latitude, longitude, address, note, icon }) => ({
      label, latitude, longitude, address, note, icon,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waypoints-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg"
      style={{ color: 'hsl(var(--primary))' }}
    >
      <Download className="w-3.5 h-3.5" /> {t('mapExportWaypoints')}
    </button>
  );
}