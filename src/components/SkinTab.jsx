import { Check } from 'lucide-react';
import { SKINS, getSkin, setSkin } from '@/lib/skins';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function SkinTab() {
  const { t } = useLanguage();
  const [activeSkin, setActiveSkin] = useState(getSkin);

  const handleSelect = (id) => {
    setActiveSkin(id);
    setSkin(id);
  };

  return (
    <div className="space-y-2">
      {SKINS.map((skin) => {
        const isActive = activeSkin === skin.id;
        return (
          <button
            key={skin.id}
            onClick={() => handleSelect(skin.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: isActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
              border: isActive ? '1px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--border))',
              boxShadow: isActive ? '0 0 12px hsl(var(--primary) / 0.15)' : '2px 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {/* Color preview swatches */}
            <div className="flex gap-1 shrink-0">
              {skin.preview.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-8 rounded-sm"
                  style={{ background: color, border: '1px solid rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                {t(skin.nameKey)}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t(skin.descriptionKey)}
              </p>
            </div>

            {/* Check */}
            {isActive && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}