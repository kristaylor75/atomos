import { useState, useRef, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function GraphSettings({
  gridVisible,
  onGridVisibleChange,
  axisNumbersVisible,
  onAxisNumbersVisibleChange,
  minorGridlinesVisible,
  onMinorGridlinesVisibleChange,
  showArrows,
  onShowArrowsChange,
  lockViewport,
  onLockViewportChange,
  angleMode,
  onAngleModeChange,
  xAxisLabel,
  onXAxisLabelChange,
  yAxisLabel,
  onYAxisLabelChange,
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 420;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    let top, left, right;
    
    // Prefer above; if not enough space, prefer to the left
    if (spaceAbove >= popoverHeight + 8) {
      top = rect.top - popoverHeight - 6;
      right = Math.max(8, window.innerWidth - rect.right);
      left = 'auto';
    } else if (spaceLeft >= popoverWidth + 8) {
      // Position to the left, vertically centered with button
      top = rect.top + rect.height / 2 - popoverHeight / 2;
      left = rect.left - popoverWidth - 8;
      right = 'auto';
    } else {
      // Fallback: below the button
      top = rect.bottom + 6;
      right = Math.max(8, window.innerWidth - rect.right);
      left = 'auto';
    }

    setPopoverStyle({
      position: 'fixed',
      top: Math.max(8, top),
      left,
      right,
      zIndex: 9999,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        title="Graph settings"
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: open ? 'hsl(217 91% 60% / 0.2)' : 'hsl(220 16% 16% / 0.9)',
          border: '1px solid hsl(var(--border))',
          color: open ? 'hsl(217 80% 70%)' : 'hsl(var(--muted-foreground))',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            ...popoverStyle,
            background: 'hsl(220 16% 12%)',
            border: '1px solid hsl(var(--border))',
            boxShadow: '8px 8px 24px rgba(0,0,0,0.6), -2px -2px 8px rgba(255,255,255,0.04)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            width: '280px',
            maxHeight: '420px',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{t('navSettings')}</h3>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 flex items-center justify-center rounded transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--foreground))'}
              onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--muted-foreground))'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">

            {/* Grid Section */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={gridVisible}
                  onChange={e => onGridVisibleChange(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-foreground">{t('graphGrid')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer ml-6 text-xs">
                <input
                  type="checkbox"
                  checked={minorGridlinesVisible}
                  onChange={e => onMinorGridlinesVisibleChange(e.target.checked)}
                  disabled={!gridVisible}
                  className="w-3.5 h-3.5"
                  style={{ opacity: gridVisible ? 1 : 0.5 }}
                />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('graphMinorGridlines')}</span>
              </label>
            </div>

            {/* Axes Section */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={axisNumbersVisible}
                  onChange={e => onAxisNumbersVisibleChange(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-semibold text-foreground">{t('graphAxisNumbers')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer ml-6 text-xs">
                <input
                  type="checkbox"
                  checked={showArrows}
                  onChange={e => onShowArrowsChange(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{t('graphArrows')}</span>
              </label>
            </div>

            {/* Axis Labels */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground mb-1">{t('graphXAxisLabel')}</label>
              <input
                type="text"
                value={xAxisLabel}
                onChange={e => onXAxisLabelChange(e.target.value)}
                placeholder="e.g. x"
                className="neu-input w-full text-xs py-1.5 px-2"
                style={{ fontSize: '0.75rem' }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground mb-1">{t('graphYAxisLabel')}</label>
              <input
                type="text"
                value={yAxisLabel}
                onChange={e => onYAxisLabelChange(e.target.value)}
                placeholder="e.g. y"
                className="neu-input w-full text-xs py-1.5 px-2"
                style={{ fontSize: '0.75rem' }}
              />
            </div>

            {/* Lock Viewport */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lockViewport}
                onChange={e => onLockViewportChange(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-foreground">{t('graphLockViewport')}</span>
            </label>

            {/* Angle Mode */}
            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <label className="block text-xs font-semibold text-foreground mb-2">{t('graphAngleMode')}</label>
              <div className="flex gap-1">
                {['degrees', 'radians'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => onAngleModeChange(mode)}
                    className="flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all"
                    style={{
                      background: angleMode === mode ? 'hsl(217 91% 60%)' : 'hsl(var(--muted))',
                      color: angleMode === mode ? '#fff' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {mode === 'degrees' ? t('graphDegrees') : t('graphRadians')}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}