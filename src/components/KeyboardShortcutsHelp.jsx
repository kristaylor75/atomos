import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    title: 'Calculator',
    rows: [
      { keys: ['0–9', '.'], desc: 'Enter digits' },
      { keys: ['+', '−', '*', '/'], desc: 'Basic operators' },
      { keys: ['Enter', '='], desc: 'Calculate' },
      { keys: ['Backspace'], desc: 'Delete last character' },
      { keys: ['Esc'], desc: 'Clear all (AC)' },
      { keys: ['(', ')'], desc: 'Parentheses' },
      { keys: ['%'], desc: 'Percentage' },
      { keys: ['Tab'], desc: 'Toggle Deg / Rad' },
    ],
  },
  {
    title: 'Navigation',
    rows: [
      { keys: ['⌥1'], desc: 'Calculator' },
      { keys: ['⌥2'], desc: 'Converter' },
      { keys: ['⌥3'], desc: 'Date & Time' },
      { keys: ['⌥4'], desc: 'Geometry' },
      { keys: ['⌥5'], desc: 'Graphing' },
      { keys: ['⌥6'], desc: 'Radio' },
      { keys: ['⌥7'], desc: 'History' },
      { keys: ['⌥⇧C'], desc: 'Clear all history' },
    ],
  },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-secondary text-[11px] font-mono text-foreground leading-none">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Keyboard shortcuts (?)"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
          'bg-secondary/60 border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
          open && 'bg-primary text-primary-foreground border-primary hover:bg-primary'
        )}
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className={cn(
          'text-[10px] font-mono px-1 py-0.5 rounded border leading-none',
          open ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'border-border bg-background'
        )}>?</kbd>
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 grid sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {SECTIONS.map(section => (
                  <div key={section.title}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {section.title}
                    </p>
                    <div className="space-y-2">
                      {section.rows.map((row, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">{row.desc}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {row.keys.map((k, ki) => (
                              <span key={ki} className="flex items-center gap-1">
                                {ki > 0 && <span className="text-muted-foreground/40 text-[10px]">/</span>}
                                <Kbd>{k}</Kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Press <Kbd>?</Kbd> or <Kbd>Esc</Kbd> to dismiss</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}