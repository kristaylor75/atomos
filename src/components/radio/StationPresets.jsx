import { useState, useEffect } from 'react';
import { BookmarkPlus, Trash2, Play, Radio } from 'lucide-react';
import { getPresets, savePreset, deletePreset } from '@/lib/presets';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function StationPresets({ currentStation, isPlaying, onPlay }) {
  const { t } = useLanguage();
  const [presets, setPresets] = useState([]);

  const load = () => setPresets(getPresets().filter(p => p.tool === 'radio'));

  useEffect(() => { load(); }, []);

  const handleSave = () => {
    if (!currentStation) return;
    haptics.click();
    savePreset({ tool: 'radio', name: currentStation.name, data: currentStation });
    load();
  };

  const handleDelete = (id) => {
    haptics.tap();
    deletePreset(id);
    load();
  };

  const canSave = !!currentStation && !presets.some(p => p.data?.url === currentStation.url);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Save current */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: canSave ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.4)',
          border: `1px solid ${canSave ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
          color: canSave ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)',
        }}
      >
        <BookmarkPlus className="w-4 h-4" />
        {currentStation ? `${t('panelSave')} "${currentStation.name}"` : t('radioNoStation')}
      </button>

      {/* Preset list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {presets.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('radioNoPresets')}
          </p>
        ) : (
          presets.map((preset, i) => {
            const isActive = currentStation?.url === preset.data?.url;
            return (
              <div
                key={preset.id}
                className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all')}
                style={{
                  background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--secondary) / 0.4)',
                  border: isActive ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border) / 0.5)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  <span className="text-[11px] font-bold font-mono">{i + 1}</span>
                </div>

                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => { haptics.click(); onPlay(preset.data); }}
                >
                  <p className="text-sm font-semibold truncate" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                    {preset.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {preset.data?.country || t('radioInternetRadio')}
                  </p>
                </button>

                {isActive && isPlaying && (
                  <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                )}

                <button
                  onClick={() => handleDelete(preset.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg transition-all shrink-0"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive)/0.15)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}