import { useState, useEffect } from 'react';
import { Star, Check } from 'lucide-react';
import { saveConversionShortcut, isDuplicateShortcut } from '@/lib/conversionShortcuts';

export default function SaveShortcutButton({ category, fromUnit, toUnit, fromLabel, toLabel }) {
  const [saved, setSaved] = useState(() => isDuplicateShortcut(category, fromUnit, toUnit));

  useEffect(() => {
    setSaved(isDuplicateShortcut(category, fromUnit, toUnit));
  }, [category, fromUnit, toUnit]);

  const handleSave = () => {
    if (saved) return;
    saveConversionShortcut({ category, fromUnit, toUnit, label: `${fromLabel} → ${toLabel}` });
    setSaved(true);
  };

  return (
    <button
      onClick={handleSave}
      disabled={saved}
      title={saved ? 'Saved to Quick Access' : 'Save as Quick Access shortcut'}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all disabled:opacity-70 shrink-0"
      style={{
        background: saved ? 'hsl(38 92% 60% / 0.15)' : 'hsl(var(--secondary) / 0.6)',
        borderColor: saved ? 'hsl(38 92% 60% / 0.4)' : 'hsl(var(--border))',
        color: saved ? 'hsl(38 92% 60%)' : 'hsl(var(--muted-foreground))',
      }}
    >
      {saved ? <Check className="w-3 h-3" /> : <Star className="w-3 h-3" />}
      {saved ? 'Saved' : 'Save Shortcut'}
    </button>
  );
}