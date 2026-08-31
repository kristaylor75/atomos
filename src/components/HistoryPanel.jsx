import { useState, useEffect } from 'react';
import { X, Clock, Trash2, Bookmark, BookmarkPlus, Pencil, Check } from 'lucide-react';
import { getHistory, clearHistory, formatHistoryEntry } from '@/lib/history';
import { getPresets, savePreset, deletePreset, renamePreset } from '@/lib/presets';
import SendTo from '@/components/SendTo.jsx';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function HistoryPanel({ open, onClose, tool, currentData, onSelectHistory, onLoadPreset, presetLabel }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('history');
  const [entries, setEntries] = useState([]);
  const [presets, setPresets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const loadHistory = () => {
    const all = getHistory();
    setEntries(tool ? all.filter(e => e.tool === tool) : all);
  };
  const loadPresets = () => setPresets(getPresets().filter(p => p.tool === tool));

  useEffect(() => {
    if (open) { loadHistory(); loadPresets(); }
  }, [open, tool]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(loadHistory, 2000);
    return () => clearInterval(id);
  }, [open, tool]);

  const canSave = currentData && (tool === 'calculator' ? !!currentData.expr : !!currentData.inputVal);

  const handleSave = () => {
    if (!canSave) return;
    savePreset({ tool, name: presetLabel || `Preset ${Date.now()}`, data: currentData });
    loadPresets();
  };

  return (
    <>
      {/* Backdrop — starts below top bar */}
      {open && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40"
          style={{ top: '52px', background: 'rgba(0,0,0,0.3)' }}
          onClick={onClose}
        />
      )}

      {/* Slide panel */}
      <div
        className="fixed left-0 z-50 flex flex-col transition-all duration-300"
        style={{
          top: '52px', // below the Layout top bar / HubMenu
          height: 'calc(100% - 52px)',
          width: '300px',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          background: 'rgba(18, 21, 28, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '6px 0 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="tab-bar flex-1 mr-2">
            {['history', 'presets'].map(tabId => (
              <button
                key={tabId}
                type="button"
                onClick={() => setTab(tabId)}
                className={cn('tab-item capitalize text-xs', tab === tabId && 'active')}
              >
                {tabId === 'history'
                  ? <Clock className="w-3 h-3 inline mr-1" />
                  : <Bookmark className="w-3 h-3 inline mr-1" />}
                {tabId === 'history' ? t('panelHistory') : t('panelPresets')}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'hsl(220 16% 16%)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.15)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'hsl(220 16% 16%)'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab: History */}
        {tab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('panelRecent')}
              </span>
              <button
                onClick={() => { clearHistory(tool); loadHistory(); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'hsl(var(--muted-foreground))' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; e.currentTarget.style.color = 'hsl(var(--destructive))'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
              >
                <Trash2 className="w-3 h-3" /> {t('panelClear')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-xs text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('panelNoHistory')}</p>
              ) : (
                entries.slice(0, 30).map((entry, i) => {
                  const { input, result } = formatHistoryEntry(entry, t);
                  return (
                  <div
                    key={entry.id}
                    className="px-4 py-3 group cursor-pointer transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                    onClick={() => { onSelectHistory?.(entry); onClose(); }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p className="text-[10px] font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{input}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm font-semibold font-mono truncate" style={{ color: 'hsl(var(--foreground))' }}>{result}</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                        <SendTo value={entry.result} exclude={entry.tool} />
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Presets */}
        {tab === 'presets' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Save current state as preset */}
            <div className="px-3 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: canSave ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                  color: canSave ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)',
                  border: canSave ? '1px solid hsl(var(--primary) / 0.35)' : '1px solid hsl(var(--border) / 0.4)',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => canSave && (e.currentTarget.style.background = 'hsl(var(--primary) / 0.25)')}
                onMouseLeave={e => canSave && (e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)')}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {canSave ? `${t('panelSave')} "${presetLabel || 'current'}"` : t('panelEnterExpr')}
              </button>
            </div>

            <div className="px-3 py-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('panelSavedPresets')}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {presets.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
                  <Bookmark className="w-8 h-8 opacity-20" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('panelNoPresets')}
                  </p>
                </div>
              ) : (
                presets.map((preset, i) => (
                  <div
                    key={preset.id}
                    className="px-3 py-3 group flex items-center gap-2 transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {editingId === preset.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { if (editName.trim()) renamePreset(preset.id, editName.trim()); setEditingId(null); loadPresets(); }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 text-xs rounded-lg px-2 py-1.5 font-mono focus:outline-none"
                        style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--foreground))' }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="flex-1 text-left min-w-0 py-0.5"
                        onClick={() => { onLoadPreset?.(preset.data); onClose(); }}
                      >
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{preset.name}</p>
                        <p className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {tool === 'calculator' ? preset.data?.expr : `${preset.data?.inputVal} ${preset.data?.fromUnit} → ${preset.data?.toUnit}`}
                        </p>
                      </button>
                    )}
                    {/* Action buttons — always visible on touch, hover on desktop */}
                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {editingId === preset.id ? (
                        <button
                          type="button"
                          onClick={() => { if (editName.trim()) renamePreset(preset.id, editName.trim()); setEditingId(null); loadPresets(); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingId(preset.id); setEditName(preset.name); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--foreground))'; e.currentTarget.style.background = 'hsl(var(--accent))'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { deletePreset(preset.id); loadPresets(); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--destructive))'; e.currentTarget.style.background = 'hsl(var(--destructive) / 0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; e.currentTarget.style.background = 'hsl(var(--muted))'; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom notch */}
        <div className="shrink-0 flex justify-center py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>
    </>
  );
}