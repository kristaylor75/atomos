import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { getActiveSets, ALL_FUNCTIONS } from '@/lib/quickAccess';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const BTN_TYPE_COLOR = {
  fn:    'hsl(220 15% 60%)',
  fn1x:  'hsl(220 15% 60%)',
  fact:  'hsl(220 15% 60%)',
  const: 'hsl(217 80% 68%)',
  op:    'hsl(38 92% 65%)',
  pow2:  'hsl(220 15% 60%)',
  pow3:  'hsl(220 15% 60%)',
};

export default function QuickAccessDrawer({ onInput, pressedBtn }) {
  const { t } = useLanguage();
  const [sets, setSets] = useState(() => getActiveSets());
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = getActiveSets();
      setSets(next);
      setActiveSetIdx(i => Math.min(i, Math.max(next.length - 1, 0)));
    };
    window.addEventListener('quickaccesschange', refresh);
    return () => window.removeEventListener('quickaccesschange', refresh);
  }, []);

  if (sets.length === 0) return null;

  const activeSet = sets[activeSetIdx] || sets[0];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'hsl(220 16% 11%)',
        border: '1px solid hsl(var(--border) / 0.5)',
        boxShadow: open ? '0 -4px 20px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors"
        onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--accent) / 0.3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color: 'hsl(38 92% 65%)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
            {t('calcQuickAccess')}
          </span>
          {open && activeSet && (
            <span className="text-[10px] font-semibold" style={{ color: 'hsl(217 80% 65%)' }}>
              — {activeSet.name}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
          : <ChevronUp className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        }
      </button>

      {/* Body */}
      <div
        style={{
          maxHeight: open ? '200px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className="px-2 pb-2 space-y-2">
          {/* Set tabs — only if more than one */}
          {sets.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {sets.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSetIdx(i)}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: i === activeSetIdx ? 'hsl(217 91% 60%)' : 'hsl(var(--muted))',
                    color: i === activeSetIdx ? '#fff' : 'hsl(var(--muted-foreground))',
                    border: i === activeSetIdx ? 'none' : '1px solid hsl(var(--border) / 0.5)',
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Function buttons */}
          {activeSet && activeSet.fnIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeSet.fnIds.map(fnId => {
                const fn = ALL_FUNCTIONS.find(f => f.id === fnId);
                if (!fn) return null;
                const isPressed = pressedBtn === fn.value;
                return (
                  <button
                    key={fnId}
                    onClick={() => onInput(fn.value, fn.type)}
                    title={fn.desc}
                    className={cn('calc-btn text-xs font-mono px-3 relative', isPressed && 'pressed')}
                    style={{
                      background: isPressed ? 'hsl(220 14% 10%)' : 'hsl(220 14% 17%)',
                      color: BTN_TYPE_COLOR[fn.type] || 'hsl(220 20% 80%)',
                      border: '1px solid hsl(var(--border) / 0.6)',
                      height: '2rem',
                      minWidth: '2.5rem',
                    }}
                  >
                    {fn.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('quickAccessSetEmpty')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}