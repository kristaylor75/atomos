import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';
import { WAYPOINT_ICONS } from '@/lib/mapIcons.jsx';

export default function WaypointCreateForm({ onCreate, onCancel }) {
  const { t } = useLanguage();
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('pin');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      await onCreate({ label: label.trim() || t('mapDefaultLabel'), icon, note });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 w-56">
      <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('mapNameLabel')} className="neu-input text-xs" />
      <select value={icon} onChange={(e) => setIcon(e.target.value)} className="neu-input text-xs">
        {WAYPOINT_ICONS.map((i) => (
          <option key={i.value} value={i.value}>{t(i.labelKey)}</option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('mapNotePlaceholder')}
        rows={2}
        className="neu-input text-xs resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={create}
          disabled={saving}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Check className="w-3.5 h-3.5" /> {t('mapCreateWaypoint')}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}