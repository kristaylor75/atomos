import { useState } from 'react';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toUpperCase, toTitleCase } from '@/lib/textGenerators';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniTextConverterWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [text, setText] = useState('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> {t('navTextConverter')}
        </span>
        <button onClick={() => navigate('/text-converter')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type text…"
        rows={2}
        className="neu-input w-full text-sm mb-2 resize-none"
      />
      {text && (
        <div className="space-y-1">
          <p className="text-xs truncate text-foreground"><span className="opacity-60">UPPER:</span> {toUpperCase(text)}</p>
          <p className="text-xs truncate text-foreground"><span className="opacity-60">Title:</span> {toTitleCase(text)}</p>
          <p className="text-[10px] opacity-60">{wordCount} {t('docsWords')}</p>
        </div>
      )}
    </div>
  );
}