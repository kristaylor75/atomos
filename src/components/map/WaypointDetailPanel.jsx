import { useState, useEffect } from 'react';
import { Save, Trash2, X, Navigation, Square } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { WAYPOINT_ICONS } from '@/lib/mapIcons.jsx';

export default function WaypointDetailPanel({ waypoint, onSave, onDelete, onClose, onNavigate, onStopNavigate, isNavigating, canNavigate }) {
  const { t } = useLanguage();
  const [label, setLabel] = useState(waypoint.label || '');
  const [icon, setIcon] = useState(waypoint.icon || 'pin');
  const [note, setNote] = useState(waypoint.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(waypoint.label || '');
    setIcon(waypoint.icon || 'pin');
    setNote(waypoint.note || '');
  }, [waypoint.id]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ label, icon, note });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel p-3 mb-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('mapWaypointDetails')}</span>
        <button onClick={onClose} style={{ color: 'hsl(var(--muted-foreground))' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('mapNameLabel')} className="neu-input text-xs" />
      {waypoint.address && <p className="text-[10px] opacity-70">{waypoint.address}</p>}
      <select value={icon} onChange={(e) => setIcon(e.target.value)} className="neu-input text-xs">
        {WAYPOINT_ICONS.map((i) => (
          <option key={i.value} value={i.value}>{t(i.labelKey)}</option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('mapNotePlaceholder')}
        rows={3}
        className="neu-input text-xs resize-none"
      />
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Save className="w-3.5 h-3.5" /> {t('mapSave')}
        </button>
        {isNavigating ? (
          <button
            onClick={onStopNavigate}
            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
            style={{ background: 'hsl(var(--destructive))', color: '#fff' }}
          >
            <Square className="w-3.5 h-3.5" /> {t('mapStopNav')}
          </button>
        ) : (
          <button
            onClick={onNavigate}
            disabled={!canNavigate}
            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 disabled:opacity-40"
            style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
          >
            <Navigation className="w-3.5 h-3.5" /> {t('mapGoTo')}
          </button>
        )}
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'hsl(var(--destructive))' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}