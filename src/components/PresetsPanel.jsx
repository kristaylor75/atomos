import { useState, useEffect } from 'react';
import { Bookmark, BookmarkPlus, Trash2, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react';
import { getPresets, savePreset, deletePreset, renamePreset } from '@/lib/presets';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function PresetsPanel({ tool, currentData, onLoad, label }) {
  const { t } = useLanguage();
  const [presets, setPresets] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const reload = () => setPresets(getPresets().filter(p => p.tool === tool));
  useEffect(() => { reload(); }, [tool]);

  const handleSave = () => {
    if (!label && !currentData) return;
    const name = label || `Preset ${Date.now()}`;
    savePreset({ tool, name, data: currentData });
    reload();
  };

  const handleDelete = (id) => { deletePreset(id); reload(); };

  const startEdit = (preset) => { setEditingId(preset.id); setEditName(preset.name); };
  const commitEdit = (id) => {
    if (editName.trim()) renamePreset(id, editName.trim());
    setEditingId(null);
    reload();
  };

  const canSave = currentData && (tool === 'calculator' ? !!currentData.expr : !!currentData.inputVal);

  return (
    <div className="panel overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('panelPresets')}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleSave}
            disabled={!canSave}
            title="Save current as preset"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors',
              canSave ? '' : 'cursor-not-allowed'
            )}
            style={canSave
              ? { color: 'hsl(var(--primary))' }
              : { color: 'hsl(var(--muted-foreground) / 0.35)' }
            }
            onMouseEnter={e => canSave && (e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('panelSave')}</span>
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-64 overflow-y-auto">
          {presets.length === 0 ? (
            <p className="text-xs text-center py-6 px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('panelNoPresetsShort')} <strong style={{ color: 'hsl(var(--primary))' }}>{t('panelSave')}</strong>.
            </p>
          ) : (
            <div>
              {presets.map((preset, i) => (
                <div
                  key={preset.id}
                  className="group flex items-center gap-2 px-4 py-2.5 transition-colors"
                  style={{ borderTop: i > 0 ? '1px solid hsl(var(--border) / 0.5)' : undefined }}
                  onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {editingId === preset.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(preset.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none"
                      style={{
                        background: 'hsl(var(--input))',
                        border: '1px solid hsl(var(--primary) / 0.4)',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 0 0 2px hsl(var(--primary) / 0.1)',
                      }}
                    />
                  ) : (
                    <button onClick={() => onLoad(preset.data)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{preset.name}</p>
                      <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {tool === 'calculator'
                          ? preset.data?.expr
                          : `${preset.data?.inputVal} ${preset.data?.fromUnit} → ${preset.data?.toUnit}`}
                      </p>
                    </button>
                  )}

                  <div className={cn(
                    'flex items-center gap-0.5 shrink-0 transition-opacity',
                    editingId === preset.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    {editingId === preset.id ? (
                      <button
                        onClick={() => commitEdit(preset.id)}
                        className="p-1 rounded"
                        style={{ color: 'hsl(var(--primary))' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--primary) / 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(preset)}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--accent))'; e.currentTarget.style.color = 'hsl(var(--foreground))'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}