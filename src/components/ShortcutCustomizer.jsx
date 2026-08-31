import { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

const BUTTON_GROUPS = [
  {
    label: 'Primary',
    buttons: [
      { id: '7', label: '7', defaultKey: '7' },   { id: '8', label: '8', defaultKey: '8' },
      { id: '9', label: '9', defaultKey: '9' },   { id: '÷', label: '÷', defaultKey: '/' },
      { id: '4', label: '4', defaultKey: '4' },   { id: '5', label: '5', defaultKey: '5' },
      { id: '6', label: '6', defaultKey: '6' },   { id: '×', label: '×', defaultKey: '*' },
      { id: '1', label: '1', defaultKey: '1' },   { id: '2', label: '2', defaultKey: '2' },
      { id: '3', label: '3', defaultKey: '3' },   { id: '-', label: '−', defaultKey: '-' },
      { id: '0', label: '0', defaultKey: '0' },   { id: '.', label: '.', defaultKey: '.' },
      { id: '=', label: '=', defaultKey: 'Enter' }, { id: '+', label: '+', defaultKey: '+' },
    ],
  },
  {
    label: 'Functions',
    buttons: [
      { id: 'AC',    label: 'AC',   defaultKey: 'Escape' },
      { id: '(',     label: '(',    defaultKey: '(' },
      { id: ')',     label: ')',    defaultKey: ')' },
      { id: 'DEL',   label: '⌫',   defaultKey: 'Backspace' },
      { id: 'sin(',  label: 'sin',  defaultKey: null },
      { id: 'cos(',  label: 'cos',  defaultKey: null },
      { id: 'tan(',  label: 'tan',  defaultKey: null },
      { id: 'π',     label: 'π',    defaultKey: null },
      { id: '^2',    label: 'x²',   defaultKey: null },
      { id: 'log(',  label: 'log',  defaultKey: null },
      { id: '1/',    label: '1/x',  defaultKey: null },
      { id: '%',     label: '%',    defaultKey: '%' },
    ],
  },
  {
    label: 'Advanced',
    buttons: [
      { id: 'sinh(',  label: 'sinh',   defaultKey: null },
      { id: 'cosh(',  label: 'cosh',   defaultKey: null },
      { id: 'tanh(',  label: 'tanh',   defaultKey: null },
      { id: '^3',     label: 'x³',     defaultKey: null },
      { id: 'nCr(',   label: 'nCr',    defaultKey: null },
      { id: 'nPr(',   label: 'nPr',    defaultKey: null },
      { id: 'log10(', label: 'log₁₀', defaultKey: null },
      { id: 'EE',     label: 'EE',     defaultKey: null },
    ],
  },
];

export function getDefaultShortcuts() {
  const map = {};
  for (const group of BUTTON_GROUPS) {
    for (const btn of group.buttons) {
      map[btn.id] = btn.defaultKey;
    }
  }
  return map;
}

export default function ShortcutCustomizer({ shortcuts, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...shortcuts });
  const [capturingId, setCapturingId] = useState(null);

  const handleKeyCapture = (e, btnId) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') { setCapturingId(null); return; }
    setDraft(prev => ({ ...prev, [btnId]: e.key }));
    setCapturingId(null);
  };

  const handleSave = () => {
    const overrides = {};
    for (const group of BUTTON_GROUPS) {
      for (const btn of group.buttons) {
        if (draft[btn.id] !== undefined && draft[btn.id] !== btn.defaultKey) {
          overrides[btn.id] = draft[btn.id];
        }
      }
    }
    localStorage.setItem('calc_shortcuts', JSON.stringify(overrides));
    onSave({ ...getDefaultShortcuts(), ...overrides });
    onClose();
  };

  const handleReset = () => {
    const defaults = getDefaultShortcuts();
    setDraft(defaults);
    localStorage.removeItem('calc_shortcuts');
    onSave(defaults);
  };

  const getDisplayKey = (btn) => {
    const val = draft[btn.id];
    if (val === null || val === undefined || val === '') return btn.defaultKey || '—';
    return val;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(220 16% 12%)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '8px 8px 24px rgba(0,0,0,0.7), -2px -2px 8px rgba(255,255,255,0.04)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-foreground text-sm">Customize Shortcuts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs px-5 py-2.5" style={{ color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>
          Click a key badge, then press any key to assign it.
        </p>

        {/* Button list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {BUTTON_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                {group.label}
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {group.buttons.map(btn => {
                  const isCapturing = capturingId === btn.id;
                  const displayKey = getDisplayKey(btn);
                  return (
                    <div key={btn.id} className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">{btn.label}</span>
                      <button
                        onClick={() => setCapturingId(btn.id)}
                        onKeyDown={isCapturing ? (e) => handleKeyCapture(e, btn.id) : undefined}
                        autoFocus={isCapturing}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold font-mono w-full text-center transition-all"
                        style={{
                          background: isCapturing ? 'hsl(217 91% 60% / 0.2)' : 'hsl(var(--muted))',
                          border: isCapturing ? '1px solid hsl(217 80% 50%)' : '1px solid hsl(var(--border))',
                          color: isCapturing ? 'hsl(217 80% 70%)' : 'hsl(var(--foreground))',
                          boxShadow: isCapturing ? '0 0 8px hsl(217 91% 60% / 0.3)' : undefined,
                        }}
                      >
                        {isCapturing ? '…' : displayKey}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}