import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { getWaypointIconDef } from '@/lib/mapIcons.jsx';

export default function WaypointList({ waypoints, onJump, onDelete }) {
  const { t } = useLanguage();

  if (waypoints.length === 0) {
    return <p className="text-xs text-center py-4 opacity-60">{t('mapNoWaypoints')}</p>;
  }

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto">
      {waypoints.map((wp) => {
        const { Icon } = getWaypointIconDef(wp.icon);
        return (
          <div key={wp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <button onClick={() => onJump(wp)} className="flex-1 text-left text-xs font-semibold truncate">{wp.label}</button>
            {wp.note && <span className="text-[9px] opacity-60">📝</span>}
            <button onClick={() => onDelete(wp.id)} style={{ color: 'hsl(var(--destructive))' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}