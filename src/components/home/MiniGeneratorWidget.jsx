import { useState } from 'react';
import { Wand2, ChevronRight, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateLorem, generateStrongPassword, generatePin } from '@/lib/textGenerators';
import { useLanguage } from '@/lib/LanguageContext.jsx';

export default function MiniGeneratorWidget() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const gen = (fn) => { setOutput(fn()); setCopied(false); };
  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="panel p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" /> {t('navGenerator')}
        </span>
        <button onClick={() => navigate('/generator')} className="flex items-center text-[10px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>
          {t('homeViewAll')} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-1.5 mb-2">
        <button onClick={() => gen(() => generateLorem(2))} className="flex-1 text-xs font-medium py-1.5 rounded-lg text-foreground" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>{t('generatorLorem')}</button>
        <button onClick={() => gen(() => generateStrongPassword(16))} className="flex-1 text-xs font-medium py-1.5 rounded-lg text-foreground" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>{t('generatorStrongPassword')}</button>
        <button onClick={() => gen(() => generatePin(4))} className="flex-1 text-xs font-medium py-1.5 rounded-lg text-foreground" style={{ background: 'hsl(var(--secondary) / 0.5)' }}>{t('generatorPin')}</button>
      </div>
      {output && (
        <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
          <p className="flex-1 text-xs font-mono break-all text-foreground">{output}</p>
          <button onClick={copy} className="shrink-0" style={{ color: 'hsl(var(--primary))' }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}