import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical, Eye, EyeOff, Edit2, Check, X } from 'lucide-react';
import { ALL_FUNCTIONS, getQuickAccessSets, saveQuickAccessSets } from '@/lib/quickAccess';
import { useLanguage } from '@/lib/LanguageContext';

const NEW_SET_TEMPLATE = () => ({ id: Date.now().toString(), name: 'My Set', active: true, fnIds: [] });

export default function QuickAccessCustomizer() {
  const { t } = useLanguage();
  const [sets, setSets] = useState(() => getQuickAccessSets());
  const [selectedSet, setSelectedSet] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [nameVal, setNameVal] = useState('');

  const persist = (next) => { setSets(next); saveQuickAccessSets(next); };

  const addSet = () => {
    const s = NEW_SET_TEMPLATE();
    const next = [...sets, s];
    persist(next);
    setSelectedSet(s.id);
  };

  const removeSet = (id) => {
    persist(sets.filter(s => s.id !== id));
    if (selectedSet === id) setSelectedSet(null);
  };

  const toggleActive = (id) => {
    persist(sets.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const startRename = (s) => { setEditingName(s.id); setNameVal(s.name); };
  const commitRename = (id) => {
    persist(sets.map(s => s.id === id ? { ...s, name: nameVal.trim() || s.name } : s));
    setEditingName(null);
  };

  const addFn = (setId, fnId) => {
    persist(sets.map(s => s.id === setId && !s.fnIds.includes(fnId)
      ? { ...s, fnIds: [...s.fnIds, fnId] } : s));
  };

  const removeFn = (setId, fnId) => {
    persist(sets.map(s => s.id === setId
      ? { ...s, fnIds: s.fnIds.filter(id => id !== fnId) } : s));
  };

  const onDragEnd = (result) => {
    if (!result.destination || !selectedSet) return;
    const set = sets.find(s => s.id === selectedSet);
    if (!set) return;
    const items = Array.from(set.fnIds);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    persist(sets.map(s => s.id === selectedSet ? { ...s, fnIds: items } : s));
  };

  const activeSet = sets.find(s => s.id === selectedSet);

  return (
    <div className="space-y-4">
      {/* Sets list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('quickAccessYourSets')}
          </span>
          <button
            onClick={addSet}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(217 80% 70%)', border: '1px solid hsl(var(--primary) / 0.25)' }}
          >
            <Plus className="w-3 h-3" /> {t('quickAccessNewSet')}
          </button>
        </div>

        {sets.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('quickAccessNoSets')}
          </p>
        )}

        {sets.map(s => (
          <div
            key={s.id}
            className="rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all"
            style={{
              background: selectedSet === s.id ? 'hsl(217 91% 60% / 0.1)' : 'hsl(var(--muted))',
              border: selectedSet === s.id ? '1px solid hsl(217 80% 50% / 0.35)' : '1px solid hsl(var(--border) / 0.5)',
            }}
            onClick={() => setSelectedSet(selectedSet === s.id ? null : s.id)}
          >
            {editingName === s.id ? (
              <input
                autoFocus
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(s.id); if (e.key === 'Escape') setEditingName(null); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-transparent text-sm font-medium outline-none border-b"
                style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--foreground))' }}
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-foreground truncate">{s.name}</span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
              {s.fnIds.length}
            </span>
            {editingName === s.id ? (
              <>
                <button onClick={e => { e.stopPropagation(); commitRename(s.id); }} className="p-1" style={{ color: 'hsl(173 58% 55%)' }}><Check className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); setEditingName(null); }} className="p-1" style={{ color: 'hsl(var(--muted-foreground))' }}><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <button onClick={e => { e.stopPropagation(); startRename(s); }} className="p-1 rounded transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={ev => ev.currentTarget.style.color='hsl(var(--foreground))'} onMouseLeave={ev => ev.currentTarget.style.color='hsl(var(--muted-foreground))'}><Edit2 className="w-3 h-3" /></button>
                <button onClick={e => { e.stopPropagation(); toggleActive(s.id); }} className="p-1 rounded transition-colors" style={{ color: s.active ? 'hsl(217 80% 65%)' : 'hsl(var(--muted-foreground))' }} title={s.active ? 'Hide in drawer' : 'Show in drawer'}>{s.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</button>
                <button onClick={e => { e.stopPropagation(); removeSet(s.id); }} className="p-1 rounded transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={ev => ev.currentTarget.style.color='hsl(var(--destructive))'} onMouseLeave={ev => ev.currentTarget.style.color='hsl(var(--muted-foreground))'}><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Set editor */}
      {activeSet && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('quickAccessEdit')} "{activeSet.name}"
          </span>

          {/* Current items — draggable */}
          <div>
            <p className="text-[10px] mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('quickAccessDragToReorder')}</p>
            {activeSet.fnIds.length === 0 ? (
              <p className="text-xs py-3 text-center rounded-xl" style={{ color: 'hsl(var(--muted-foreground))', border: '1px dashed hsl(var(--border))' }}>
                {t('quickAccessAddFunctions')}
              </p>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="qaset" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-wrap gap-1.5 p-2 rounded-xl min-h-[48px]"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.5)' }}
                    >
                      {activeSet.fnIds.map((fnId, index) => {
                        const fn = ALL_FUNCTIONS.find(f => f.id === fnId);
                        if (!fn) return null;
                        return (
                          <Draggable key={fnId} draggableId={fnId} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold select-none"
                                style={{
                                  background: snap.isDragging ? 'hsl(217 91% 60%)' : 'hsl(220 14% 22%)',
                                  color: snap.isDragging ? '#fff' : 'hsl(220 20% 80%)',
                                  border: '1px solid hsl(var(--border))',
                                  ...prov.draggableProps.style,
                                }}
                              >
                                <span {...prov.dragHandleProps} className="cursor-grab active:cursor-grabbing" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  <GripVertical className="w-3 h-3" />
                                </span>
                                <span className="font-mono">{fn.label}</span>
                                <button
                                  onClick={() => removeFn(activeSet.id, fnId)}
                                  className="ml-0.5"
                                  style={{ color: 'hsl(var(--muted-foreground))' }}
                                  onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--destructive))'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* Function picker */}
          <div>
            <p className="text-[10px] mb-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('quickAccessClickToAdd')}</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_FUNCTIONS.map(fn => {
                const already = activeSet.fnIds.includes(fn.id);
                return (
                  <button
                    key={fn.id}
                    onClick={() => !already && addFn(activeSet.id, fn.id)}
                    disabled={already}
                    title={fn.desc}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all"
                    style={{
                      background: already ? 'hsl(217 91% 60% / 0.15)' : 'hsl(var(--secondary))',
                      color: already ? 'hsl(217 80% 60%)' : 'hsl(var(--foreground))',
                      border: already ? '1px solid hsl(217 80% 50% / 0.3)' : '1px solid hsl(var(--border))',
                      opacity: already ? 0.5 : 1,
                      cursor: already ? 'default' : 'pointer',
                    }}
                  >
                    {fn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}