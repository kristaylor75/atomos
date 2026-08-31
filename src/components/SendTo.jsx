import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Share2, Calculator, ArrowLeftRight, Triangle, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext.jsx';

const TOOL_KEYS = [
  { key: 'calculator', icon: Calculator, labelKey: 'navCalculator' },
  { key: 'converter',  icon: ArrowLeftRight, labelKey: 'navConverter' },
  { key: 'geometry',   icon: Triangle, labelKey: 'navGeometry' },
  { key: 'graphing',   icon: LineChart, labelKey: 'navGraphing' },
];

// value        – the numeric string to send
// exclude      – key of the current tool (always hidden)
// converterCategory – if set, the converter will open on this category
// allowedTools – optional array of tool keys to show; if omitted shows all except exclude
export default function SendTo({ value, exclude, converterCategory, allowedTools, className }) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const popoverHeight = 130;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const top = spaceAbove >= popoverHeight + 8 || spaceAbove > spaceBelow
      ? rect.top - popoverHeight - 6
      : rect.bottom + 6;

    setPopoverStyle({
      position: 'fixed',
      top,
      right: window.innerWidth - rect.right,
      zIndex: 9999,
    });
  }, [open]);

  if (!value || isNaN(parseFloat(value))) return null;

  let targets = TOOL_KEYS.map(tk => ({ ...tk, label: t(tk.labelKey) })).filter(t => t.key !== exclude);
  if (allowedTools) {
    targets = targets.filter(t => allowedTools.includes(t.key));
  }

  if (targets.length === 0) return null;

  const go = (tool) => {
    setOpen(false);
    if (tool.key === 'calculator') {
      navigate(`/calculator?calc=${encodeURIComponent(value)}`);
    } else if (tool.key === 'converter') {
      const cat = converterCategory ? `&category=${encodeURIComponent(converterCategory)}` : '';
      navigate(`/converter?value=${encodeURIComponent(value)}${cat}`);
    } else if (tool.key === 'geometry') {
      navigate('/geometry', { state: { incomingValue: value, ts: Date.now() } });
    } else if (tool.key === 'graphing') {
      navigate(`/graphing?expr=${encodeURIComponent(value)}`);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        title="Send to another tool"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all',
          'bg-secondary/60 border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary',
          className
        )}
      >
        <Share2 className="w-3 h-3" />
        {t('sendToButton') || 'Send to…'}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            style={{
              ...popoverStyle,
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '6px 6px 16px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.04)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              minWidth: '160px',
            }}
          >
            <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-medium uppercase tracking-wider">
              {t('sendToHeader') || 'Send'} <span className="text-foreground font-semibold">{value}</span> {t('sendToHeaderTo') || 'to'}
            </p>
            {targets.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.key}
                  onClick={() => go(tool)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2.5',
                    i > 0 && 'border-t border-border/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {tool.label}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}